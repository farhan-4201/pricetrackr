import { chromium } from "playwright";

export class PriceOyeScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.context = null;
  }

  async init() {
    this.browser = await chromium.launch({ headless: true });

    // ✅ Correct way to set userAgent + viewport in Playwright
    this.context = await this.browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      viewport: { width: 1200, height: 800 },
    });

    this.page = await this.context.newPage();
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async searchProducts(query) {
    const searchUrl = `https://priceoye.pk/search?q=${encodeURIComponent(
      query
    )}`;
    console.log(`🔎 Searching PriceOye: ${searchUrl}`);

    await this.page.goto(searchUrl, { waitUntil: "domcontentloaded" });

    // Wait for product cards
    await this.page.waitForSelector(".productBox", { timeout: 15000 });

    // Scroll down to trigger lazy loading
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(2000);

    // Scroll back up
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    const products = await this.page.$$eval(".productBox", (cards, query) => {
      const extractImageUrl = (card) => {
        const imgSelectors = [
          "img[data-src]",
          "img[src]",
          ".product-image img",
          ".p-image img",
          ".productBox img",
        ];

        let imageUrl = null;

        for (const selector of imgSelectors) {
          const imgElement = card.querySelector(selector);
          if (imgElement) {
            imageUrl =
              imgElement.getAttribute("data-src") ||
              imgElement.getAttribute("src") ||
              imgElement.getAttribute("data-lazy-src");

            if (imageUrl) {
              if (
                imageUrl.includes(".svg") ||
                imageUrl.includes("placeholder") ||
                imageUrl.includes("loading") ||
                imageUrl.includes("data:image/svg") ||
                imageUrl.length < 10
              ) {
                imageUrl = null;
                continue;
              }

              if (imageUrl.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i)) {
                break;
              }

              if (imageUrl.startsWith("http") && !imageUrl.includes(".svg")) {
                break;
              }

              imageUrl = null;
            }
          }
        }

        if (!imageUrl) {
          const allImages = card.querySelectorAll("img");
          for (const img of allImages) {
            const possibleUrl =
              img.getAttribute("data-src") ||
              img.getAttribute("src") ||
              img.getAttribute("data-lazy-src");

            if (
              possibleUrl &&
              !possibleUrl.includes(".svg") &&
              !possibleUrl.includes("placeholder") &&
              !possibleUrl.includes("loading") &&
              possibleUrl.length > 10
            ) {
              imageUrl = possibleUrl;
              break;
            }
          }
        }

        if (imageUrl && !imageUrl.startsWith("http")) {
          if (imageUrl.startsWith("//")) {
            imageUrl = "https:" + imageUrl;
          } else if (imageUrl.startsWith("/")) {
            imageUrl = "https://priceoye.pk" + imageUrl;
          }
        }

        return imageUrl;
      };

      return cards.map((card) => {
        const title =
          card.querySelector(".p-title")?.textContent?.trim() || null;

        const priceText =
          card.querySelector(".price-box")?.textContent?.trim() || null;
        const price = priceText
          ? parseInt(priceText.replace(/[^\d]/g, ""))
          : null;

        const image = extractImageUrl(card);
        const link = card.querySelector("a")?.href || null;

        const calculateRelevance = (productName, query) => {
          if (!productName || !query) return 0;
          const productLower = productName.toLowerCase();
          const queryLower = query.toLowerCase();
          const queryWords = queryLower
            .split(/\s+/)
            .filter((word) => word.length > 1);
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
      });
    }, query);

    console.log(`✅ Found ${products.length} products on PriceOye`);

    const validProducts = products.filter((p) => p.name);
    const productsWithImages = validProducts.filter((p) => p.imageUrl);

    console.log(
      `📸 ${productsWithImages.length}/${validProducts.length} products have valid images`
    );

    return validProducts;
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

// Test run
// import priceOyeScraper from "./priceoye_api_scraper.js";
// const results = await priceOyeScraper("Smart Digital Led watch for men - M4");
// console.log(results);
