import express from "express";
import Product from "../models/product.js";
import { authenticate as auth } from "../middleware/auth.js";
import scraperController from '../controllers/scraper.controller.js';
import SearchResult from '../models/search_result.js';

const router = express.Router();

// Note: validateSearch not used in current implementation, can be added later if needed

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

// Add a new product to watchlist
router.post("/", auth, async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      userId: req.user._id,
      userEmail: req.user.emailAddress,
      priceHistory: [{
        price: req.body.currentPrice,
        date: new Date()
      }],
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

    const newPrice = req.body.price;

    // Add new price to history
    product.priceHistory.push({
      price: newPrice,
      date: new Date()
    });

    // Update prices
    product.currentPrice = newPrice;
    const oldPrice = product.currentPrice;

    if (newPrice < product.lowestPrice) product.lowestPrice = newPrice;
    if (newPrice > product.highestPrice) product.highestPrice = newPrice;

    // Calculate changes
    if (oldPrice !== 0) {
      const priceChange = ((newPrice - oldPrice) / oldPrice) * 100;
      // Simple price change (last entry in history vs current)
      product.priceChange24h = priceChange;
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

// Add alert to product
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

// Delete product
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
        { name: { $regex: query, $options: 'i' } },
        { sku: { $regex: query, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    const products = await Product.find(filter).sort({ lastChecked: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to search products" });
  }
});

// Get product statistics
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

// Get price history for a product
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

// Scrape product from Daraz
router.post('/scrape/daraz', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        console.log('Received scrape request for query:', query); // Debug log

        const scraperController = require('../controllers/scraper.controller');
        const results = await scraperController.scrapeDaraz(query);

        if (!results || !results.products) {
            throw new Error('Invalid scraper response format');
        }

        res.json(results);
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ error: error.message || 'Failed to scrape products' });
    }
});

// Scrape product from Alibaba
router.post('/scrape/alibaba', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        console.log('Received scrape request for Alibaba query:', query); // Debug log

        const scraperController = require('../controllers/scraper.controller');
        const results = await scraperController.scrapeAlibaba(query);

        if (!results || !results.products) {
            throw new Error('Invalid scraper response format');
        }

        res.json(results);
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ error: error.message || 'Failed to scrape products' });
    }
});

// General scrape endpoint that combines both sources
router.post('/scrape', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        console.log('Received scrape request for both sources:', query);

        const scraperController = require('../controllers/scraper.controller');
        const SearchResult = require('../models/search_result');

        // Scrape both concurrently
        const [darazResults, alibabaResults] = await Promise.allSettled([
            scraperController.scrapeDaraz(query),
            scraperController.scrapeAlibaba(query)
        ]);

        const allProducts = [];

        if (darazResults.status === 'fulfilled') {
            allProducts.push(...darazResults.value.products);
        } else {
            console.error('Daraz scrape failed:', darazResults.reason);
        }

        if (alibabaResults.status === 'fulfilled') {
            allProducts.push(...alibabaResults.value.products);
        } else {
            console.error('Alibaba scrape failed:', alibabaResults.reason);
        }

        // Store results in DB
        if (allProducts.length > 0) {
            const searchResult = new SearchResult({
                query,
                results: allProducts,
                searchedAt: new Date(),
                resultCount: allProducts.length
            });
            await searchResult.save();
        }

        res.json({ products: allProducts });
    } catch (error) {
        console.error('Combined scraping error:', error);
        res.status(500).json({ error: error.message || 'Failed to scrape products' });
    }
});

export default router;
