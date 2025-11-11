// controllers/scraperController.js

import darazScraper from "../scrapers/daraz_api_scraper.js";
import priceOyeScraper from "../scrapers/priceoye_api_scraper.js";
import telemartScraper from "../scrapers/telemart_scraper.js";
import ebayScraper from "../scrapers/ebay_api_scraper.js";
import SearchResult from "../models/search_result.js";

/**
 * Normalize marketplace values to match schema enum
 */
function normalizeMarketplace(marketplace) {
  if (!marketplace) return null;
  const value = marketplace.toLowerCase();
  if (value === "daraz") return "Daraz";
  if (value === "priceoye") return "PriceOye";
  if (value === "telemart") return "Telemart";
  if (value === "ebay") return "Ebay";
  return marketplace;
}

export const scrapeAndStream = async (query, ws) => {
  const scrapers = [
    { fn: darazScraper, name: "Daraz", timeout: 15000 },
    { fn: priceOyeScraper, name: "PriceOye", timeout: 30000 },
    { fn: telemartScraper, name: "Telemart", timeout: 8000 },
    { fn: ebayScraper, name: "Ebay", timeout: 20000 },
  ];

  const promises = scrapers.map(async ({ fn, name, timeout }) => {
    try {
      const result = await Promise.race([
        fn(query),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${name} scraper timeout`)), timeout)
        ),
      ]);

      if (result.success && result.products.length > 0) {
        const products = result.products.map(p => ({
          ...p,
          marketplace: normalizeMarketplace(p.marketplace),
        }));
        ws.send(JSON.stringify({ type: 'RESULT', payload: { marketplace: name, products } }));
      } else {
        ws.send(JSON.stringify({ type: 'NO_RESULTS', payload: { marketplace: name } }));
      }
    } catch (error) {
      console.error(`[Controller] ${name} scraper failed:`, error.message);
      ws.send(JSON.stringify({ type: 'ERROR', payload: { marketplace: name, message: error.message } }));
    }
  });

  await Promise.allSettled(promises);

  ws.send(JSON.stringify({ type: 'DONE' }));
};

// Individual scraper functions for routes
export const scrapeDaraz = async (query) => {
  try {
    const result = await darazScraper(query);
    return result;
  } catch (error) {
    return { success: false, products: [] };
  }
};

export const scrapePriceOye = async (query) => {
  try {
    const result = await priceOyeScraper(query);
    return result;
  } catch (error) {
    return { success: false, products: [] };
  }
};

// Controller for handling HTTP scrape requests with caching
export const scraperController = async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ 
      success: false, 
      message: "Search query is required.",
      error: "MISSING_QUERY" 
    });
  }

  try {
    // Check for cached results (within last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const cachedResult = await SearchResult.findOne({
      query: { $regex: new RegExp(`^${query}$`, 'i') },
      searchedAt: { $gte: oneHourAgo },
      resultCount: { $gt: 0 }
    }).sort({ searchedAt: -1 });

    if (cachedResult) {
      console.log(`[Controller] Returning cached results for: ${query}`);
      return res.json({
        success: true,
        query: cachedResult.query,
        products: cachedResult.results,
        total: cachedResult.resultCount,
        sources: {
          daraz: { success: true, count: cachedResult.results.filter(p => p.marketplace === 'Daraz').length },
          priceoye: { success: true, count: cachedResult.results.filter(p => p.marketplace === 'PriceOye').length },
          telemart: { success: true, count: cachedResult.results.filter(p => p.marketplace === 'Telemart').length },
          ebay: { success: true, count: cachedResult.results.filter(p => p.marketplace === 'Ebay').length },
        },
        timestamp: cachedResult.searchedAt.toISOString(),
        cached: true,
      });
    }

    // No cache, scrape fresh data
    console.log(`[Controller] No cache found, scraping fresh data for: ${query}`);
    
    const scrapers = [
      { fn: darazScraper, name: "Daraz", timeout: 15000 },
      { fn: priceOyeScraper, name: "PriceOye", timeout: 30000 },
      { fn: telemartScraper, name: "Telemart", timeout: 8000 },
      { fn: ebayScraper, name: "Ebay", timeout: 20000 },
    ];

    let allProducts = [];
    const sources = {};

    const promises = scrapers.map(async ({ fn, name, timeout }) => {
      try {
        const result = await Promise.race([
          fn(query),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${name} scraper timeout`)), timeout)
          ),
        ]);

        // Handle both success and error responses from scrapers
        if (result && result.success && result.products && result.products.length > 0) {
          const products = result.products.map(p => ({
            ...p,
            marketplace: normalizeMarketplace(p.marketplace || name),
          }));
          allProducts.push(...products);
          sources[name.toLowerCase()] = { success: true, count: products.length };
          console.log(`[Controller] ${name} returned ${products.length} products`);
        } else if (result && result.error) {
          // Scraper returned an error object
          console.error(`[Controller] ${name} scraper returned error:`, result.error);
          sources[name.toLowerCase()] = { success: false, count: 0, error: result.error.message || 'Scraper error' };
        } else {
          // No products found
          console.log(`[Controller] ${name} returned no products`);
          sources[name.toLowerCase()] = { success: true, count: 0 };
        }
      } catch (error) {
        console.error(`[Controller] ${name} scraper failed:`, error.message);
        sources[name.toLowerCase()] = { success: false, count: 0, error: error.message };
      }
    });

    await Promise.allSettled(promises);

    const response = {
      success: true,
      query,
      products: allProducts,
      total: allProducts.length,
      sources,
      timestamp: new Date().toISOString(),
      cached: false,
    };

    // Save to database for caching
    try {
      const searchResult = new SearchResult({
        query,
        results: allProducts,
        resultCount: allProducts.length,
        searchedAt: new Date()
      });
      await searchResult.save();
      console.log(`[Controller] Saved ${allProducts.length} products to cache for query: ${query}`);
    } catch (dbError) {
      console.error("Failed to save search result:", dbError);
      // Don't fail the request if caching fails
    }

    res.json(response);
  } catch (error) {
    console.error('[Controller] Scraper controller error:', error);
    res.status(500).json({
      success: false,
      message: "An error occurred while searching for products",
      error: error.message,
      query,
      products: [],
      total: 0,
      sources: {},
      timestamp: new Date().toISOString(),
      cached: false,
    });
  }
};

// Default export for compatibility with routes
export default { scrapeDaraz, scrapePriceOye };
