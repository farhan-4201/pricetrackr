import axios from "axios";

export async function scrapeDarazAPI(query) {
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
      return [];
    }

    if (!data?.mods?.listItems || !Array.isArray(data.mods.listItems)) {
      console.log("Invalid response format from Daraz API");
      console.log("Response keys:", Object.keys(data));
      return [];
    }

    console.log(`Found ${data.mods.listItems.length} raw products`);

    const products = data.mods.listItems
      .filter(item => item.name && item.priceShow) // Filter out invalid items
      .map((item) => ({
        productId: item.productId,
        title: item.name,
        price: item.priceShow,
        link: item.productUrl ? `https:${item.productUrl}` : null,
        image: item.image,
        rating: item.ratingScore || null,
      }));

    console.log(`Successfully parsed ${products.length} valid products`);
    return products;
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

    return [];
  }
}
