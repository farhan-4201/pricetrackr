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
    // Check for cached results (within last 1 hour) - but handle Daraz separately
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const cachedResult = await SearchResult.findOne({
      query: { $regex: new RegExp(`^${query}$`, 'i') },
      searchedAt: { $gte: oneHourAgo },
      resultCount: { $gt: 0 }
    }).sort({ searchedAt: -1 });

    let allProducts = [];
    const sources = {};
    let isFullyCached = false;

    if (cachedResult) {
      // Check if cached result has all marketplaces or if we need to scrape some
      const cachedDaraz = cachedResult.results.filter(p => p.marketplace === 'Daraz');
      const cachedPriceOye = cachedResult.results.filter(p => p.marketplace === 'PriceOye');
      const cachedTelemart = cachedResult.results.filter(p => p.marketplace === 'Telemart');
      const cachedEbay = cachedResult.results.filter(p => p.marketplace === 'Ebay');

      // For Daraz, we always use cached if available (since we check DB first)
      if (cachedDaraz.length > 0) {
        allProducts.push(...cachedDaraz);
        sources.daraz = { success: true, count: cachedDaraz.length };
        console.log(`[Controller] Using cached Daraz results: ${cachedDaraz.length} products`);
      }

      // For other marketplaces, use cached if available
      if (cachedPriceOye.length > 0) {
        allProducts.push(...cachedPriceOye);
        sources.priceoye = { success: true, count: cachedPriceOye.length };
      }
      if (cachedTelemart.length > 0) {
        allProducts.push(...cachedTelemart);
        sources.telemart = { success: true, count: cachedTelemart.length };
      }
      if (cachedEbay.length > 0) {
        allProducts.push(...cachedEbay);
        sources.ebay = { success: true, count: cachedEbay.length };
      }

      // If we have results from all marketplaces, return cached
      if (allProducts.length === cachedResult.resultCount) {
        console.log(`[Controller] Returning fully cached results for: ${query}`);
        return res.json({
          success: true,
          query: cachedResult.query,
          products: allProducts,
          total: allProducts.length,
          sources,
          timestamp: cachedResult.searchedAt.toISOString(),
          cached: true,
        });
      }
    }

    // Check for existing Daraz results in DB (even from older searches)
    let darazResults = [];
    if (!sources.daraz) {
      const darazCached = await SearchResult.findOne({
        query: { $regex: new RegExp(`^${query}$`, 'i') },
        "results.marketplace": "Daraz"
      }).sort({ searchedAt: -1 });

      if (darazCached) {
        darazResults = darazCached.results.filter(p => p.marketplace === 'Daraz');
        if (darazResults.length > 0) {
          allProducts.push(...darazResults);
          sources.daraz = { success: true, count: darazResults.length };
          console.log(`[Controller] Found existing Daraz results in DB: ${darazResults.length} products`);
        }
      }
    }

    // Scrape remaining marketplaces
    console.log(`[Controller] Scraping remaining marketplaces for: ${query}`);

    const scrapers = [];

    // Only add Daraz scraper if we don't have cached results
    if (!sources.daraz) {
      scrapers.push({ fn: darazScraper, name: "Daraz", timeout: 15000 });
    }

    // Add other scrapers if not cached
    if (!sources.priceoye) {
      scrapers.push({ fn: priceOyeScraper, name: "PriceOye", timeout: 30000 });
    }
    if (!sources.telemart) {
      scrapers.push({ fn: telemartScraper, name: "Telemart", timeout: 8000 });
    }
    if (!sources.ebay) {
      scrapers.push({ fn: ebayScraper, name: "Ebay", timeout: 20000 });
    }

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
          console.log(`[Controller] ${name} scraped ${products.length} products`);
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
      cached: isFullyCached,
    };

    // Save to database for caching (only if we scraped new data)
    if (scrapers.length > 0) {
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
