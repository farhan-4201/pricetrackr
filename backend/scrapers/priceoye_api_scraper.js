import { chromium } from 'playwright';

// Extract company name from product title
function extractCompany(title) {
  if (!title) return null;

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
    const match = title.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // Fallback: extract first word as potential brand
  const firstWord = title.split(' ')[0];

  // Return first word if it looks like a brand (starts with capital letter)
  if (firstWord && /^[A-Z]/.test(firstWord)) {
    return firstWord;
  }

  return null;
}

// Clean and parse price
function parsePrice(priceText) {
  if (!priceText) return null;

  // Remove "Rs.", spaces, and commas, but keep the numbers
  const cleanPrice = priceText
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
    const products = await page.evaluate(() => {
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

          // Extract price
          const priceElement = element.querySelector('.price, .current-price, .price-current, [class*="price"]');
          const priceText = priceElement?.textContent?.trim();

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
          const ratingElement = element.querySelector('.rating, .stars, [class*="rating"], [class*="star"]');
          let rating = null;

          if (ratingElement) {
            const ratingText = ratingElement.textContent || ratingElement.getAttribute('data-rating');
            const ratingMatch = ratingText?.match(/(\d+\.?\d*)/);
            if (ratingMatch) {
              const val = parseFloat(ratingMatch[1]);
              if (val >= 0 && val <= 5) {
                rating = val;
              }
            }
          }

          // Only add if we have essential data
          if (title && priceText && title.length > 5) {
            results.push({
              title: title,
              priceText: priceText,
              imageUrl: imageUrl,
              productUrl: productUrl,
              rating: rating
            });
          }
        } catch (error) {
          // Skip this product if extraction fails
          console.log('Error extracting product:', error.message);
        }
      });

      return results;
    });

    console.log(`Found ${products.length} raw products`);

    // Transform to match Daraz format and remove duplicates
    const seenTitles = new Set();
    const transformedProducts = products
      .filter(item => {
        // Filter out invalid items and duplicates
        if (!item.title || !item.priceText) return false;

        // Check for duplicates
        if (seenTitles.has(item.title.toLowerCase())) return false;
        seenTitles.add(item.title.toLowerCase());

        return true;
      })
      .map((item) => ({
        name: item.title,
        price: parsePrice(item.priceText),
        marketplace: "priceoye",
        imageUrl: item.imageUrl,
        url: item.productUrl,
        rating: item.rating,
        company: extractCompany(item.title)
      }))
      .filter(product => {
        // Additional filtering for quality
        return product.price !== null &&
               product.name.length > 15 && // Ensure meaningful product names
               !product.name.toLowerCase().includes('search result') &&
               product.company !== 'Search' &&
               product.company !== 'Result';
      });

    console.log(`Successfully parsed ${transformedProducts.length} valid products`);

    await browser.close();
    return { success: true, products: transformedProducts };

  } catch (error) {
    console.error("PriceOye Scraper Error:", error.message);

    // Provide more specific error handling
    if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
      console.error("DNS resolution failed - check internet connection");
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
