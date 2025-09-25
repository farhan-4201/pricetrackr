// controllers/scraperController.js

import darazScraper from "../scrapers/daraz_api_scraper.js";
import priceOyeScraper from "../scrapers/priceoye_api_scraper.js";
import telemartScraper from "../scrapers/telemart_scraper.js";

/**
 * Normalize marketplace values to match schema enum
 */
function normalizeMarketplace(marketplace) {
  if (!marketplace) return null;
  const value = marketplace.toLowerCase();
  if (value === "daraz") return "Daraz";
  if (value === "priceoye") return "PriceOye";
  if (value === "telemart") return "Telemart";
  return marketplace;
}

export const scrapeAll = async (req, res) => {
  try {
    const { query } = req.body;
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
    const [darazRes, priceOyeRes, telemartRes] = await Promise.allSettled([
      darazScraper(query),
      priceOyeScraper(query),
      telemartScraper(query)
    ]);

    console.log(`[Controller] Daraz result:`, darazRes);
    console.log(`[Controller] PriceOye result:`, priceOyeRes);
    console.log(`[Controller] Telemart result:`, telemartRes);

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

    // Collect Telemart results
    if (telemartRes.status === "fulfilled" && telemartRes.value.success) {
      const products = telemartRes.value.products.map(p => ({
        ...p,
        marketplace: normalizeMarketplace(p.marketplace)
      }));
      console.log(`[Controller] Telemart products after normalization:`, products);
      results.products.push(...products);
      results.sources.telemart = { success: true, count: products.length };
      results.total += products.length;
    } else {
      console.log(`[Controller] Telemart failed:`, telemartRes.reason?.message);
      results.sources.telemart = { success: false, count: 0, error: telemartRes.reason?.message };
    }

    results.products.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    // Get the 2 best products from each marketplace
    const bestProductsPerMarketplace = {};
    for (const product of results.products) {
      const marketplace = product.marketplace;
      if (!bestProductsPerMarketplace[marketplace]) {
        bestProductsPerMarketplace[marketplace] = [];
      }

      // Keep only top 2 products per marketplace
      if (bestProductsPerMarketplace[marketplace].length < 2) {
        bestProductsPerMarketplace[marketplace].push(product);
      }
    }

    // Flatten the grouped products back to array
    const finalProducts = Object.values(bestProductsPerMarketplace).flat();
    results.products = finalProducts;
    results.total = finalProducts.length;

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
