import { chromium } from "playwright";

export class PriceOyeScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async searchProducts(query) {
    const searchUrl = `https://priceoye.pk/search?q=${encodeURIComponent(query)}`;
    console.log(`🔎 Searching PriceOye: ${searchUrl}`);

    await this.page.goto(searchUrl, { waitUntil: "domcontentloaded" });

    // Wait for product boxes
    await this.page.waitForSelector(".productBox", { timeout: 15000 });

    const products = await this.page.$$eval(".productBox", (cards, query) =>
      cards.map((card) => {
        const title =
          card.querySelector(".p-title")?.textContent?.trim() || null;

        // Updated price extraction logic
        const priceText =
          card.querySelector(".price-box")?.textContent?.trim() || null;
        const price = priceText
          ? parseInt(priceText.replace(/[^\d]/g, ""))
          : null;

        // Image might use lazy load data-src
        let image =
          card.querySelector("img")?.getAttribute("data-src") ||
          card.querySelector("img")?.getAttribute("src") ||
          null;

        const link = card.querySelector("a")?.href || null;

        // Relevance score calculation
        const calculateRelevance = (productName, query) => {
          if (!productName || !query) return 0;
          const productLower = productName.toLowerCase();
          const queryLower = query.toLowerCase();
          const queryWords = queryLower.split(/\s+/).filter(word => word.length > 1);
          let score = 0;
          let matchedWords = 0;
          for (const word of queryWords) {
            if (productLower.includes(word)) {
              matchedWords++;
              score += 1;
            }
          }
          if (queryWords.length > 0 && matchedWords / queryWords.length < 0.5) {
            return 0;
          }
          return score;
        };

        const relevanceScore = calculateRelevance(title, query);

        return {
          name: title,
          price,
          marketplace: "priceoye",
          imageUrl: image,
          url: link,
          relevanceScore,
        };
      }), query
    );

    console.log(`✅ Found ${products.length} products on PriceOye`);
    return products.filter((p) => p.name);
  }
}

const priceOyeScraper = async (query) => {
  const scraper = new PriceOyeScraper();
  try {
    await scraper.init();
    const products = await scraper.searchProducts(query);
    return { success: true, products };
  } catch (error) {
    console.error("Error scraping PriceOye:", error);
    return { success: false, products: [], error: error.message };
  } finally {
    await scraper.close();
  }
};

export default priceOyeScraper;
