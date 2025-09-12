const { spawn } = require('child_process');
const path = require('path');
const { scrapeAlibaba: scrapeAlibabaFunc } = require('../scrapers/alibaba_scraper');

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
                    // Ensure we always return an array of products
                    const products = Array.isArray(rawResults) ? rawResults : [rawResults];

                    // Format each product
                    const formattedProducts = products.map(product => ({
                        name: product.name || '',
                        price: parsePrice(product.currentPrice),
                        url: product.url || '',
                        imageUrl: product.imageUrl || null,
                        marketplace: 'Daraz'
                    }));

                    resolve({ products: formattedProducts });
                } catch (error) {
                    console.error('Failed to parse scraper output:', error, 'Raw data:', dataString);
                    reject(new Error('Failed to parse scraper output'));
                }
            });
        });
    }

    async scrapeAlibaba(query) {
        const rawResults = await scrapeAlibabaFunc(query);
        const formattedProducts = rawResults.map(product => ({
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
    }
}

const scrapeProducts = async (req, res) => {
    const { query } = req.body;
    
    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        // Set timeout for each scraper
        const timeout = 15000; // 15 seconds
        
        // Run scrapers with timeout
        const results = await Promise.allSettled([
            Promise.race([
                scrapeAlibaba(query),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Alibaba timeout')), timeout)
                )
            ]),
            Promise.race([
                scrapeDaraz(query),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Daraz timeout')), timeout)
                )
            ])
        ]);

        // Process results
        const products = results.reduce((acc, result) => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                acc.push(...result.value);
            }
            return acc;
        }, []);

        // Return whatever results we have
        return res.json({ 
            products,
            total: products.length,
            status: 'success'
        });

    } catch (error) {
        console.error('Scraping error:', error);
        return res.status(500).json({ 
            error: 'Scraping failed',
            message: error.message,
            status: 'error'
        });
    }
};

module.exports = new ScraperController();
