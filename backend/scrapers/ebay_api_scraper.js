import axios from "axios";

async function ebayScraper(query) {
  try {
    const appId = process.env.EBAY_APP_ID;
    const oauthToken = process.env.EBAY_OAUTH_TOKEN;

    if (!appId || appId === 'your-ebay-app-id') {
      console.log("eBay App ID not configured");
      return { success: false, products: [] };
    }

    const url = 'https://svcs.ebay.com/services/search/FindingService/v1';

    const params = {
      'OPERATION-NAME': 'findItemsByKeywords',
      'SERVICE-VERSION': '1.0.0',
      'SECURITY-APPNAME': appId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      'keywords': query,
      'paginationInput.entriesPerPage': '20',
      'sortOrder': 'BestMatch',
      'GLOBAL-ID': 'EBAY-US', // You can change this to EBAY-GB, EBAY-DE, etc. based on region
      'itemFilter(0).name': 'Condition',
      'itemFilter(0).value': 'New', // Focus on new items
      'itemFilter(1).name': 'ListingType',
      'itemFilter(1).value': 'FixedPrice' // Fixed price items
    };

    console.log(`Attempting to search eBay API for: ${query}`);

    // Prepare headers - Finding API uses App ID authentication, not OAuth
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    console.log("Using App ID authentication");

    const response = await axios.get(url, {
      params,
      timeout: 15000,
      headers
    });

    console.log("eBay API Response received, parsing...");

    if (!response.data || !response.data.findItemsByKeywordsResponse) {
      console.log("Invalid response format from eBay API");
      return { success: false, products: [] };
    }

    const searchResult = response.data.findItemsByKeywordsResponse[0];

    if (!searchResult.searchResult || !searchResult.searchResult[0] ||
        !searchResult.searchResult[0].item || !Array.isArray(searchResult.searchResult[0].item)) {
      console.log("No items found in eBay API response");
      return { success: true, products: [] };
    }

    const items = searchResult.searchResult[0].item;
    console.log(`Found ${items.length} raw items from eBay`);

    const products = items
      .filter(item => item.title && item.sellingStatus && item.sellingStatus[0].currentPrice)
      .map((item) => {
        const relevanceScore = calculateRelevance(item.title[0], query);

        if (relevanceScore === 0) {
          return null; // Exclude irrelevant items
        }

        // Extract price (convert to PKR approximately - you may want to use a currency converter API)
        const priceUSD = parseFloat(item.sellingStatus[0].currentPrice[0].__value__);
        const pricePKR = Math.round(priceUSD * 278); // Approximate USD to PKR conversion

        // Extract image URL
        let imageUrl = null;
        if (item.galleryURL && item.galleryURL[0]) {
          imageUrl = item.galleryURL[0];
        }

        // Extract product URL
        let productUrl = null;
        if (item.viewItemURL && item.viewItemURL[0]) {
          productUrl = item.viewItemURL[0];
        }

        // Extract rating (if available)
        let rating = null;
        if (item.sellerInfo && item.sellerInfo[0] && item.sellerInfo[0].positiveFeedbackPercent) {
          rating = parseFloat(item.sellerInfo[0].positiveFeedbackPercent[0]) / 20; // Convert to 5-star scale
        }

        return {
          name: item.title[0],
          price: pricePKR,
          marketplace: "ebay",
          imageUrl: imageUrl,
          url: productUrl,
          rating: rating,
          company: extractCompany(item.title[0]),
          relevanceScore
        };
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort by relevance

    console.log(`Successfully parsed and filtered ${products.length} valid products from eBay`);
    return { success: true, products: products.slice(0, 10) }; // Limit to top 10

  } catch (error) {
    console.error("eBay API Scraper Error:", error.message);

    if (error.response) {
      console.error(`eBay API Error: ${error.response.status} - ${error.response.statusText}`);
      if (error.response.data) {
        console.error("Error details:", error.response.data);
      }
    } else if (error.code === 'ENOTFOUND') {
      console.error("DNS resolution failed - check internet connection");
    } else if (error.code === 'ETIMEDOUT') {
      console.error("Request timed out - try again or check network speed");
    }

    return { success: false, products: [] };
  }
}

// Helper function to calculate relevance score
function calculateRelevance(productName, query) {
  if (!productName || !query) return 0;

  const productLower = productName.toLowerCase();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 1);

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

  // If searching for main product (e.g., "iPhone 15 Pro Max"), exclude accessories
  const isMainProductSearch = queryWords.some(word =>
    ['iphone', 'samsung', 'galaxy', 'pixel', 'oneplus', 'xiaomi', 'oppo', 'vivo',
     'realme', 'huawei', 'nokia', 'motorola', 'laptop', 'macbook', 'tablet', 'ipad',
     'watch', 'airpods', 'buds'].includes(word.toLowerCase())
  );

  if (isMainProductSearch && isAccessory) {
    console.log(`Excluding accessory: "${productName}"`);
    return 0;
  }

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
    // Also check for singular/plural forms simply by removing 's'
    const singularWord = word.endsWith("s") ? word.slice(0, -1) : null;

    if (
      productLower.includes(word) ||
      (singularWord && productLower.includes(singularWord))
    ) {
      matchedWords++;
      // Bonus for exact word matches
      const wordRegex = new RegExp(`\\b${word}\\b`, "i");
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

export default ebayScraper;
