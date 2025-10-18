import 'dotenv/config';
import express from "express";
import session from "express-session";
import helmet from "helmet";
import cors from "cors";
import winston from "winston";
import connectDB from "./db.js";
import usersRouter from "./routes/users.js";
import productsRouter from "./routes/products.js";
import notificationsRouter from "./routes/notifications.js";
import watchlistRouter from "./routes/watchlist.js";
import passport from "./middleware/googleAuth.js";
import { createWebSocketServer } from './websocket.js';
import { createRateLimiters } from "./middleware/rateLimiter.js";
import { startPriceMonitoring } from './price-monitor.js';

// 🪵 Logger setup with Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'price-tracker-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

const app = express();

// ✅ Must come before any proxy-dependent middleware
app.set('trust proxy', true);

// ✅ Create rate limiters
const { apiRateLimiter, authRateLimiter, scrapingRateLimiter } = createRateLimiters();

// ✅ Start server
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  logger.info(`Server started on port ${PORT}`);
});

// ✅ Init WebSocket and DB
createWebSocketServer(server);
connectDB()
  .then(() => {
    logger.info('Starting price monitoring cronjob...');
    startPriceMonitoring();
    logger.info('Price monitoring cronjob started successfully');
  })
  .catch((error) => {
    logger.error('Failed to start price monitoring cronjob:', error);
  });

// ✅ Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// ✅ CORS setup — logs and restricts origins from .env
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(',').map(origin => origin.trim());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    console.log("🧾 Incoming Origin:", origin);
  }
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // server-to-server or curl
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn("❌ Blocked by CORS:", origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ✅ Session & Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// ✅ Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Rate limiting
app.use('/api/', apiRateLimiter);

// ✅ Log every API request
app.use('/api/', (req, res, next) => {
  logger.info('API Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// ✅ Routes
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/notifications", notificationsRouter);
app.use("/api/v1/watchlist", watchlistRouter);

// ✅ Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ✅ 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  logger.error('Global error handler', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
  });
});

// ✅ Export logger globally (optional)
global.logger = logger;
