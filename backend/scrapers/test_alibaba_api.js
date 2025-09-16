import { scrapeAlibaba } from "./alibaba_api_scraper.js";

const query = "apple stopwatch";

(async () => {
  const products = await scrapeAlibaba(query, 1);
  console.log("Final Scraped Products:", products);
})();
