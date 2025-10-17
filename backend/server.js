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
// 🔄 CHANGED THIS LINE 👇
import { createRateLimiters } from "./middleware/rateLimiter.js";
import { startPriceMonitoring } from './price-monitor.js';

// Winston logging setup
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
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

const app = express();

// ✅ THIS MUST BE CALLED BEFORE USING req.ip in middleware
app.set('trust proxy', true);

// 🔄 CREATE RATE LIMITERS *AFTER* setting trust proxy
const { apiRateLimiter, authRateLimiter, scrapingRateLimiter } = createRateLimiters();

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  logger.info(`Server started on port ${PORT}`);
});

// ✅ WebSocket server and DB connection
createWebSocketServer(server);

connectDB().then(() => {
  logger.info('Starting price monitoring cronjob...');
  startPriceMonitoring();
  logger.info('Price monitoring cronjob started successfully');
}).catch((error) => {
  logger.error('Failed to start price monitoring cronjob:', error);
});

// ✅ Helmet middleware for security headers
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

// ✅ ✅ ✅ CORS FIX STARTS HERE

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(',').map(origin => origin.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ✅ ✅ ✅ CORS FIX ENDS HERE

// ✅ Session and Passport setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Rate limiting — now correctly initialized
app.use('/api/', apiRateLimiter);
// If you want to use auth limiter for specific auth routes, you can apply it like:
// app.use('/api/v1/users/login', authRateLimiter);

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

// ✅ Health check
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

global.logger = logger;
