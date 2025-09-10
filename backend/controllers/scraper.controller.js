const { spawn } = require('child_process');
const path = require('path');

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
                        price: product.price || null,
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
}

module.exports = new ScraperController();