require('dotenv').config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const connectDB = require("./db");
const usersRouter = require("./routes/users");
const productsRouter = require("./routes/products");
const notificationsRouter = require("./routes/notifications");

const app = express();
const PORT = process.env.PORT || 8000;

connectDB();

// Security and general middleware
app.use(helmet());
app.use(cors({
  origin: "http://localhost:5173", // Frontend URL
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/notifications", notificationsRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Catch all handler for unknown routes
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
