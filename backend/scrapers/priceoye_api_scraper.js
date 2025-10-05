import { chromium } from "playwright";

/**
 * Custom error classes for better error handling
 */
class ScraperError extends Error {
  constructor(message, type) {
    super(message);
    this.name = "ScraperError";
    this.type = type;
  }
}

/**
 * Simple logger utility
 */
class Logger {
  static levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
  static currentLevel = Logger.levels.INFO;

  static debug(message, ...args) {
    if (this.currentLevel <= this.levels.DEBUG)
      console.log(`[DEBUG] ${message}`, ...args);
  }

  static info(message, ...args) {
    if (this.currentLevel <= this.levels.INFO)
      console.log(`[INFO] ${message}`, ...args);
  }

  static warn(message, ...args) {
    if (this.currentLevel <= this.levels.WARN)
      console.warn(`[WARN] ${message}`, ...args);
  }

  static error(message, ...args) {
    if (this.currentLevel <= this.levels.ERROR)
      console.error(`[ERROR] ${message}`, ...args);
  }
}

/**
 * Enhanced PriceOye Scraper with improved error handling, reliability, and performance
 */
export class PriceOyeScraper {
  constructor(options = {}) {
    this.browser = null;
    this.page = null;
    this.context = null;
    this.options = {
      headless: options.headless !== false,
      timeout: options.timeout || 30000,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      reuseInstance: options.reuseInstance !== false,
      ...options,
    };
    this.isInitialized = false;
  }

  /**
   * Get a random modern user agent
   */
  getRandomUserAgent() {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * Add random human-like delay
   */
  async randomDelay(min = 500, max = 1500) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Initialize browser with proper error handling
   */
  async init() {
    if (this.isInitialized && this.options.reuseInstance) {
      Logger.debug("Browser instance already initialized, reusing...");
      return;
    }

    try {
      Logger.info("Launching browser...");
      this.browser = await chromium.launch({
        headless: this.options.headless,
        args: [
          "--disable-blink-features=AutomationControlled",
          "--disable-dev-shm-usage",
          "--no-sandbox",
        ],
      });

      this.context = await this.browser.newContext({
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
        locale: "en-US",
        timezoneId: "Asia/Karachi",
        extraHTTPHeaders: {
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      // Add script to prevent detection
      await this.context.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
      });

      this.page = await this.context.newPage();
      this.page.setDefaultTimeout(this.options.timeout);

      this.isInitialized = true;
      Logger.info("Browser initialized successfully");
    } catch (error) {
      Logger.error("Failed to initialize browser:", error.message);
      await this.cleanup();
      throw new ScraperError(
        `Browser initialization failed: ${error.message}`,
        "INIT_ERROR"
      );
    }
  }

  /**
   * Cleanup resources properly
   */
  async cleanup() {
    try {
      if (this.page) await this.page.close().catch(() => {});
      if (this.context) await this.context.close().catch(() => {});
      if (this.browser) await this.browser.close().catch(() => {});
    } catch (error) {
      Logger.warn("Error during cleanup:", error.message);
    } finally {
      this.page = null;
      this.context = null;
      this.browser = null;
      this.isInitialized = false;
    }
  }

  /**
   * Close browser instance
   */
  async close() {
    await this.cleanup();
    Logger.info("Browser closed");
  }

  /**
   * Retry wrapper with exponential backoff
   */
  async retryOperation(operation, operationName = "operation") {
    let lastError;

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        Logger.debug(
          `Attempting ${operationName} (${attempt}/${this.options.maxRetries})`
        );
        return await operation();
      } catch (error) {
        lastError = error;
        Logger.warn(
          `${operationName} failed (attempt ${attempt}/${this.options.maxRetries}):`,
          error.message
        );

        if (attempt < this.options.maxRetries) {
          const delay = this.options.retryDelay * Math.pow(2, attempt - 1);
          Logger.debug(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new ScraperError(
      `${operationName} failed after ${this.options.maxRetries} attempts: ${lastError.message}`,
      "RETRY_EXHAUSTED"
    );
  }

  /**
   * Validate image URL
   */
  validateImageUrl(url) {
    if (!url || typeof url !== "string") return false;

    // Check for invalid patterns
    const invalidPatterns = [
      /\.svg$/i,
      /placeholder/i,
      /loading/i,
      /lazy/i,
      /spinner/i,
      /data:image\/svg/i,
      /^data:image\/gif/i,
      /1x1\.gif/i,
      /1x1\.png/i,
      /blank/i,
      /spacer/i,
      /transparent/i,
      /pixel\.(gif|png)/i,
      /preload/i,
      /default\.(gif|svg)/i,
    ];

    if (invalidPatterns.some((pattern) => pattern.test(url))) {
      return false;
    }

    // Check for valid image extensions
    if (!/\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(url)) {
      // Allow URLs without extension if they start with http and don't match invalid patterns
      if (!url.startsWith("http")) return false;
    }

    // URL should be reasonably long (placeholders are usually very short)
    if (url.length < 25) return false;

    // Check if URL contains actual product identifiers
    const hasProductIndicators = /product|image|upload|media|cdn|asset|photo/i.test(url);
    if (!hasProductIndicators && url.includes("priceoye.pk")) {
      return false;
    }

    return true;
  }

  /**
   * Extract image URL with improved logic - waits for actual image to load
   */
  async extractImageUrlFromCard(card) {
    // Try to get the highest quality image available
    const imageSelectors = [
      'img[data-src*="product"]',
      'img[src*="product"]',
      'img[data-original*="product"]',
      '.product-image img',
      '.p-image img',
      'picture source[type="image/webp"]',
      'picture img',
      '[class*="image"] img:not([src*="placeholder"]):not([src*="lazy"])',
      'img[loading="lazy"]',
      'img',
    ];

    for (const selector of imageSelectors) {
      try {
        const elements = card.querySelectorAll(selector);
        
        for (const element of elements) {
          let imageUrl = null;
          
          // Priority order for attributes
          const attributes = [
            'data-src',
            'data-original',
            'data-lazy-src',
            'srcset',
            'src',
          ];
          
          for (const attr of attributes) {
            let value = element.getAttribute(attr);
            
            if (value) {
              // For srcset, take the highest resolution image
              if (attr === 'srcset') {
                const srcsetUrls = value.split(',').map(s => s.trim().split(' ')[0]);
                value = srcsetUrls[srcsetUrls.length - 1] || srcsetUrls[0];
              }
              
              // Skip obvious placeholders immediately
              if (
                value.includes('placeholder') ||
                value.includes('lazy') ||
                value.includes('loading') ||
                value.includes('1x1.') ||
                value.includes('blank') ||
                value.includes('spacer') ||
                value.includes('transparent') ||
                value.includes('data:image/gif') ||
                value.includes('data:image/svg') ||
                value.endsWith('.svg') ||
                value.length < 25
              ) {
                continue;
              }
              
              // Check if it looks like a real product image
              const hasProductPath = /product|upload|media|cdn|asset|images?|photos?/i.test(value);
              const hasImageExtension = /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(value);
              
              if (hasProductPath || hasImageExtension) {
                imageUrl = value;
                break;
              }
            }
          }
          
          if (imageUrl) {
            return imageUrl;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    return null;
  }

  /**
   * Normalize URL to absolute format
   */
  normalizeUrl(url) {
    if (!url) return null;

    if (url.startsWith("//")) {
      return "https:" + url;
    } else if (url.startsWith("/")) {
      return "https://priceoye.pk" + url;
    } else if (!url.startsWith("http")) {
      return "https://priceoye.pk/" + url;
    }

    return url;
  }

  /**
   * Parse price with better error handling
   */
  parsePrice(priceText) {
    if (!priceText) return null;

    try {
      // Remove everything except digits and commas
      const cleanText = priceText.replace(/[^\d,]/g, "");

      // Handle price ranges (take the first price)
      const prices = cleanText.split(",").filter((p) => p.length > 0);

      if (prices.length === 0) return null;

      // If we have multiple segments, it might be a formatted number (1,299) or range
      let price;
      if (prices.length === 1) {
        price = parseInt(prices[0]);
      } else {
        // Try to determine if it's a formatted number or a range
        const firstNum = parseInt(prices[0] + prices[1]);
        // If resulting number is reasonable (< 10 million PKR), treat as formatted number
        if (firstNum < 10000000) {
          price = firstNum;
        } else {
          // Otherwise, take first price
          price = parseInt(prices[0]);
        }
      }

      // Validate price is reasonable (between 100 PKR and 10 million PKR)
      if (price < 100 || price > 10000000) {
        Logger.warn(`Suspicious price detected: ${price} from "${priceText}"`);
        return null;
      }

      return price;
    } catch (error) {
      Logger.warn(`Failed to parse price: "${priceText}"`, error.message);
      return null;
    }
  }

  /**
   * Calculate relevance score with improved algorithm and accessory filtering
   */
  calculateRelevance(productName, query) {
    if (!productName || !query) return 0;

    const normalize = (str) =>
      str
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const productNorm = normalize(productName);
    const queryNorm = normalize(query);

    // Exclude accessories and irrelevant products
    const accessoryKeywords = [
      'protector', 'case', 'cover', 'charger', 'cable', 'adapter', 
      'screen guard', 'tempered glass', 'holder', 'stand', 'mount',
      'earphone', 'headphone', 'earbuds', 'airpods', 'pouch', 'bag',
      'stylus', 'pen', 'cleaner', 'kit', 'tool', 'sticker', 'skin',
      'strap', 'band', 'ring', 'grip', 'wallet', 'card holder',
      'lens protector', 'camera protector', 'back cover', 'flip cover',
      'bumper', 'shell', 'sleeve', 'jacket', 'armor', 'shield'
    ];

    // Check if product is an accessory
    const isAccessory = accessoryKeywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(productName);
    });

    const queryWords = queryNorm.split(" ").filter((w) => w.length > 1);

    // If searching for main product (e.g., "iPhone 15 Pro Max"), exclude accessories
    const isMainProductSearch = queryWords.some(word => 
      ['iphone', 'samsung', 'galaxy', 'pixel', 'oneplus', 'xiaomi', 'oppo', 'vivo', 
       'realme', 'huawei', 'nokia', 'motorola', 'laptop', 'macbook', 'tablet', 'ipad',
       'watch', 'airpods', 'buds'].includes(word.toLowerCase())
    );

    if (isMainProductSearch && isAccessory) {
      Logger.debug(`Excluding accessory: "${productName}"`);
      return 0;
    }

    // Exact match gets highest score
    if (productNorm === queryNorm) return 100;

    if (queryWords.length === 0) return 0;

    let score = 0;
    let matchedWords = 0;
    const productWords = productNorm.split(" ");

    for (const qWord of queryWords) {
      // Exact word match
      if (productWords.includes(qWord)) {
        matchedWords++;
        score += 10;
        continue;
      }

      // Partial match (word contains query word or vice versa)
      const partialMatch = productWords.some(
        (pWord) =>
          pWord.includes(qWord) ||
          qWord.includes(pWord) ||
          (qWord.length > 3 && pWord.startsWith(qWord.slice(0, -1)))
      );

      if (partialMatch) {
        matchedWords++;
        score += 5;
        continue;
      }

      // Check singular/plural
      const variants = [
        qWord + "s",
        qWord.endsWith("s") ? qWord.slice(0, -1) : null,
        qWord.endsWith("es") ? qWord.slice(0, -2) : null,
      ].filter(Boolean);

      if (variants.some((v) => productWords.includes(v))) {
        matchedWords++;
        score += 8;
      }
    }

    // Penalize if too few words matched
    const matchRatio = matchedWords / queryWords.length;
    if (matchRatio < 0.4) return 0;

    // Bonus for word order preservation
    if (productNorm.includes(queryNorm)) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  /**
   * Smart scroll to trigger lazy loading
   */
  async smartScroll() {
    await this.page.evaluate(async () => {
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      // Scroll in steps to trigger lazy loading
      const steps = 5;
      const scrollHeight = document.body.scrollHeight;
      const stepSize = scrollHeight / steps;

      for (let i = 1; i <= steps; i++) {
        window.scrollTo(0, stepSize * i);
        await delay(300);
      }

      // Wait at bottom
      await delay(1000);

      // Scroll back to top
      window.scrollTo(0, 0);
      await delay(500);
    });
  }

  /**
   * Wait for images to actually load and replace placeholders
   */
  async waitForRealImages() {
    try {
      // Wait for lazy loading to complete
      await this.page.waitForFunction(
        () => {
          const images = document.querySelectorAll('.productBox img');
          let realImagesCount = 0;
          
          for (const img of images) {
            const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
            
            // Check if it's a real image (not placeholder)
            const isPlaceholder = 
              src.includes('placeholder') ||
              src.includes('lazy') ||
              src.includes('1x1.') ||
              src.includes('blank') ||
              src.includes('loading') ||
              src.includes('data:image/gif') ||
              src.includes('data:image/svg') ||
              src.endsWith('.svg') ||
              src.length < 25;
            
            if (!isPlaceholder && src.length > 25) {
              realImagesCount++;
            }
          }
          
          // Consider loaded if we have at least some real images
          return realImagesCount > 0;
        },
        { timeout: 8000 }
      );
      
      Logger.debug("Real product images loaded");
    } catch (error) {
      Logger.debug("Timeout waiting for real images, continuing anyway");
    }
    
    // Additional wait for any final image swaps
    await this.page.waitForTimeout(1000);
  }

  /**
   * Remove duplicate products
   */
  deduplicateProducts(products) {
    const seen = new Map();

    return products.filter((product) => {
      if (!product.name) return false;

      const key = product.name.toLowerCase().trim();

      if (seen.has(key)) {
        // Keep product with better image or higher relevance
        const existing = seen.get(key);
        if (
          (product.imageUrl && !existing.imageUrl) ||
          product.relevanceScore > existing.relevanceScore
        ) {
          seen.set(key, product);
          return true;
        }
        return false;
      }

      seen.set(key, product);
      return true;
    });
  }

  /**
   * Main search function with all improvements
   */
  async searchProducts(query) {
    if (!query || query.trim().length === 0) {
      throw new ScraperError("Search query cannot be empty", "INVALID_QUERY");
    }

    await this.init();

    return this.retryOperation(async () => {
      const searchUrl = `https://priceoye.pk/search?q=${encodeURIComponent(
        query
      )}`;
      Logger.info(`Searching PriceOye: ${searchUrl}`);

      try {
        // Navigate with network idle
        await this.page.goto(searchUrl, {
          waitUntil: "networkidle",
          timeout: this.options.timeout,
        });

        await this.randomDelay(1000, 2000);

        // Wait for product cards with better error handling
        const productBoxExists = await this.page
          .waitForSelector(".productBox", { timeout: 15000 })
          .then(() => true)
          .catch(() => false);

        if (!productBoxExists) {
          // Check if it's a "no results" page
          const noResults = await this.page.$(".no-results, .empty-state");
          if (noResults) {
            Logger.info("No products found for query");
            return [];
          }

          throw new ScraperError(
            "Product containers not found - page structure may have changed",
            "SELECTOR_NOT_FOUND"
          );
        }

        // Smart scroll to load lazy images
        await this.smartScroll();
        await this.waitForRealImages();

        // Extract products
        const products = await this.page.evaluate((searchQuery) => {
          const cards = document.querySelectorAll(".productBox");

          // Helper function to extract image URL (same logic as extractImageUrlFromCard)
          const extractImageUrl = (card) => {
            const imageSelectors = [
              'img[data-src*="product"]',
              'img[src*="product"]',
              'img[data-original*="product"]',
              '.product-image img',
              '.p-image img',
              'picture source[type="image/webp"]',
              'picture img',
              '[class*="image"] img:not([src*="placeholder"]):not([src*="lazy"])',
              'img[loading="lazy"]',
              'img',
            ];

            for (const selector of imageSelectors) {
              try {
                const elements = card.querySelectorAll(selector);
                
                for (const element of elements) {
                  const attributes = ['data-src', 'data-original', 'data-lazy-src', 'srcset', 'src'];
                  
                  for (const attr of attributes) {
                    let value = element.getAttribute(attr);
                    
                    if (value) {
                      // For srcset, take the highest resolution
                      if (attr === 'srcset') {
                        const srcsetUrls = value.split(',').map(s => s.trim().split(' ')[0]);
                        value = srcsetUrls[srcsetUrls.length - 1] || srcsetUrls[0];
                      }
                      
                      // Skip placeholders
                      if (
                        value.includes('placeholder') ||
                        value.includes('lazy-load') ||
                        value.includes('loading') ||
                        value.includes('1x1.') ||
                        value.includes('blank') ||
                        value.includes('spacer') ||
                        value.includes('transparent') ||
                        value.includes('data:image/gif') ||
                        value.includes('data:image/svg') ||
                        value.endsWith('.svg') ||
                        value.length < 25
                      ) {
                        continue;
                      }
                      
                      // Check if it looks like a real product image
                      const hasProductPath = /product|upload|media|cdn|asset|images?|photos?/i.test(value);
                      const hasImageExtension = /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(value);
                      
                      if (hasProductPath || hasImageExtension) {
                        return value;
                      }
                    }
                  }
                }
              } catch (error) {
                continue;
              }
            }
            
            return null;
          };

          return Array.from(cards).map((card) => {
            // Title extraction with fallbacks
            const title =
              card.querySelector(".p-title")?.textContent?.trim() ||
              card.querySelector("h3")?.textContent?.trim() ||
              card.querySelector("a")?.getAttribute("title") ||
              null;

            // Price extraction with fallbacks
            const priceElement = card.querySelector(".price-box, .price, [class*='price']");
            const priceText = priceElement?.textContent?.trim() || null;

            // Image extraction using our improved function
            const imageUrl = extractImageUrl(card);

            // Link extraction
            const linkElement = card.querySelector("a");
            const link = linkElement?.href || null;

            return {
              name: title,
              priceText: priceText,
              imageUrl: imageUrl,
              url: link,
              searchQuery: searchQuery,
            };
          });
        }, query);

        Logger.info(`Extracted ${products.length} products from page`);

        // Process products
        const processedProducts = products
          .map((p) => {
            // Validate and process image URL
            const imageUrl = this.validateImageUrl(p.imageUrl)
              ? this.normalizeUrl(p.imageUrl)
              : null;

            return {
              name: p.name,
              price: this.parsePrice(p.priceText),
              marketplace: "priceoye",
              imageUrl: imageUrl,
              url: this.normalizeUrl(p.url),
              relevanceScore: this.calculateRelevance(p.name, query),
            };
          })
          .filter((p) => p.name && p.relevanceScore > 0); // Filter out irrelevant products

        // Remove duplicates
        const uniqueProducts = this.deduplicateProducts(processedProducts);

        // Sort by relevance
        uniqueProducts.sort((a, b) => b.relevanceScore - a.relevanceScore);

        Logger.info(
          `Returning ${uniqueProducts.length} unique, relevant products`
        );
        Logger.info(
          `Products with images: ${
            uniqueProducts.filter((p) => p.imageUrl).length
          }`
        );

        return uniqueProducts;
      } catch (error) {
        if (error instanceof ScraperError) throw error;

        Logger.error("Error during scraping:", error.message);
        throw new ScraperError(
          `Scraping failed: ${error.message}`,
          "SCRAPING_ERROR"
        );
      }
    }, "searchProducts");
  }
}

/**
 * Convenience function for single searches
 */
const priceOyeScraper = async (query, options = {}) => {
  const scraper = new PriceOyeScraper({ ...options, reuseInstance: false });
  try {
    const products = await scraper.searchProducts(query);
    return { success: true, products, error: null };
  } catch (error) {
    Logger.error("Scraper error:", error.message);
    return {
      success: false,
      products: [],
      error: {
        message: error.message,
        type: error.type || "UNKNOWN_ERROR",
      },
    };
  } finally {
    await scraper.close();
  }
};

export default priceOyeScraper;