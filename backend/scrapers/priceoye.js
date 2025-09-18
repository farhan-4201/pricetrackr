// priceoye-scraper.js
import { chromium } from 'playwright';
import readline from 'readline';

// CLI Interface for user input
function createInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

function askQuestion(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

// Filter products based on relevance to user query
function isProductRelevant(product, searchQuery) {
    const queryWords = searchQuery.toLowerCase().split(' ').filter(word => word.length > 2);
    const productTitle = product.title.toLowerCase();
    
    // Check if product title contains at least one significant word from query
    const hasRelevantWord = queryWords.some(word => productTitle.includes(word));
    
    // Exclude obviously irrelevant products
    const excludePatterns = [
        'accessories only', 'case only', 'cover only', 'charger only',
        'cable only', 'adapter only', 'stand only', 'mount only'
    ];
    
    const isExcluded = excludePatterns.some(pattern => 
        productTitle.includes(pattern) && !searchQuery.toLowerCase().includes(pattern.split(' ')[0])
    );
    
    return hasRelevantWord && !isExcluded && product.price !== 'N/A' && product.title !== 'N/A';
}

async function scrapePriceOye(query, maxProducts = 5) {
    console.log(`🔍 Searching PriceOye for: "${query}"`);
    console.log('⏳ Opening browser...\n');

    let browser;
    try {
        browser = await chromium.launch({
            headless: true,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-web-security',
                '--allow-running-insecure-content',
                '--disable-features=VizDisplayCompositor',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ignoreHTTPSErrors: true,
            viewport: { width: 1280, height: 720 }
        });

        const page = await context.newPage();

        // Set additional headers
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        });

        const searchUrl = `https://priceoye.pk/search?q=${encodeURIComponent(query)}`;
        console.log(`📄 Loading search results from: ${searchUrl}`);

        // Try navigation with retry logic
        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
            try {
                const response = await page.goto(searchUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 20000
                });

                if (!response) {
                    throw new Error('No response received');
                }

                console.log(`✅ Page loaded with status: ${response.status()}`);

                // Check if we got a valid page
                if (response.status() >= 400) {
                    throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
                }

                break; // Success, exit retry loop

            } catch (error) {
                retryCount++;
                console.log(`❌ Navigation attempt ${retryCount} failed: ${error.message}`);

                if (retryCount <= maxRetries) {
                    console.log(`🔄 Retrying in 3 seconds...`);
                    await page.waitForTimeout(3000);
                } else {
                    throw new Error(`Failed to load page after ${maxRetries + 1} attempts: ${error.message}`);
                }
            }
        }

        // Enhanced wait for content to load
        console.log('⏳ Waiting for page content to load...');
        await page.waitForTimeout(5000);

        // Enhanced product selectors
        const productSelectors = [
            '.product-card',
            '.product-item',
            '.product',
            '[class*="product-"]',
            '.card',
            '.item',
            'article',
            '[data-testid*="product"]'
        ];

        let allProducts = [];
        
        for (const selector of productSelectors) {
            try {
                const elements = await page.$$(selector);
                if (elements.length > 0) {
                    console.log(`✅ Found ${elements.length} items with selector: ${selector}`);
                    
                    allProducts = await page.$$eval(selector, (cards) => {
                        return cards.map(card => {
                            // Enhanced title extraction
                            const titleSelectors = [
                                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                                '.title', '.name', '.product-title', '.product-name',
                                '[class*="title"]', '[class*="name"]',
                                'a[title]', '[data-title]'
                            ];
                            
                            let title = null;
                            for (const sel of titleSelectors) {
                                const titleEl = card.querySelector(sel);
                                if (titleEl) {
                                    title = (titleEl.getAttribute('title') || 
                                            titleEl.getAttribute('data-title') || 
                                            titleEl.innerText || 
                                            titleEl.textContent || '').trim();
                                    if (title && title.length > 5) break;
                                }
                            }
                            
                            // Enhanced price extraction
                            const priceSelectors = [
                                '.price', '.cost', '.amount', '.rate',
                                '[class*="price"]', '[class*="cost"]', '[class*="amount"]'
                            ];
                            
                            let price = null;
                            for (const sel of priceSelectors) {
                                const priceEls = card.querySelectorAll(sel);
                                for (const priceEl of priceEls) {
                                    const priceText = priceEl.innerText || priceEl.textContent || '';
                                    if (priceText.includes('Rs') || priceText.includes('PKR') || /\d{1,3}(,\d{3})*/.test(priceText)) {
                                        price = priceText.trim();
                                        break;
                                    }
                                }
                                if (price) break;
                            }
                            
                            // Get product link
                            const linkEl = card.querySelector('a');
                            const link = linkEl ? (linkEl.href.startsWith('http') ? linkEl.href : 
                                                  'https://priceoye.pk' + linkEl.href) : null;
                            
                            // Get store/seller info
                            const storeSelectors = ['.store', '.shop', '.seller', '.vendor', '[class*="store"]', '[class*="shop"]'];
                            let store = null;
                            for (const sel of storeSelectors) {
                                const storeEl = card.querySelector(sel);
                                if (storeEl && storeEl.innerText.trim()) {
                                    store = storeEl.innerText.trim();
                                    break;
                                }
                            }
                            
                            return {
                                title: title || 'Unknown Product',
                                price: price || 'Price not found',
                                link: link,
                                store: store || 'PriceOye'
                            };
                        });
                    });
                    
                    break; // Found products, stop trying other selectors
                }
            } catch (e) {
                continue;
            }
        }

        await browser.close();
        
        // Filter for relevant products only
        console.log(`🔍 Filtering relevant products...`);
        const relevantProducts = allProducts.filter(product => isProductRelevant(product, query));
        
        console.log(`📊 Found ${allProducts.length} total items, ${relevantProducts.length} relevant products`);
        
        return relevantProducts.slice(0, maxProducts);
        
    } catch (error) {
        console.error('❌ Scraping error:', error.message);
        await browser.close();
        return [];
    }
}

// Export the scraping function for programmatic use
export { scrapePriceOye };
