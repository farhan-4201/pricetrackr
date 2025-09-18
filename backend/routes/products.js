import express from "express";
import mongoose from "mongoose";
import { authenticate as auth } from "../middleware/auth.js";
import scraperController from "../controllers/scraper.controller.js";
import SearchResult from "../models/search_result.js";
import { scrapingRateLimiter } from "../middleware/rateLimiter.js";
import { validateSearch } from "../middleware/validation.js";

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

// --- Scraping Endpoints ---

// Daraz scrape
router.post("/scrape/daraz", scrapingRateLimiter, validateSearch, async (req, res) => {
  try {
    const { query } = req.body;
    console.log(`[${new Date().toISOString()}] Daraz scrape: ${query} from IP: ${req.ip}`);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), 30000)
    );
    const scrapePromise = scraperController.scrapeDaraz(query);
    const results = await Promise.race([scrapePromise, timeoutPromise]);

    if (results.products?.length > 0) {
      const searchResult = new SearchResult({
        query,
        results: results.products.map(p => ({
          name: p.name,
          price: p.price,
          url: p.url,
          imageUrl: p.imageUrl,
          marketplace: "Daraz"
        })),
        searchedAt: new Date(),
        resultCount: results.products.length
      });
      await searchResult.save();
    }

    res.json({ success: true, source: "Daraz", products: results.products, total: results.products.length, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error(`Daraz scrape error: ${error.message}`);
    res.status(error.message.includes("timeout") ? 408 : 500).json({ error: error.message, source: "Daraz", timestamp: new Date().toISOString() });
  }
});

// PriceOye scrape
router.post("/scrape/priceoye", scrapingRateLimiter, validateSearch, async (req, res) => {
  try {
    const { query } = req.body;
    console.log(`[${new Date().toISOString()}] PriceOye scrape: ${query} from IP: ${req.ip}`);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), 45000)
    );
    const scrapePromise = scraperController.scrapePriceOye(query);
    const results = await Promise.race([scrapePromise, timeoutPromise]);

    if (results.products?.length > 0) {
      const searchResult = new SearchResult({
        query,
        results: results.products.map(p => ({
          name: p.name,
          price: p.price,
          url: p.url,
          imageUrl: p.imageUrl,
          marketplace: "PriceOye"
        })),
        searchedAt: new Date(),
        resultCount: results.products.length
      });
      await searchResult.save();
    }

    res.json({ success: true, source: "PriceOye", products: results.products, total: results.products.length, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error(`PriceOye scrape error: ${error.message}`);
    res.status(error.message.includes("timeout") ? 408 : 500).json({ error: error.message, source: "PriceOye", timestamp: new Date().toISOString() });
  }
});

// Combined scrape
router.post("/scrape", scrapingRateLimiter, validateSearch, async (req, res) => {
  try {
    const { query, limit = 20 } = req.body;
    console.log(`[${new Date().toISOString()}] Combined scrape: ${query} from IP: ${req.ip}`);

    const darazTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Daraz request timeout")), 30000));
    const priceoyeTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("PriceOye request timeout")), 45000));

    const [darazResult, priceoyeResult] = await Promise.allSettled([
      Promise.race([scraperController.scrapeDaraz(query), darazTimeout]),
      Promise.race([scraperController.scrapePriceOye(query), priceoyeTimeout])
    ]);

    const allProducts = [];
    const sources = { daraz: { success: false, count: 0, error: null }, priceoye: { success: false, count: 0, error: null } };

    if (darazResult.status === "fulfilled") {
      allProducts.push(...(darazResult.value.products || []));
      sources.daraz = { success: true, count: darazResult.value.products.length };
    } else {
      sources.daraz.error = darazResult.reason?.message || "Unknown error";
    }

    if (priceoyeResult.status === "fulfilled") {
      allProducts.push(...(priceoyeResult.value.products || []));
      sources.priceoye = { success: true, count: priceoyeResult.value.products.length };
    } else {
      sources.priceoye.error = priceoyeResult.reason?.message || "Unknown error";
    }

    const filteredProducts = allProducts
      .filter(p => p.price && typeof p.price === "number" && p.price > 0)
      .sort((a, b) => a.price - b.price)
      .slice(0, limit);

    if (filteredProducts.length > 0) {
      const searchResult = new SearchResult({
        query,
        results: filteredProducts.map(p => ({
          name: p.name,
          price: p.price,
          url: p.url,
          imageUrl: p.imageUrl,
          marketplace: p.marketplace
        })),
        searchedAt: new Date(),
        resultCount: filteredProducts.length
      });
      await searchResult.save();
    }

    res.json({ success: true, query, products: filteredProducts, total: filteredProducts.length, sources, timestamp: new Date().toISOString(), cached: false });
  } catch (error) {
    console.error(`Combined scrape error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message || "Internal server error", query: req.body.query, products: [], total: 0, timestamp: new Date().toISOString() });
  }
});

export default router;
