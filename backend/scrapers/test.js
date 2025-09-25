// test_telemart_scraper.js
import { TelemartScraper } from "./telemart_scraper.js";

async function runTelemartTest() {
  const scraper = new TelemartScraper();

  try {
    console.log("🚀 Initializing Telemart Scraper...");
    await scraper.init();

    // Step 1: Test connection
    console.log("\n🧪 Testing connection to Telemart...");
    const connected = await scraper.testConnection();
    if (!connected) {
      console.error("❌ Failed to connect to Telemart. Exiting test.");
      return;
    }

    // Step 2: Run product searches
    const queries = ["iPhone 14", "Samsung Galaxy", "HP laptop"];
    console.log(`\n🔎 Running test searches for queries: ${queries.join(", ")}`);

    for (const query of queries) {
      console.log(`\n📌 Searching for: "${query}"`);
      const products = await scraper.searchProducts(query);

      if (products.length === 0) {
        console.log(`⚠️ No products found for "${query}"`);
        continue;
      }

      console.log(`✅ Found ${products.length} products for "${query}"`);

      // Print top 3 results in detail
      products.slice(0, 3).forEach((product, i) => {
        console.log(`\n${i + 1}. ${product.name}`);
        console.log(`   Price: Rs. ${product.price || "N/A"}`);
        console.log(`   Company: ${product.company}`);
        console.log(`   Rating: ${product.rating || "N/A"}`);
        console.log(`   URL: ${product.url}`);
        console.log(`   Image: ${product.imageUrl}`);
      });
    }
  } catch (error) {
    console.error("❌ Test run failed:", error.message);
  } finally {
    console.log("\n🛑 Closing scraper...");
    await scraper.close();
  }
}

// Run test if file executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTelemartTest();
}
