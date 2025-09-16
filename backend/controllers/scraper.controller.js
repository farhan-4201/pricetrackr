import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrapeAlibabaProducts } from '../scrapers/alibaba_scraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        return new Promise((resolve, reject) => {
            const scraperPath = path.join(__dirname, '../scrapers/daraz_scraper.py');
            console.log('Executing scraper:', scraperPath);

            const pythonProcess = spawn('python', [scraperPath, query]);
            let dataString = '';
            let errorString = '';

            pythonProcess.stdout.on('data', (data) => {
                dataString += data.toString();
                console.log('Raw scraper output:', data.toString());
            });

            pythonProcess.stderr.on('data', (data) => {
                errorString += data.toString();
                console.error('Scraper error:', data.toString());
            });

            pythonProcess.on('close', (code) => {
                console.log('Scraper process exited with code:', code);

                if (code !== 0) {
                    return reject(new Error(`Scraper failed with error: ${errorString}`));
                }

                try {
                    const rawResults = JSON.parse(dataString);
                    // Handle the new format where it's a single product object
                    if (rawResults.error) {
                        return reject(new Error(rawResults.message || rawResults.error));
                    }

                    // Convert to array format
                    const product = {
                        name: rawResults.name || '',
                        price: parsePrice(rawResults.currentPrice),
                        url: rawResults.url || '',
                        imageUrl: rawResults.imageUrl || null,
                        marketplace: 'Daraz'
                    };

                    resolve({ products: [product] });
                } catch (error) {
                    console.error('Failed to parse scraper output:', error, 'Raw data:', dataString);
                    reject(new Error('Failed to parse scraper output'));
                }
            });
        });
    }

    async scrapeAlibaba(query) {
        try {
            const results = await scrapeAlibabaProducts(query);
            const formattedProducts = results.products.map(product => ({
                name: product.name || product['Product Name'] || '',
                price: parsePrice(product.price || product['Price']),
                url: product.url || product['Product Link'] || '',
                imageUrl: product.imageUrl || product['Image Link'] || null,
                marketplace: 'Alibaba',
                company: product.company || product['Company'] || null,
                rating: product.rating || product['Rating'] || null,
                moq: product.moq || product['MOQ'] || null
            }));
            return { products: formattedProducts };
        } catch (error) {
            console.error('Alibaba scraping failed:', error);
            throw error;
        }
    }

    async scrapeAll(query) {
        const [daraz, alibaba] = await Promise.allSettled([
            this.scrapeDaraz(query),
            this.scrapeAlibaba(query)
        ]);

        const allProducts = [];
        if (daraz.status === 'fulfilled') {
            allProducts.push(...daraz.value.products);
        } else {
            console.error('Daraz scraping failed:', daraz.reason);
        }

        if (alibaba.status === 'fulfilled') {
            allProducts.push(...alibaba.value.products);
        } else {
            console.error('Alibaba scraping failed:', alibaba.reason);
        }

        return { products: allProducts, total: allProducts.length };
    }
}

const scraperController = new ScraperController();

export default scraperController;
