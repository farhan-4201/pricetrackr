import { scrapeDarazAPI } from '../scrapers/daraz_api_scraper.js';
import { scrapePriceOye } from '../scrapers/priceoye.js';

// Helper function to parse price strings
function parsePrice(priceStr) {
    if (!priceStr || typeof priceStr !== 'string') return null;

    // Clean the price string
    const cleanPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '');

    // Try to extract number
    const match = cleanPrice.match(/(\d+(?:\.\d{2})?)/);
    if (match) {
        return parseFloat(match[1]);
    }

    return null;
}

class ScraperController {
    async scrapeDaraz(query) {
        try {
            console.log('Starting Daraz scraping for query:', query);
            const darazProducts = await scrapeDarazAPI(query);

            const formattedProducts = darazProducts.map(product => ({
                name: product.title || '',
                price: parsePrice(product.priceShow),
                url: product.link || '',
                imageUrl: product.image || null,
                marketplace: 'Daraz'
            }));

            console.log(`Daraz scraping completed. Found ${formattedProducts.length} products`);
            return { products: formattedProducts };
        } catch (error) {
            console.error('Daraz scraping failed:', error);
            throw error;
        }
    }

    async scrapePriceOye(query) {
        try {
            console.log('Starting PriceOye scraping for query:', query);
            const priceoyeProducts = await scrapePriceOye(query, 10); // Get up to 10 products

            const formattedProducts = priceoyeProducts.map(product => ({
                name: product.title || '',
                price: parsePrice(product.price),
                url: product.link || '',
                imageUrl: null, // PriceOye scraper doesn't extract images
                marketplace: 'PriceOye'
            }));

            console.log(`PriceOye scraping completed. Found ${formattedProducts.length} products`);
            return { products: formattedProducts };
        } catch (error) {
            console.error('PriceOye scraping failed:', error);
            throw error;
        }
    }

    async scrapeAll(query) {
        console.log('Starting concurrent scraping for both Daraz and PriceOye...');

        // Scrape both platforms concurrently using Promise.allSettled for fault tolerance
        const [darazResult, priceoyeResult] = await Promise.allSettled([
            this.scrapeDaraz(query),
            this.scrapePriceOye(query)
        ]);

        const allProducts = [];

        // Handle Daraz results
        if (darazResult.status === 'fulfilled') {
            allProducts.push(...darazResult.value.products);
            console.log(`✅ Daraz: ${darazResult.value.products.length} products collected`);
        } else {
            console.error('❌ Daraz scraping failed:', darazResult.reason?.message || darazResult.reason);
        }

        // Handle PriceOye results
        if (priceoyeResult.status === 'fulfilled') {
            allProducts.push(...priceoyeResult.value.products);
            console.log(`✅ PriceOye: ${priceoyeResult.value.products.length} products collected`);
        } else {
            console.error('❌ PriceOye scraping failed:', priceoyeResult.reason?.message || priceoyeResult.reason);
        }

        console.log(`📊 Total products collected: ${allProducts.length}`);
        return { products: allProducts, total: allProducts.length };
    }
}

const scraperController = new ScraperController();

export default scraperController;
