// Enhanced Alibaba Scraper
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from 'fs/promises';
import path from 'path';

puppeteer.use(StealthPlugin());

class AlibabaScraper {
  constructor(options = {}) {
    this.options = {
      headless: options.headless ?? true,
      timeout: options.timeout ?? 30000,
      delay: options.delay ?? 1000,
      maxRetries: options.maxRetries ?? 3,
      outputDir: options.outputDir ?? './scraped_data',
      saveImages: options.saveImages ?? false,
      userAgent: options.userAgent ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: options.viewport ?? { width: 1920, height: 1080 }
    };
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🚀 Initializing Alibaba scraper...');
    
    try {
      this.browser = await puppeteer.launch({
        headless: this.options.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport(this.options.viewport);
      await this.page.setUserAgent(this.options.userAgent);
      
      // Block unnecessary resources to speed up scraping
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        if (req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Create output directory
      await fs.mkdir(this.options.outputDir, { recursive: true });
      
      console.log('✅ Scraper initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize scraper:', error.message);
      throw error;
    }
  }

  async scrapeProducts(query, options = {}) {
    const {
      maxPages = 5,
      minProducts = 50,
      saveToFile = true,
      includeDetails = false,
      filters = {}
    } = options;

    console.log(`🔍 Starting comprehensive scrape for: "${query}"`);
    console.log(`📄 Max pages: ${maxPages}, Min products: ${minProducts}`);

    const allProducts = [];
    let currentPage = 1;
    let hasNextPage = true;

    try {
      while (currentPage <= maxPages && hasNextPage && allProducts.length < minProducts) {
        console.log(`\n📄 Scraping page ${currentPage}...`);
        
        const pageProducts = await this.scrapePage(query, currentPage, filters);
        
        if (pageProducts.length === 0) {
          console.log('⚠️ No products found on this page, stopping...');
          hasNextPage = false;
          break;
        }

        // Add detailed product information if requested
        if (includeDetails) {
          console.log('🔍 Fetching detailed product information...');
          for (let i = 0; i < pageProducts.length; i++) {
            try {
              pageProducts[i].details = await this.getProductDetails(pageProducts[i].link);
              console.log(`✅ Details fetched for product ${i + 1}/${pageProducts.length}`);
              await this.delay();
            } catch (error) {
              console.log(`⚠️ Failed to fetch details for product ${i + 1}: ${error.message}`);
              pageProducts[i].details = null;
            }
          }
        }

        allProducts.push(...pageProducts);
        console.log(`✅ Page ${currentPage}: Found ${pageProducts.length} products (Total: ${allProducts.length})`);

        // Check if there's a next page
        hasNextPage = await this.hasNextPage();
        currentPage++;

        // Delay between pages to be respectful
        await this.delay(2000);
      }

      console.log(`\n🎉 Scraping completed! Total products found: ${allProducts.length}`);

      // Save results
      if (saveToFile) {
        await this.saveResults(query, allProducts);
      }

      return {
        query,
        totalProducts: allProducts.length,
        pagesScraped: currentPage - 1,
        products: allProducts,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error during scraping:', error.message);
      throw error;
    }
  }

  async scrapePage(query, pageNum = 1, filters = {}) {
    let retries = 0;
    
    while (retries < this.options.maxRetries) {
      try {
        const searchUrl = this.buildSearchUrl(query, pageNum, filters);
        console.log(`🌐 Navigating to: ${searchUrl}`);
        
        await this.page.goto(searchUrl, { 
          waitUntil: "domcontentloaded",
          timeout: this.options.timeout 
        });

        // Wait for products to load
        await this.waitForProducts();

        // Extract product data
        const products = await this.extractProducts();
        
        return products;

      } catch (error) {
        retries++;
        console.log(`⚠️ Attempt ${retries} failed: ${error.message}`);
        
        if (retries >= this.options.maxRetries) {
          throw new Error(`Failed to scrape page ${pageNum} after ${this.options.maxRetries} retries`);
        }
        
        await this.delay(3000 * retries); // Exponential backoff
      }
    }
  }

  buildSearchUrl(query, pageNum, filters) {
    let url = `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(query)}&page=${pageNum}`;
    
    // Add filters
    if (filters.priceMin) url += `&price_min=${filters.priceMin}`;
    if (filters.priceMax) url += `&price_max=${filters.priceMax}`;
    if (filters.minOrder) url += `&min_order=${filters.minOrder}`;
    if (filters.category) url += `&category=${filters.category}`;
    if (filters.supplier) url += `&supplier_type=${filters.supplier}`;
    
    return url;
  }

  async waitForProducts() {
    const selectors = [
      ".list-no-v2-outter",
      ".organic-offer-wrapper",
      ".m-offer-item",
      "[data-spm-anchor-id]"
    ];

    let productSelector = null;
    
    for (const selector of selectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 10000 });
        productSelector = selector;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!productSelector) {
      // Try to detect CAPTCHA or blocking
      const captchaSelectors = [
        ".captcha",
        "#captcha",
        ".slider-verify",
        ".verification"
      ];

      for (const selector of captchaSelectors) {
        const captcha = await this.page.$(selector);
        if (captcha) {
          throw new Error('CAPTCHA detected. Please solve manually or try again later.');
        }
      }

      throw new Error('No products found on page. Page may have changed structure.');
    }

    console.log(`✅ Products loaded with selector: ${productSelector}`);
    return productSelector;
  }

  async extractProducts() {
    return await this.page.evaluate(() => {
      const items = [];
      
      // Multiple selectors to handle different page layouts
      const containerSelectors = [
        ".list-no-v2-outter",
        ".organic-offer-wrapper",
        ".m-offer-item"
      ];

      let containers = [];
      for (const selector of containerSelectors) {
        containers = document.querySelectorAll(selector);
        if (containers.length > 0) break;
      }

      containers.forEach((el, index) => {
        try {
          // Extract basic information
          const title = this.extractText(el, [
            ".elements-title-normal__content",
            ".offer-title",
            ".m-offer-title",
            "h2",
            "h3"
          ]) || `Product ${index + 1}`;

          const price = this.extractText(el, [
            ".elements-offer-price-normal__price",
            ".offer-price",
            ".price-range",
            "[class*='price']"
          ]) || "N/A";

          const minOrder = this.extractText(el, [
            ".element-offer-minorder-normal__value",
            ".min-order",
            "[class*='min-order']",
            "[class*='moq']"
          ]) || "N/A";

          // Extract links
          const linkEl = el.querySelector("a");
          const link = linkEl ? linkEl.href : null;

          // Extract images
          const imgEl = el.querySelector("img");
          const image = imgEl ? (imgEl.src || imgEl.dataset.src) : null;

          // Extract supplier information
          const supplier = this.extractText(el, [
            ".supplier-name",
            ".company-name",
            "[class*='supplier']",
            "[class*='company']"
          ]) || "N/A";

          // Extract location
          const location = this.extractText(el, [
            ".supplier-location",
            ".location",
            "[class*='location']"
          ]) || "N/A";

          // Extract rating/verification status
          const verified = el.querySelector("[class*='verified']") !== null;
          const goldSupplier = el.querySelector("[class*='gold']") !== null;

          // Extract shipping information
          const shipping = this.extractText(el, [
            ".shipping-info",
            "[class*='shipping']",
            "[class*='delivery']"
          ]) || "N/A";

          items.push({
            id: `alibaba_${Date.now()}_${index}`,
            title: title.trim(),
            price: price.trim(),
            minOrder: minOrder.trim(),
            link,
            image,
            supplier: supplier.trim(),
            location: location.trim(),
            verified,
            goldSupplier,
            shipping: shipping.trim(),
            scrapedAt: new Date().toISOString()
          });

        } catch (error) {
          console.log(`Error extracting product ${index}:`, error.message);
        }
      });

      return items;
    });
  }

  async getProductDetails(productUrl) {
    if (!productUrl) return null;

    const detailPage = await this.browser.newPage();
    
    try {
      await detailPage.goto(productUrl, { 
        waitUntil: "domcontentloaded",
        timeout: 15000 
      });

      const details = await detailPage.evaluate(() => {
        const getTextContent = (selector) => {
          const el = document.querySelector(selector);
          return el ? el.textContent.trim() : null;
        };

        return {
          description: getTextContent(".product-description") || 
                      getTextContent("[class*='description']"),
          specifications: Array.from(document.querySelectorAll(".spec-item, .specification tr"))
                          .map(el => el.textContent.trim())
                          .filter(text => text.length > 0),
          images: Array.from(document.querySelectorAll(".product-image img"))
                   .map(img => img.src || img.dataset.src)
                   .filter(src => src),
          certifications: Array.from(document.querySelectorAll("[class*='cert']"))
                          .map(el => el.textContent.trim())
                          .filter(text => text.length > 0),
          paymentMethods: Array.from(document.querySelectorAll("[class*='payment']"))
                          .map(el => el.textContent.trim())
                          .filter(text => text.length > 0)
        };
      });

      await detailPage.close();
      return details;

    } catch (error) {
      await detailPage.close();
      throw error;
    }
  }

  async hasNextPage() {
    try {
      const nextButton = await this.page.$(".next-btn:not(.disabled), .pagination-next:not(.disabled)");
      return nextButton !== null;
    } catch (error) {
      return false;
    }
  }

  async saveResults(query, products) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `alibaba_${query.replace(/\s+/g, '_')}_${timestamp}`;
    
    // Save as JSON
    const jsonPath = path.join(this.options.outputDir, `${filename}.json`);
    await fs.writeFile(jsonPath, JSON.stringify({
      query,
      totalProducts: products.length,
      scrapedAt: new Date().toISOString(),
      products
    }, null, 2));
    
    // Save as CSV
    const csvPath = path.join(this.options.outputDir, `${filename}.csv`);
    const csvContent = this.convertToCSV(products);
    await fs.writeFile(csvPath, csvContent);
    
    console.log(`💾 Results saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   CSV: ${csvPath}`);
  }

  convertToCSV(products) {
    if (products.length === 0) return '';
    
    const headers = Object.keys(products[0]).join(',');
    const rows = products.map(product => 
      Object.values(product).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }

  async delay(ms = null) {
    const delayTime = ms || this.options.delay;
    await new Promise(resolve => setTimeout(resolve, delayTime));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔚 Browser closed');
    }
  }

  // Utility method for text extraction in page context
  static extractText(element, selectors) {
    for (const selector of selectors) {
      const el = element.querySelector(selector);
      if (el && el.textContent.trim()) {
        return el.textContent.trim();
      }
    }
    return null;
  }
}

// Usage Examples and Export
export { AlibabaScraper };

// Convenience function for simple scraping
export async function scrapeAlibaba(query, options = {}) {
  const scraper = new AlibabaScraper(options);
  
  try {
    await scraper.initialize();
    const results = await scraper.scrapeProducts(query, options);
    return results;
  } finally {
    await scraper.close();
  }
}

// Example usage:
/*
import { AlibabaScraper, scrapeAlibaba } from './alibaba_scraper.js';

// Simple usage
const results = await scrapeAlibaba('wireless headphones', {
  maxPages: 3,
  minProducts: 30,
  includeDetails: false
});

// Advanced usage
const scraper = new AlibabaScraper({
  headless: false,
  timeout: 45000,
  delay: 2000,
  saveImages: false
});

await scraper.initialize();

const advancedResults = await scraper.scrapeProducts('bluetooth speakers', {
  maxPages: 5,
  minProducts: 50,
  includeDetails: true,
  filters: {
    priceMin: 10,
    priceMax: 100,
    supplier: 'verified'
  }
});

await scraper.close();
*/