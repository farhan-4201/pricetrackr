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
    
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
    });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    try {
        const searchUrl = `https://priceoye.pk/search?q=${encodeURIComponent(query)}`;
        console.log(`📄 Loading search results...`);
        
        await page.goto(searchUrl, { 
            waitUntil: 'domcontentloaded', 
            timeout: 15000 
        });

        await page.waitForTimeout(3000);

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

// Main CLI Application
async function runCLI() {
    const rl = createInterface();
    
    console.log('\n🛒 PriceOye Product Scraper');
    console.log('============================\n');
    
    try {
        while (true) {
            // Get search query from user
            const query = await askQuestion(rl, '🔍 Enter product name to search (or "exit" to quit): ');
            
            if (query.toLowerCase() === 'exit' || query.toLowerCase() === 'quit') {
                console.log('\n👋 Goodbye!');
                break;
            }
            
            if (!query) {
                console.log('⚠️  Please enter a product name.\n');
                continue;
            }
            
            // Get number of products to show
            const maxProductsInput = await askQuestion(rl, '📊 How many products to show? (2-10, default: 5): ');
            const maxProducts = parseInt(maxProductsInput) || 5;
            
            if (maxProducts < 1 || maxProducts > 10) {
                console.log('⚠️  Number of products should be between 1-10. Using default (5).\n');
            }
            
            const finalMaxProducts = Math.min(Math.max(maxProducts, 1), 10);
            
            console.log('\n' + '='.repeat(50));
            
            // Scrape products
            const results = await scrapePriceOye(query, finalMaxProducts);
            
            console.log('\n' + '='.repeat(50));
            
            if (results.length > 0) {
                console.log(`\n✅ Found ${results.length} relevant products for "${query}":\n`);
                
                results.forEach((product, index) => {
                    console.log(`${index + 1}. 📱 ${product.title}`);
                    console.log(`   💰 Price: ${product.price}`);
                    console.log(`   🏪 Store: ${product.store}`);
                    if (product.link) {
                        console.log(`   🔗 Link: ${product.link}`);
                    }
                    console.log('');
                });
            } else {
                console.log(`\n❌ No relevant products found for "${query}"`);
                console.log('💡 Try different keywords or check spelling.\n');
            }
            
            console.log('─'.repeat(50) + '\n');
        }
    } catch (error) {
        console.error('❌ Application error:', error.message);
    } finally {
        rl.close();
    }
}

// Handle command line arguments or run CLI
if (process.argv.length > 2) {
    // Direct command line usage
    const query = process.argv[2];
    const maxProducts = parseInt(process.argv[3]) || 5;
    
    (async () => {
        const results = await scrapePriceOye(query, maxProducts);
        
        if (results.length > 0) {
            console.log(`\n✅ Found ${results.length} relevant products:\n`);
            results.forEach((product, index) => {
                console.log(`${index + 1}. ${product.title}`);
                console.log(`   Price: ${product.price}`);
                console.log(`   Store: ${product.store}`);
                if (product.link) console.log(`   Link: ${product.link}`);
                console.log('');
            });
        } else {
            console.log(`\n❌ No relevant products found for "${query}"`);
        }
    })();
} else {
    // Interactive CLI mode
    runCLI();
}