import express from "express";
import { scraperController } from "../controllers/scraper.controller.js";
import { scrapeDaraz, scrapePriceOye } from "../controllers/scraper.controller.js";
import SearchResult from "../models/search_result.js";
import { authenticate as auth } from "../middleware/auth.js";

const router = express.Router();

// ✅ MINIMAL TEST ROUTE - Just to verify router loading
router.get("/test-autocomplete", (req, res) => {
  console.log("[TEST] Minimal test autocomplete route called");
  res.json({
    message: "Minimal test route working",
    query: req.query.q,
    timestamp: new Date().toISOString()
  });
});

// ✅✅✅ AUTOCOMPLETE - REAL IMPLEMENTATION ✅✅✅
router.get("/autocomplete", async (req, res) => {
  try {
    console.log("[AUTOCOMPLETE] Real autocomplete route called with query:", req.query.q);

    const { q: query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({
        suggestions: [],
        message: "Query too short",
        query: query || ""
      });
    }

    // Get recent search results from database for suggestions
    const recentSearches = await SearchResult.find({
      query: { $regex: new RegExp(query.trim(), 'i') },
      resultCount: { $gt: 0 }
    })
    .sort({ searchedAt: -1 })
    .limit(10)
    .select('query results')
    .lean();

    const suggestions = new Set();

    // Extract product names from recent searches
    recentSearches.forEach(search => {
      search.results.forEach(product => {
        if (product.name && product.name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(product.name);
        }
      });
    });

    // If no suggestions from database, provide some popular product categories
    if (suggestions.size === 0) {
      const popularSuggestions = [
        "iPhone", "Samsung Galaxy", "MacBook", "Dell Laptop", "HP Printer",
        "Nike Shoes", "Adidas", "Sony Headphones", "Apple Watch", "Gaming Mouse"
      ].filter(item => item.toLowerCase().includes(query.toLowerCase()));

      popularSuggestions.forEach(item => suggestions.add(item));
    }

    const suggestionArray = Array.from(suggestions).slice(0, 8).map(text => ({
      text,
      type: "product",
      marketplace: "Multiple",
      price: null
    }));

    res.json({
      suggestions: suggestionArray,
      count: suggestionArray.length,
      query: query.trim(),
      message: "Real suggestions from search history"
    });

  } catch (error) {
    console.error("[AUTOCOMPLETE] Error:", error);
    // Fallback to basic suggestions on error
    const fallbackSuggestions = [
      "iPhone", "Samsung", "MacBook", "Dell", "HP"
    ].filter(item => item.toLowerCase().includes(query.toLowerCase()));

    res.json({
      suggestions: fallbackSuggestions.map(text => ({
        text,
        type: "product",
        marketplace: "Multiple",
        price: null
      })),
      count: fallbackSuggestions.length,
      query: query.trim(),
      message: "Fallback suggestions due to error"
    });
  }
});

// ✅ MAIN SCRAPE ENDPOINT - Connected to scraper controller
router.post("/scrape", scraperController);

// ✅ INDIVIDUAL SCRAPER ENDPOINTS
router.post("/scrape/daraz", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required",
        error: "MISSING_QUERY"
      });
    }

    console.log(`[DARAZ SCRAPE] Starting scrape for: ${query}`);
    const result = await scrapeDaraz(query);

    res.json({
      success: result.success,
      products: result.products || [],
      total: result.products?.length || 0,
      marketplace: "Daraz",
      query,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[DARAZ SCRAPE] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to scrape Daraz",
      error: error.message,
      products: [],
      total: 0,
      marketplace: "Daraz"
    });
  }
});

router.post("/scrape/priceoye", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required",
        error: "MISSING_QUERY"
      });
    }

    console.log(`[PRICEOYE SCRAPE] Starting scrape for: ${query}`);
    const result = await scrapePriceOye(query);

    res.json({
      success: result.success,
      products: result.products || [],
      total: result.products?.length || 0,
      marketplace: "PriceOye",
      query,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[PRICEOYE SCRAPE] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to scrape PriceOye",
      error: error.message,
      products: [],
      total: 0,
      marketplace: "PriceOye"
    });
  }
});

// ✅ LEGACY SEARCH ENDPOINT (for backward compatibility)
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required",
        error: "MISSING_QUERY"
      });
    }

    // Use the main scraper controller for search
    const mockReq = { body: { query } };
    const mockRes = {
      json: (data) => data,
      status: (code) => ({ json: (data) => ({ ...data, statusCode: code }) })
    };

    const result = await scraperController(mockReq, mockRes);
    res.json(result);

  } catch (error) {
    console.error("[SEARCH] Error:", error);
    res.status(500).json({
      success: false,
      message: "Search failed",
      error: error.message,
      products: [],
      total: 0
    });
  }
});

// ✅ MISSING ROUTES - Add the routes that frontend expects

// Get product statistics overview
router.get("/stats/overview", auth, async (req, res) => {
  try {
    // Get user's search statistics
    const userId = req.user.userId;

    const stats = await SearchResult.aggregate([
      {
        $lookup: {
          from: 'watchlist',
          localField: 'results.name',
          foreignField: 'name',
          as: 'watchlistMatches'
        }
      },
      {
        $group: {
          _id: null,
          totalSearches: { $sum: 1 },
          totalProductsFound: { $sum: '$resultCount' },
          avgProductsPerSearch: { $avg: '$resultCount' },
          mostSearchedTerms: {
            $push: {
              term: '$query',
              count: '$resultCount',
              date: '$searchedAt'
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalSearches: 0,
      totalProductsFound: 0,
      avgProductsPerSearch: 0,
      mostSearchedTerms: []
    };

    // Get marketplace distribution
    const marketplaceStats = await SearchResult.aggregate([
      { $unwind: '$results' },
      {
        $group: {
          _id: '$results.marketplace',
          count: { $sum: 1 }
        }
      }
    ]);

    result.marketplaceDistribution = marketplaceStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json(result);

  } catch (error) {
    console.error("[STATS] Error:", error);
    res.status(500).json({
      error: "Failed to fetch statistics",
      totalSearches: 0,
      totalProductsFound: 0,
      avgProductsPerSearch: 0,
      marketplaceDistribution: {}
    });
  }
});

// Get product history (price tracking history)
router.get("/:productId/history", auth, async (req, res) => {
  try {
    const { productId } = req.params;

    // For now, return mock history data since we don't have a price history model
    // In a real implementation, you'd query a price history collection
    const mockHistory = [
      {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        price: 150000,
        marketplace: "Daraz"
      },
      {
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        price: 145000,
        marketplace: "Daraz"
      },
      {
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        price: 148000,
        marketplace: "Daraz"
      },
      {
        date: new Date().toISOString(),
        price: 142000,
        marketplace: "Daraz"
      }
    ];

    res.json({
      productId,
      history: mockHistory,
      totalRecords: mockHistory.length,
      priceRange: {
        min: Math.min(...mockHistory.map(h => h.price)),
        max: Math.max(...mockHistory.map(h => h.price)),
        current: mockHistory[mockHistory.length - 1].price
      }
    });

  } catch (error) {
    console.error("[PRODUCT HISTORY] Error:", error);
    res.status(500).json({
      error: "Failed to fetch product history",
      productId: req.params.productId,
      history: [],
      totalRecords: 0
    });
  }
});

// Create alert for product
router.post("/:productId/alerts", auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { threshold, condition, email, sms } = req.body;

    // For now, return mock alert creation
    // In a real implementation, you'd save this to an alerts collection
    const alert = {
      id: `alert_${Date.now()}`,
      productId,
      userId: req.user.userId,
      threshold: parseFloat(threshold),
      condition: condition || 'below',
      email: email !== undefined ? email : true,
      sms: sms !== undefined ? sms : false,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    res.status(201).json({
      message: "Alert created successfully",
      alert
    });

  } catch (error) {
    console.error("[CREATE ALERT] Error:", error);
    res.status(400).json({
      error: "Failed to create alert",
      message: error.message
    });
  }
});

// Update alert
router.put("/:productId/alerts/:alertId", auth, async (req, res) => {
  try {
    const { productId, alertId } = req.params;
    const updates = req.body;

    // For now, return mock alert update
    // In a real implementation, you'd update the alert in the database
    const updatedAlert = {
      id: alertId,
      productId,
      userId: req.user.userId,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    res.json({
      message: "Alert updated successfully",
      alert: updatedAlert
    });

  } catch (error) {
    console.error("[UPDATE ALERT] Error:", error);
    res.status(400).json({
      error: "Failed to update alert",
      message: error.message
    });
  }
});

// Get saved search results
router.get("/search-results", auth, async (req, res) => {
  try {
    const { query, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {};
    if (query) {
      filter.query = { $regex: new RegExp(query, 'i') };
    }

    const searchResults = await SearchResult.find(filter)
      .sort({ searchedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('query results resultCount searchedAt');

    const total = await SearchResult.countDocuments(filter);

    res.json({
      results: searchResults,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });

  } catch (error) {
    console.error("[SEARCH RESULTS] Error:", error);
    res.status(500).json({
      error: "Failed to fetch search results",
      results: [],
      total: 0,
      page: 1,
      limit: parseInt(req.query.limit) || 20,
      totalPages: 0
    });
  }
});

export default router;
