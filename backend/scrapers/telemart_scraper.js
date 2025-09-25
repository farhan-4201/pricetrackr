// Using built-in fetch (Node.js 18+)

// Using built-in fetch (Node.js 18+)

async function searchTelemart(query) {
  const url = "https://2fm1qovagb-dsn.algolia.net/1/indexes/*/queries";

  const headers = {
    "x-algolia-application-id": "2FM1QOVAGB",
    "x-algolia-api-key": "26a36df3159aaedcb93de21c509d17fc",
    "Content-Type": "application/json"
  };

  const body = {
    requests: [
      {
        indexName: "products",
        params: `query=${encodeURIComponent(query)}&hitsPerPage=20`
      }
    ]
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  const data = await res.json();
  const hits = data.results?.[0]?.hits || [];

  return hits.map(item => ({
    name: item.title || item.name || null,
    price: item.sale_price || item.discounted_price || item.price || null,
    brand: item.brand || null,
    url: item.slug ? `https://telemart.pk/${item.slug}` : null,
    image: item.mainImageLink || item.placeholder_link || null
  }));
}

// Test
searchTelemart("iphone 14 pro max")
  .then(console.log)
  .catch(console.error);



// Helper function to calculate relevance score
function calculateRelevance(productName, query) {
  if (!productName || !query) return 0;

  const productLower = productName.toLowerCase();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 1);

  let score = 0;
  let matchedWords = 0;

  // Detect accessory keywords that should be penalized for specific model queries
  const accessoryKeywords = ['case', 'cover', 'screen protector', 'tempered glass', 'charger', 'cable', 'adapter', 'stand', 'holder', 'ring light', 'selfie', 'tripod', 'bluetooth', 'wireless', 'ipad', 'watch', 'airpod', 'bud', 'earphone', 'headphone', 'speaker', 'power bank', 'backpack', 'skin'];

  // Check if product is likely an accessory
  const isAccessory = accessoryKeywords.some(keyword =>
    productLower.includes(keyword) && !queryLower.includes(keyword)
  );

  // Penalize accessories heavily unless the query specifically asks for them
  let accessoryPenalty = 0;
  if (isAccessory) {
    accessoryPenalty = 10; // Heavy penalty for accessories when searching for phones
  }

  // Prioritize model numbers - stricter checking for queries with numbers
  const queryNumbers = query.match(/\d+/g) || [];
  const productNumbers = productName.match(/\d+/g) || [];

  if (queryNumbers.length > 0) {
    const allNumbersMatch = queryNumbers.every(num => productNumbers.includes(num));
    if (allNumbersMatch) {
      score += 5; // Strong bonus for matching all model numbers
      // For specific model queries, be more lenient with word matching
    } else {
      // If numbers are present but don't match, it's likely irrelevant
      // But allow partial matches for accessories if they contain the main product identifier
      const mainNumbersMatch = queryNumbers.length >= 2 ?
        queryNumbers.slice(0, Math.ceil(queryNumbers.length / 2)).every(num => productNumbers.includes(num)) :
        false;
      if (!mainNumbersMatch) {
        return 0;
      } else {
        score += 1; // Partial bonus for accessories
      }
    }
  }

  // Check for word matches with improved logic
  for (const word of queryWords) {
    if (productLower.includes(word)) {
      matchedWords++;
      // Bonus for exact word matches (including partial matches at word boundaries)
      const wordRegex = new RegExp(`\\b${word}\\w*`, 'i');
      if (wordRegex.test(productName)) {
        score += 2;
      } else {
        score += 1;
      }
    }
  }

  // Apply accessory penalty
  score -= accessoryPenalty;

  // Adjust threshold based on query complexity
  let requiredMatchRatio;
  if (queryNumbers.length > 0) {
    // For specific model queries, require most words OR key brand terms
    requiredMatchRatio = queryWords.length > 3 ? 0.75 : 0.6;
    // Special handling for brand + model queries
    if (productLower.includes('iphone') || productLower.includes('samsung') ||
        productLower.includes('galaxy') || productLower.includes('macbook') ||
        productLower.includes('dell') || productLower.includes('hp')) {
      if (matchedWords / queryWords.length >= 0.5) {
        score += 2; // Boost brand matches
      }
    }
  } else {
    // For general queries, stricter requirement
    requiredMatchRatio = 0.7;
  }

  // Reject if score is too low or insufficient word match
  if (score <= accessoryPenalty || (queryWords.length > 0 && matchedWords / queryWords.length < requiredMatchRatio)) {
    return 0; // Reject low-relevance matches
  }

  // Ensure positive score for valid matches
  return Math.max(1, score);
}

// Helper function to extract company name from product title
function extractCompany(productName) {
  if (!productName) return null;

  // Common brand patterns - you can expand this list
  const brandPatterns = [
    /^(Apple|iPhone|iPad|MacBook)/i,
    /^(Samsung|Galaxy)/i,
    /^(HP|Dell|Lenovo|Acer|Asus|MSI|Razer)/i,
    /^(Sony|LG|TCL|Haier|Hisense)/i,
    /^(Xiaomi|Huawei|OnePlus|Oppo|Vivo|Realme)/i,
    /^(Canon|Nikon|Fujifilm|GoPro|DJI)/i,
    /^(Microsoft|Surface)/i,
    /^(Google|Pixel)/i,
    /^(Xiaomi|Huawei|OnePlus|Oppo|Vivo|Realme|Infinix|Tecno)/i,
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

// Main scraper function that matches the API format used by controller
async function telemartScraper(query) {
  try {
    console.log(`Attempting to scrape Telemart for: ${query}`);

    const items = await searchTelemart(query);

    console.log(`Found ${items.length} raw products from Telemart`);

    // Check if we got any items
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log("No products received from Telemart API");
      return { success: false, products: [] };
    }

    // Transform items to match the expected product format
    const products = items
      .filter(item => item.name && item.price)
      .map((item) => {
        const relevanceScore = calculateRelevance(item.name, query);

        if (relevanceScore === 0) {
          return null; // Exclude irrelevant items
        }

        return {
          name: item.name,
          price: item.price, // Already cleaned by the API
          marketplace: "telemart",
          imageUrl: item.image,
          url: item.url,
          rating: null, // Telemart API doesn't provide rating
          company: item.brand || extractCompany(item.name),
          relevanceScore
        };
      })
      .filter(Boolean) // Remove null entries
      .filter((product, index, array) => {
        // Deduplication: remove products with very similar names (85% similarity threshold)
        const isDuplicate = array.slice(0, index).some(existing => {
          const existingName = existing.name.toLowerCase().replace(/[^\w\s]/g, '');
          const currentName = product.name.toLowerCase().replace(/[^\w\s]/g, '');

          // Calculate simple similarity score (common words ratio)
          const existingWords = new Set(existingName.split(/\s+/));
          const currentWords = new Set(currentName.split(/\s+/));

          const intersection = new Set([...existingWords].filter(x => currentWords.has(x)));
          const union = new Set([...existingWords, ...currentWords]);
          const similarity = intersection.size / union.size;

          return similarity > 0.85; // If 85% or more words are the same, consider duplicate
        });

        if (isDuplicate) {
          console.log(`Removed duplicate: "${product.name}"`);
          return false;
        }
        return true;
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort by relevance

    console.log(`Successfully parsed and filtered ${products.length} valid products from Telemart`);
    return { success: true, products: products };
  } catch (error) {
    console.error("Telemart API Scraper Error:", error.message);
    return { success: false, products: [] };
  }
}

export default telemartScraper;
