import axios from "axios";

async function darazScraper(query) {
  try {
    const url = `https://www.daraz.pk/catalog/?_keyori=ss&ajax=true&q=${encodeURIComponent(query)}`;

    // Enhanced headers to mimic real browser
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1"
    };

    // Create axios instance with timeout and retries
    const axiosInstance = axios.create({
      timeout: 15000,
      maxRedirects: 5
    });

    console.log(`Attempting to scrape Daraz for: ${query}`);

    const { data } = await axiosInstance.get(url, { headers });

    console.log("API Response received, parsing...");

    // Check response shape with better error handling
    if (!data) {
      console.log("No data received from Daraz API");
      return { success: false, products: [] };
    }

    if (!data?.mods?.listItems || !Array.isArray(data.mods.listItems)) {
      console.log("Invalid response format from Daraz API");
      console.log("Response keys:", Object.keys(data));
      return { success: false, products: [] };
    }

    console.log(`Found ${data.mods.listItems.length} raw products`);

    // Debug: Log the structure of the first item to understand available fields
    if (data.mods.listItems.length > 0) {
      console.log("First item structure:", Object.keys(data.mods.listItems[0]));
      console.log("First item sample:", data.mods.listItems[0]);
    }

    const products = data.mods.listItems
      .filter(item => item.name && item.priceShow) // Filter out invalid items
      .map((item) => {
        const relevanceScore = calculateRelevance(item.name, query);
        console.log(`"${item.name}" - Relevance Score: ${relevanceScore}`);

        if (relevanceScore === 0) {
          return null; // Exclude irrelevant items
        }

        // Try different possible URL field names
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
              productUrl = `https://www.daraz.pk${item[field]}`;
            } else {
              productUrl = `https://www.daraz.pk/${item[field]}`;
            }
            break;
          }
        }

        // If no direct URL field, try to construct from productId
        if (!productUrl && item.productId) {
          // This is a fallback - construct URL from product ID
          productUrl = `https://www.daraz.pk/products/i${item.productId}.html`;
        }

        const validImageUrl = validateAndFixImageUrl(item.image);

        return {
          name: item.name,
          price: extractPrice(item.priceShow),
          marketplace: "daraz",
          imageUrl: validImageUrl,
          url: productUrl,
          rating: item.ratingScore || null,
          company: extractCompany(item.name),
          relevanceScore
        };
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort by relevance

    console.log(`Successfully parsed and filtered ${products.length} valid products`);
    return { success: true, products: products };
  } catch (error) {
    console.error("Daraz API Scraper Error:", error.message);

    // Provide more specific error handling
    if (error.code === 'ENOTFOUND') {
      console.error("DNS resolution failed - check internet connection and DNS settings");
    } else if (error.code === 'ECONNREFUSED') {
      console.error("Connection refused - website may be down or blocking requests");
    } else if (error.code === 'ETIMEDOUT') {
      console.error("Request timed out - try again or check network speed");
    } else if (error.response) {
      console.error(`Server error: ${error.response.status} - ${error.response.statusText}`);
    }

    return { success: false, products: [] };
  }
}

// Helper function to extract numeric price from price string
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

// Helper function to calculate relevance score
function calculateRelevance(productName, query) {
  if (!productName || !query) return 0;

  const productLower = productName.toLowerCase();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 1);

  let score = 0;
  let matchedWords = 0;

  // Prioritize model numbers
  const queryNumbers = query.match(/\d+/g) || [];
  const productNumbers = productName.match(/\d+/g) || [];

  if (queryNumbers.length > 0) {
    const allNumbersMatch = queryNumbers.every(num => productNumbers.includes(num));
    if (allNumbersMatch) {
      score += 5; // Strong bonus for matching all model numbers
    } else {
      // If numbers are present but don't match, it's likely irrelevant
      return 0;
    }
  }

  // Check for word matches
  for (const word of queryWords) {
    if (productLower.includes(word)) {
      matchedWords++;
      // Bonus for exact word matches
      const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
      if (wordRegex.test(productName)) {
        score += 2;
      } else {
        score += 1;
      }
    }
  }

  // Require at least half of the words to match
  if (queryWords.length > 0 && matchedWords / queryWords.length < 0.5) {
    return 0;
  }

  return score;
}

// Helper function to extract company name from product title
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

// Enhanced image URL validation with balanced filtering
function validateAndFixImageUrl(imageUrl) {
  if (!imageUrl) return null;
  
  // Remove obvious non-product images
  if (imageUrl.startsWith('data:') || 
      imageUrl.includes('placeholder') || 
      imageUrl.includes('loading') ||
      imageUrl.includes('no-image')) {
    return null;
  }
  
  // Exclude common UI elements but be less restrictive
  const excludePatterns = [
    'stars.svg',
    'rating-star',
    'icons/',
    'sprite',
    'logo-',
    'button-'
  ];
  
  const shouldExclude = excludePatterns.some(pattern => 
    imageUrl.toLowerCase().includes(pattern)
  );
  
  if (shouldExclude) {
    return null;
  }
  
  // Accept if it has valid extension OR looks like a product image
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const hasValidExtension = validExtensions.some(ext => imageUrl.toLowerCase().includes(ext));
  
  const hasProductKeywords = imageUrl.includes('product') || 
                             imageUrl.includes('mobile') || 
                             imageUrl.includes('laptop') ||
                             imageUrl.includes('item') ||
                             imageUrl.includes('apple') ||
                             imageUrl.includes('iphone') ||
                             imageUrl.includes('samsung');
  
  // Accept CDN images or images with product keywords
  const isCDNImage = imageUrl.includes('static.') || 
                     imageUrl.includes('cdn.') ||
                     imageUrl.includes('images/');
  
  if (!hasValidExtension && !hasProductKeywords && !isCDNImage) {
    return null;
  }
  
  // Fix relative URLs
  if (imageUrl.startsWith('//')) {
    return 'https:' + imageUrl;
  } else if (imageUrl.startsWith('/')) {
    return 'https://www.daraz.pk' + imageUrl;
  } else if (!imageUrl.startsWith('http')) {
    return 'https://www.daraz.pk/' + imageUrl;
  }
  
  return imageUrl;
}

export default darazScraper;
