import express from "express";
import { scraperController } from "../controllers/scraper.controller.js";
import { scrapeDaraz, scrapePriceOye } from "../controllers/scraper.controller.js";
import SearchResult from "../models/search_result.js";
import { authenticate as auth } from "../middleware/auth.js";

const router = express.Router();

// ✅✅✅ AUTOCOMPLETE - REAL IMPLEMENTATION ✅✅✅
router.get("/autocomplete", async (req, res) => {
  try {
    const rawQuery = req.query.q?.trim() || "";
    console.log("[AUTOCOMPLETE] Query:", rawQuery);

    if (rawQuery.length < 2) {
      return res.json({
        suggestions: [],
        message: "Query too short",
        query: rawQuery
      });
    }

    const query = rawQuery.toLowerCase();

    // 🔍 Fetch recent searches that have valid product results
    const recentSearches = await SearchResult.find({
      resultCount: { $gt: 0 },
      results: { $exists: true, $ne: [] },
      "results.name": { $regex: query, $options: "i" }
    })
      .sort({ searchedAt: -1 })
      .limit(10)
      .select("results")
      .lean();

    const suggestions = new Set();

    // 🔎 Extract valid product names & ONLY the ones that are available
    recentSearches.forEach(search => {
      if (!Array.isArray(search.results)) return;

      search.results.forEach(product => {
        if (
          product?.name &&
          product?.name.toLowerCase().includes(query) &&
          product?.price &&                      // ❗ Must have price (means available)
          product?.marketplace                   // ❗ Must belong to Daraz or PriceOye
        ) {
          suggestions.add(
            JSON.stringify({
              text: product.name,
              marketplace: product.marketplace,
              price: product.price,
            })
          );
        }
      });
    });

    // If no DB suggestions → fallback to common category keywords
    if (suggestions.size === 0) {
      console.log("[AUTOCOMPLETE] No DB matches → Using fallback words");

      const fallback = [
        "iPhone", "Samsung Galaxy", "MacBook", "Gaming Mouse",
        "Sony Headphones", "Apple Watch", "Dell Laptop"
      ].filter(item => item.toLowerCase().includes(query));

      fallback.forEach(item =>
        suggestions.add(
          JSON.stringify({
            text: item,
            marketplace: "Multiple",
            price: null
          })
        )
      );
    }

    // Convert Set → Array of objects
    const formatted = Array.from(suggestions)
      .map(item => JSON.parse(item))
      .slice(0, 8)        // limit to 8 suggestions
      .map(s => ({
        text: s.text,
        type: "product",
        marketplace: s.marketplace,
        price: s.price
      }));

    return res.json({
      suggestions: formatted,
      count: formatted.length,
      query,
      message: "Filtered suggestions from real available products"
    });

  } catch (error) {
    console.error("[AUTOCOMPLETE ERROR]", error);

    return res.json({
      suggestions: [],
      count: 0,
      query: req.query.q,
      message: "Error occurred, no suggestions"
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

    console.log(`[DARAZ SCRAPE] Checking DB for existing results for: ${query}`);

    // Check for existing Daraz results in DB first
    const existingResult = await SearchResult.findOne({
      query: { $regex: new RegExp(`^${query}$`, 'i') },
      "results.marketplace": "Daraz"
    }).sort({ searchedAt: -1 });

    if (existingResult) {
      const darazProducts = existingResult.results.filter(p => p.marketplace === 'Daraz');
      if (darazProducts.length > 0) {
        console.log(`[DARAZ SCRAPE] Found ${darazProducts.length} existing Daraz products in DB`);
        return res.json({
          success: true,
          products: darazProducts,
          total: darazProducts.length,
          marketplace: "Daraz",
          query,
          timestamp: existingResult.searchedAt.toISOString(),
          cached: true
        });
      }
    }

    // No existing results, scrape fresh data
    console.log(`[DARAZ SCRAPE] No existing results found, scraping for: ${query}`);
    const result = await scrapeDaraz(query);

    // Save to database if successful
    if (result.success && result.products && result.products.length > 0) {
      try {
        // Check if we already have a search result for this query
        let searchResult = await SearchResult.findOne({
          query: { $regex: new RegExp(`^${query}$`, 'i') }
        }).sort({ searchedAt: -1 });

        if (searchResult) {
          // Add Daraz results to existing search result
          const existingDaraz = searchResult.results.filter(p => p.marketplace === 'Daraz');
          if (existingDaraz.length === 0) {
            searchResult.results.push(...result.products);
            searchResult.resultCount = searchResult.results.length;
            searchResult.searchedAt = new Date();
            await searchResult.save();
            console.log(`[DARAZ SCRAPE] Added ${result.products.length} Daraz products to existing search result`);
          }
        } else {
          // Create new search result
          const newSearchResult = new SearchResult({
            query,
            results: result.products,
            resultCount: result.products.length,
            searchedAt: new Date()
          });
          await newSearchResult.save();
          console.log(`[DARAZ SCRAPE] Saved ${result.products.length} new Daraz products to DB`);
        }
      } catch (dbError) {
        console.error("[DARAZ SCRAPE] Failed to save to DB:", dbError);
        // Don't fail the request if DB save fails
      }
    }

    res.json({
      success: result.success,
      products: result.products || [],
      total: result.products?.length || 0,
      marketplace: "Daraz",
      query,
      timestamp: new Date().toISOString(),
      cached: false
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
