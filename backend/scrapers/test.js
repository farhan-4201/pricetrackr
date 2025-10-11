// backend/scrapers/test.js
import { PriceOyeScraper } from "./priceoye_api_scraper.js";

async function runTests() {
  console.log("🚀 Running manual tests...");
  const scraper = new PriceOyeScraper();

  try {
    // Test 1: Empty query should throw
    try {
      await scraper.searchProducts("");
    } catch (err) {
      console.log("✅ Empty query correctly threw error:", err.message);
    }

    // Test 2: Normal search
    await scraper.initBrowser();
    let products = await scraper.searchProducts("iPhone");
    console.log("✅ Found products:", products.length);
    console.log(products.slice(0, 2));

    // Test 3: Nonsense query
    products = await scraper.searchProducts("asdkjfhakjsdhf");
    console.log("✅ Nonsense query returned:", products.length, "results");

    // Test 4: Another valid query
    products = await scraper.searchProducts("Samsung Galaxy");
    console.log("✅ Convenience function: Products found:", products.length);
  } catch (err) {
    console.error("❌ Test failed:", err);
  } finally {
    await scraper.closeBrowser();
  }
}

runTests();
