// controllers/scraperController.js

import darazScraper from "../scrapers/daraz_api_scraper.js";
import priceOyeScraper from "../scrapers/priceoye_api_scraper.js";
import telemartScraper from "../scrapers/telemart_scraper.js";
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
  return marketplace;
}

export const scrapeAndStream = async (query, ws) => {
  const scrapers = [
    { fn: darazScraper, name: "Daraz", timeout: 15000 },
    { fn: priceOyeScraper, name: "PriceOye", timeout: 20000 },
    { fn: telemartScraper, name: "Telemart", timeout: 8000 },
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

// Default export for compatibility with routes
export default { scrapeDaraz, scrapePriceOye };
