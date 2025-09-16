import { scrapeDarazAPI } from "./daraz_api_scraper.js";

(async () => {
  const results = await scrapeDarazAPI("iphone ");
  console.log("Scraped Products:", results);
})();
