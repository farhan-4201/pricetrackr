// controllers/scraperController.js

import darazScraper from "../scrapers/daraz_api_scraper.js";
import priceOyeScraper from "../scrapers/priceoye_api_scraper.js";

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

export const scrapeAll = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ success: false, message: "Query is required" });
    }

    const results = {
      success: true,
      query,
      products: [],
      total: 0,
      sources: {},
      timestamp: new Date(),
      cached: false
    };

    // Run scrapers in parallel
    const [darazRes, priceOyeRes] = await Promise.allSettled([
      darazScraper(query),
      priceOyeScraper(query)
    ]);

    console.log(`[Controller] Daraz result:`, darazRes);
    console.log(`[Controller] PriceOye result:`, priceOyeRes);

    // Collect Daraz results
    if (darazRes.status === "fulfilled" && darazRes.value.success) {
      const products = darazRes.value.products.map(p => ({
        ...p,
        marketplace: normalizeMarketplace(p.marketplace)
      }));
      console.log(`[Controller] Daraz products after normalization:`, products);
      results.products.push(...products);
      results.sources.daraz = { success: true, count: products.length };
      results.total += products.length;
    } else {
      console.log(`[Controller] Daraz failed:`, darazRes.reason?.message);
      results.sources.daraz = { success: false, count: 0, error: darazRes.reason?.message };
    }

    // Collect PriceOye results
    if (priceOyeRes.status === "fulfilled" && priceOyeRes.value.success) {
      const products = priceOyeRes.value.products.map(p => ({
        ...p,
        marketplace: normalizeMarketplace(p.marketplace)
      }));
      console.log(`[Controller] PriceOye products after normalization:`, products);
      results.products.push(...products);
      results.sources.priceoye = { success: true, count: products.length };
      results.total += products.length;
    } else {
      console.log(`[Controller] PriceOye failed:`, priceOyeRes.reason?.message);
      results.sources.priceoye = { success: false, count: 0, error: priceOyeRes.reason?.message };
    }

    console.log(`[Controller] Final results:`, results);

    return res.json(results);
  } catch (err) {
    console.error("Scraper error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
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

// Default export for compatibility with routes
export default { scrapeDaraz, scrapePriceOye };
