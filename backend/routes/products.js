import express from "express";
import mongoose from "mongoose";
import { authenticate as auth } from "../middleware/auth.js";
import SearchResult from "../models/search_result.js";
import { scrapingRateLimiter } from "../middleware/rateLimiter.js";
import { validateSearch } from "../middleware/validation.js";
import { scraperController } from "../controllers/scraper.controller.js";

/**
 * Normalize marketplace values to match schema enum
 */
function normalizeMarketplace(marketplace) {
  if (!marketplace) return null;
  const value = marketplace.toLowerCase();
  if (value === "daraz") return "Daraz";
  if (value === "priceoye") return "PriceOye";
  return marketplace;
}

const router = express.Router();

// --- Product Schema ---
const productSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  name: { type: String, required: true },
  sku: { type: String },
  category: { type: String },
  currentPrice: { type: Number, required: true },
  lowestPrice: { type: Number },
  highestPrice: { type: Number },
  priceChange24h: { type: Number, default: 0 },
  priceHistory: [{
    price: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  }],
  alerts: [{
    type: {
      type: String,
      enum: ['priceDrop', 'priceRise'],
      required: true
    },
    threshold: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  isActive: { type: Boolean, default: true },
  lastChecked: { type: Date, default: Date.now }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

// --- ROUTES ---

// Get all products for current user
router.get("/", auth, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id, isActive: true })
      .sort({ lastChecked: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Add a new product
router.post("/", auth, async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      userId: req.user._id,
      userEmail: req.user.emailAddress,
      priceHistory: [{ price: req.body.currentPrice, date: new Date() }],
      lowestPrice: req.body.currentPrice,
      highestPrice: req.body.currentPrice
    });
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update product price and track history
router.put("/:id/price", auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const oldPrice = product.currentPrice;
    const newPrice = req.body.price;

    product.priceHistory.push({ price: newPrice, date: new Date() });
    product.currentPrice = newPrice;

    if (newPrice < product.lowestPrice) product.lowestPrice = newPrice;
    if (newPrice > product.highestPrice) product.highestPrice = newPrice;

    if (oldPrice !== 0) {
      product.priceChange24h = ((newPrice - oldPrice) / oldPrice) * 100;
    }

    product.lastChecked = new Date();
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to update price" });
  }
});

// Update product details
router.put("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add alert
router.post("/:id/alerts", auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.alerts.push(req.body);
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to add alert" });
  }
});

// Update alert
router.put("/:id/alerts/:alertId", auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const alert = product.alerts.id(req.params.alertId);
    if (!alert) return res.status(404).json({ error: "Alert not found" });

    Object.assign(alert, req.body);
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to update alert" });
  }
});

// Delete product (soft delete)
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product removed from watchlist" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Search products
router.get("/search", auth, async (req, res) => {
  try {
    const { query, category } = req.query;
    let filter = { userId: req.user._id, isActive: true };

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { sku: { $regex: query, $options: "i" } }
      ];
    }
    if (category && category !== "all") filter.category = category;

    const products = await Product.find(filter).sort({ lastChecked: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to search products" });
  }
});

// Product stats
router.get("/stats/overview", auth, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id, isActive: true });
    const stats = {
      totalProducts: products.length,
      totalAlerts: products.reduce((sum, p) => sum + p.alerts.filter(a => a.isActive).length, 0),
      activeAlerts: products.reduce((sum, p) => sum + p.alerts.filter(a => a.isActive).length, 0),
      triggeredAlerts: products.reduce((sum, p) => sum + p.alerts.filter(a => !a.isActive).length, 0)
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Price history
router.get("/:id/history", auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const history = product.priceHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch price history" });
  }
});

// Scrape products from all marketplaces
router.post("/scrape", scrapingRateLimiter, validateSearch, scraperController);

// Get saved search results
router.get("/search-results", async (req, res) => {
  try {
    const { query, limit = 10, page = 1 } = req.query;
    let filter = {};

    if (query) {
      filter.query = { $regex: query, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchResults = await SearchResult
      .find(filter)
      .sort({ searchedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await SearchResult.countDocuments(filter);

    res.json({
      results: searchResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

export default router;
