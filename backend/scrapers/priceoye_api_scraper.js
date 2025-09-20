import { chromium } from 'playwright';

// Helper function to extract company name from product title (synchronized with Daraz)
function extractCompany(productName) {
  if (!productName) return null;

  // Common brand patterns - you can expand this list
  const brandPatterns = [
    /^(Apple|iPhone|iPad|MacBook)/i,
    /^(Samsung|Galaxy)/i,
    /^(HP|Dell|Lenovo|Acer|Asus)/i,
    /^(Sony|LG|TCL|Haier)/i,
    /^(Nike|Adidas|Puma)/i,
    /^(Xiaomi|Huawei|OnePlus|Oppo|Vivo)/i,
    /^(Canon|Nikon|Fujifilm)/i,
    /^(Microsoft|Surface)/i,
    /^(Google|Pixel)/i,
    /^(Realme|Infinix|Tecno)/i,
  ];

  // Try to match against known brand patterns
  for (const pattern of brandPatterns) {
    const match = productName.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // Fallback: extract first word as potential brand
  const firstWord = productName.split(' ')[0];

  // Return first word if it looks like a brand (starts with capital letter)
  if (firstWord && /^[A-Z]/.test(firstWord)) {
    return firstWord;
  }

  return null;
}

// Helper function to extract numeric price from price string (synchronized with Daraz)
function extractPrice(priceString) {
  if (!priceString) return null;

  // Remove "Rs.", spaces, and commas, but keep the numbers
  // Handle formats like "Rs. 74,999" or "Rs.74999"
  const cleanPrice = priceString
    .replace(/Rs\.?\s*/i, '') // Remove "Rs." or "Rs"
    .replace(/,/g, '') // Remove commas
    .trim();

  const price = parseInt(cleanPrice);

  return isNaN(price) ? null : price;
}

async function priceOyeScraper(query) {
  let browser = null;

  try {
    console.log(`Attempting to scrape PriceOye for: ${query}`);

    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ignoreHTTPSErrors: true,
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Navigate to search page
    const searchUrl = `https://priceoye.pk/search?q=${encodeURIComponent(query)}`;

    const response = await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    if (!response || response.status() >= 400) {
      console.log("Failed to load PriceOye search page");
      return { success: false, products: [] };
    }

    // Wait for content to load
    await page.waitForTimeout(3000);

    console.log("Search page loaded, extracting products...");

    // Extract product data from search results
    const rawProducts = await page.evaluate(() => {
      const productElements = document.querySelectorAll('.product-card, .product-item, .product, .card, .item, [class*="product-"], article');
      const results = [];

      productElements.forEach(element => {
        try {
          // Extract title with more specific selectors and validation
          const titleSelectors = [
            'h2 a', 'h3 a', // Title inside link
            '.product-title', '.product-name',
            'h2', 'h3', 'h4',
            '.title', '.name',
            '[class*="title"]', '[class*="name"]'
          ];

          let title = null;
          for (const selector of titleSelectors) {
            const titleElement = element.querySelector(selector);
            const titleText = titleElement?.textContent?.trim();

            // Validate title - should be longer than 10 chars and not generic text
            if (titleText &&
                titleText.length > 10 &&
                !titleText.toLowerCase().includes('search result') &&
                !titleText.toLowerCase().includes('results found') &&
                !titleText.toLowerCase().includes('no results') &&
                !titleText.toLowerCase().includes('loading') &&
                titleText !== 'Search' &&
                titleText !== 'Result') {
              title = titleText;
              break;
            }
          }

          // Extract price with multiple selectors
          const priceSelectors = [
            '.price', '.current-price', '.price-current', 
            '[class*="price"]', '.cost', '.amount'
          ];
          
          let priceText = null;
          for (const selector of priceSelectors) {
            const priceElement = element.querySelector(selector);
            const price = priceElement?.textContent?.trim();
            if (price && price.match(/Rs\.?\s*\d/i)) {
              priceText = price;
              break;
            }
          }

          // Extract image
          const imgElement = element.querySelector('img');
          let imageUrl = imgElement?.src || imgElement?.getAttribute('data-src') || imgElement?.getAttribute('data-original');

          // Convert relative URLs to absolute
          if (imageUrl && imageUrl.startsWith('/')) {
            imageUrl = 'https://priceoye.pk' + imageUrl;
          } else if (imageUrl && imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          }

          // Extract product URL
          const linkElement = element.querySelector('a') || element.closest('a');
          let productUrl = linkElement?.href || linkElement?.getAttribute('href');

          // Convert relative URLs to absolute
          if (productUrl && productUrl.startsWith('/')) {
            productUrl = 'https://priceoye.pk' + productUrl;
          } else if (productUrl && !productUrl.startsWith('http')) {
            productUrl = 'https://priceoye.pk/' + productUrl;
          }

          // Extract rating (if available)
          const ratingSelectors = [
            '.rating', '.stars', '[class*="rating"]', 
            '[class*="star"]', '.review-score'
          ];
          
          let rating = null;
          for (const selector of ratingSelectors) {
            const ratingElement = element.querySelector(selector);
            if (ratingElement) {
              const ratingText = ratingElement.textContent || ratingElement.getAttribute('data-rating');
              const ratingMatch = ratingText?.match(/(\d+\.?\d*)/);
              if (ratingMatch) {
                const val = parseFloat(ratingMatch[1]);
                if (val >= 0 && val <= 5) {
                  rating = val;
                  break;
                }
              }
            }
          }

          // Only add if we have essential data
          if (title && priceText && title.length > 5) {
            results.push({
              name: title,
              priceShow: priceText,
              image: imageUrl,
              productUrl: productUrl,
              ratingScore: rating
            });
          }
        } catch (error) {
          // Skip this product if extraction fails
          console.log('Error extracting product:', error.message);
        }
      });

      return results;
    });

    console.log(`Found ${rawProducts.length} raw products`);

    // Check response shape with better error handling
    if (!rawProducts || !Array.isArray(rawProducts)) {
      console.log("Invalid response format from PriceOye scraping");
      return { success: false, products: [] };
    }

    // Debug: Log the structure of the first item to understand available fields
    if (rawProducts.length > 0) {
      console.log("First item structure:", Object.keys(rawProducts[0]));
      console.log("First item sample:", rawProducts[0]);
    }

    // Transform data to match Daraz format exactly
    const products = rawProducts
      .filter(item => item.name && item.priceShow) // Filter out invalid items (same as Daraz)
      .map((item) => {
        // Handle URL field (same logic as Daraz)
        let productUrl = null;
        const urlFields = ['productUrl', 'itemUrl', 'url', 'link', 'href', 'productLink', 'itemLink'];

        for (const field of urlFields) {
          if (item[field]) {
            // Handle both absolute and relative URLs
            if (item[field].startsWith('http')) {
              productUrl = item[field];
            } else if (item[field].startsWith('//')) {
              productUrl = `https:${item[field]}`;
            } else if (item[field].startsWith('/')) {
              productUrl = `https://priceoye.pk${item[field]}`;
            } else {
              productUrl = `https://priceoye.pk/${item[field]}`;
            }
            break;
          }
        }

        // Use productUrl from the item directly if available
        if (!productUrl && item.productUrl) {
          productUrl = item.productUrl;
        }

        return {
          name: item.name,
          price: extractPrice(item.priceShow),
          marketplace: "priceoye",
          imageUrl: item.image,
          url: productUrl,
          rating: item.ratingScore || null,
          company: extractCompany(item.name)
        };
      });

    console.log(`Successfully parsed ${products.length} valid products`);

    await browser.close();
    return { success: true, products: products };

  } catch (error) {
    console.error("PriceOye Scraper Error:", error.message);

    // Provide more specific error handling (synchronized with Daraz)
    if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
      console.error("DNS resolution failed - check internet connection and DNS settings");
    } else if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.error("Connection refused - website may be down or blocking requests");
    } else if (error.message.includes('TimeoutError')) {
      console.error("Request timed out - try again or check network speed");
    } else if (error.message.includes('Page crashed')) {
      console.error("Page crashed - possibly due to anti-bot measures");
    }

    if (browser) {
      await browser.close();
    }
    return { success: false, products: [] };
  }
}

export default priceOyeScraper;