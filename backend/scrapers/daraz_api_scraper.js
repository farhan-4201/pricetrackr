import axios from "axios";

export async function scrapeDarazAPI(query) {
  try {
    const url = `https://www.daraz.pk/catalog/?_keyori=ss&ajax=true&q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
    });

    // Check response shape
    if (!data?.mods?.listItems) {
      console.log("No products found in response");
      return [];
    }

    const products = data.mods.listItems.map((item) => ({
      productId: item.productId,
      title: item.name,
      price: item.priceShow,
      link: `https:${item.productUrl}`,
      image: item.image,
      rating: item.ratingScore || null,
    }));

    return products;
  } catch (error) {
    console.error("Daraz API Scraper Error:", error.message);
    return [];
  }
}
