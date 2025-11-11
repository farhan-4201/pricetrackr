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

// ✅ DEBUG: Log all requests to this router
router.use((req, res, next) => {
  console.log(`[PRODUCTS ROUTER] ${req.method} ${req.path}`);
  console.log(`[PRODUCTS ROUTER] Full URL: ${req.originalUrl}`);
  console.log(`[PRODUCTS ROUTER] Query string: ${JSON.stringify(req.query)}`);
  next();
});

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
// ✅ IMPORTANT: All specific routes MUST come before catch-all /:id routes

// Test endpoint
router.get("/test", (req, res) => {
  console.log("[TEST] Test endpoint called");
  res.json({ status: "Products router working!", timestamp: new Date().toISOString() });
});

// ✅✅✅ AUTOCOMPLETE - PUBLIC ENDPOINT (NO AUTH) ✅✅✅
router.get("/autocomplete", async (req, res) => {
  try {
    console.log("[AUTOCOMPLETE] Handler called with query:", req.query.q);
    
    const { q: query, limit = 5 } = req.query;

    if (!query || query.trim().length < 1) {
      console.log("[AUTOCOMPLETE] Query too short or empty");
      return res.status(200).json({ suggestions: [] });
    }

    const trimmedQuery = query.trim();
    console.log(`[AUTOCOMPLETE] Processing query: "${trimmedQuery}"`);

    try {
      // Check collection size
      const totalDocs = await SearchResult.countDocuments();
      console.log(`[AUTOCOMPLETE] Total documents in SearchResult: ${totalDocs}`);

      if (totalDocs === 0) {
        console.log("[AUTOCOMPLETE] SearchResult collection is empty");
        return res.status(200).json({ suggestions: [] });
      }

      // Build regex pattern for matching (case-insensitive, anywhere in the string)
      const regex = new RegExp(trimmedQuery, 'i');

      // Find all documents and extract matching product names
      const searchResults = await SearchResult.find({}).lean().limit(100);
      console.log(`[AUTOCOMPLETE] Fetched ${searchResults.length} documents to scan`);

      const uniqueSuggestions = new Map(); // Use Map to avoid duplicates and track count

      searchResults.forEach(doc => {
        if (doc.results && Array.isArray(doc.results)) {
          doc.results.forEach(product => {
            if (product.name && regex.test(product.name)) {
              const key = product.name.toLowerCase();
              if (!uniqueSuggestions.has(key)) {
                uniqueSuggestions.set(key, {
                  text: product.name,
                  type: 'product',
                  marketplace: product.marketplace || 'Unknown',
                  price: product.price
                });
              }
            }
          });
        }
      });

      // Convert to array and sort by relevance (exact prefix match first)
      const suggestions = Array.from(uniqueSuggestions.values())
        .sort((a, b) => {
          const aStarts = a.text.toLowerCase().startsWith(trimmedQuery.toLowerCase());
          const bStarts = b.text.toLowerCase().startsWith(trimmedQuery.toLowerCase());
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.text.localeCompare(b.text);
        })
        .slice(0, parseInt(limit) || 5);

      console.log(`[AUTOCOMPLETE] Found ${suggestions.length} unique suggestions matching "${trimmedQuery}"`);
      
      return res.status(200).json({
        suggestions,
        count: suggestions.length,
        query: trimmedQuery
      });

    } catch (dbError) {
      console.error("[AUTOCOMPLETE] Database error:", dbError.message);
      console.error("[AUTOCOMPLETE] Stack:", dbError.stack);
      return res.status(200).json({ suggestions: [] });
    }

  } catch (error) {
    console.error("[AUTOCOMPLETE] Unhandled error:", error.message);
    console.error("[AUTOCOMPLETE] Stack:", error.stack);
    return res.status(500).json({ 
      error: "Failed to fetch suggestions",
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Search results - public
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
    console.error("[SEARCH-RESULTS] Error:", error);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

// Scrape products - requires auth
router.post("/scrape", scrapingRateLimiter, validateSearch, scraperController);

// Stats - requires auth
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
    console.error("[STATS] Error:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Search products - requires auth
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
    console.error("[SEARCH] Error:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
});

// Get all products - requires auth
router.get("/", auth, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id, isActive: true })
      .sort({ lastChecked: -1 });
    res.json(products);
  } catch (error) {
    console.error("[GET ALL] Error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Add a new product - requires auth
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
    console.error("[ADD] Error:", err);
    res.status(400).json({ error: err.message });
  }
});

// ✅ SPECIFIC /:id ROUTES (must come before generic /:id catch-all)

// Price history
router.get("/:id/history", auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const history = product.priceHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(history);
  } catch (error) {
    console.error("[HISTORY] Error:", error);
    res.status(500).json({ error: "Failed to fetch price history" });
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
    console.error("[ADD ALERT] Error:", error);
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
    console.error("[UPDATE ALERT] Error:", error);
    res.status(500).json({ error: "Failed to update alert" });
  }
});

// Update product price
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
    console.error("[UPDATE PRICE] Error:", error);
    res.status(500).json({ error: "Failed to update price" });
  }
});

// ✅ GENERIC /:id ROUTES (must come LAST)

// Get product by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("[GET BY ID] Error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
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
    console.error("[UPDATE] Error:", error);
    res.status(400).json({ error: error.message });
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
    console.error("[DELETE] Error:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
