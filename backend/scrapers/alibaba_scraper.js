import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { promises as fs } from 'fs';
import readline from 'readline';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

puppeteer.use(StealthPlugin());

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Human-like delay functions
const humanDelay = (min = 1000, max = 3000) => {
    return new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));
};

const shortDelay = () => humanDelay(200, 800);
const mediumDelay = () => humanDelay(1000, 3000);
const longDelay = () => humanDelay(3000, 6000);

// Rotating User Agents
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0'
];

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

// MongoDB connection
let db = null;
let client = null;

const connectToDatabase = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found in environment variables. Please check your .env file.');
        }
        
        console.log('🔗 Connecting to MongoDB...');
        client = new MongoClient(mongoUri);
        await client.connect();
        
        const dbName = mongoUri.split('/').pop().split('?')[0] || 'price_tracker';
        db = client.db(dbName);
        
        console.log(`✅ Connected to MongoDB database: ${dbName}`);
        return db;
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error.message);
        throw error;
    }
};

const closeDatabase = async () => {
    if (client) {
        await client.close();
        console.log('🔐 MongoDB connection closed');
    }
};

// Function to save products to MongoDB
const saveToDatabase = async (products, searchQuery) => {
    try {
        const collection = db.collection('alibaba');
        
        const productsWithMetadata = products.map(product => ({
            ...product,
            searchQuery: searchQuery,
            scrapedAt: new Date(),
            source: 'alibaba.com'
        }));
        
        const result = await collection.insertMany(productsWithMetadata);
        console.log(`💾 Saved ${result.insertedCount} products to MongoDB collection 'alibaba'`);
        
        return result;
    } catch (error) {
        console.error('❌ Error saving to database:', error.message);
        throw error;
    }
};

// Function to calculate similarity between search query and product name
const calculateRelevanceScore = (searchQuery, productName) => {
    if (!productName || productName === "nil") return 0;
    
    const query = searchQuery.toLowerCase().trim();
    const product = productName.toLowerCase().trim();
    
    const queryWords = query.split(/\s+/).filter(word => 
        word.length > 2 && !['the', 'and', 'for', 'with'].includes(word)
    );
    const productWords = product.split(/\s+/);
    
    let score = 0;
    let exactMatches = 0;
    let partialMatches = 0;
    
    queryWords.forEach(queryWord => {
        if (productWords.some(productWord => productWord.includes(queryWord))) {
            exactMatches++;
            score += 10;
        }
    });
    
    queryWords.forEach(queryWord => {
        productWords.forEach(productWord => {
            if (productWord.includes(queryWord.substring(0, 3)) && queryWord.length > 3) {
                partialMatches++;
                score += 3;
            }
        });
    });
    
    if (product.includes(query)) {
        score += 20;
    }
    
    let orderBonus = 0;
    for (let i = 0; i < queryWords.length - 1; i++) {
        const currentWordIndex = product.indexOf(queryWords[i]);
        const nextWordIndex = product.indexOf(queryWords[i + 1]);
        if (currentWordIndex !== -1 && nextWordIndex !== -1 && currentWordIndex < nextWordIndex) {
            orderBonus += 5;
        }
    }
    score += orderBonus;
    
    const relevancePercentage = Math.min((score / (queryWords.length * 10)) * 100, 100);
    
    return {
        score: Math.round(relevancePercentage),
        exactMatches,
        partialMatches,
        details: `${exactMatches} exact matches, ${partialMatches} partial matches`
    };
};

// Enhanced human-like mouse movements
const humanMouseMove = async (page, x, y) => {
    const currentPos = await page.evaluate(() => ({ 
        x: window.mouseX || 0, 
        y: window.mouseY || 0 
    }));
    
    const steps = Math.floor(Math.random() * 10) + 15;
    const stepX = (x - currentPos.x) / steps;
    const stepY = (y - currentPos.y) / steps;
    
    for (let i = 0; i <= steps; i++) {
        const currentX = currentPos.x + (stepX * i) + (Math.random() * 3 - 1.5);
        const currentY = currentPos.y + (stepY * i) + (Math.random() * 3 - 1.5);
        
        await page.mouse.move(currentX, currentY);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 5));
    }
    
    await page.evaluate((x, y) => {
        window.mouseX = x;
        window.mouseY = y;
    }, x, y);
};

// Human-like scrolling behavior
const humanScroll = async (page) => {
    const scrollCount = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < scrollCount; i++) {
        const scrollAmount = Math.floor(Math.random() * 400) + 200;
        await page.evaluate((amount) => {
            window.scrollBy(0, amount);
        }, scrollAmount);
        
        await humanDelay(500, 1500);
    }
};

// Enhanced page load handler with human-like behavior
const handlePageLoad = async (page) => {
    console.log('🤖 Mimicking human browsing behavior...');
    
    // Initial page load delay
    await longDelay();
    
    // Simulate reading the page
    await humanScroll(page);
    await mediumDelay();
    
    // Handle potential popups with human-like interactions
    try {
        const acceptButton = await page.$('[data-spm-click*="accept"], .btn-accept, [class*="accept"], .cookie-accept');
        if (acceptButton) {
            console.log('📋 Handling cookie popup...');
            const buttonBox = await acceptButton.boundingBox();
            if (buttonBox) {
                await humanMouseMove(page, 
                    buttonBox.x + buttonBox.width / 2, 
                    buttonBox.y + buttonBox.height / 2
                );
                await shortDelay();
                await acceptButton.click();
                await mediumDelay();
            }
        }
    } catch (error) {
        // No popup found
    }
    
    // Handle login/signup modals
    try {
        const closeSelectors = [
            '.close', 
            '.modal-close', 
            '[aria-label="close"]',
            '.popup-close',
            '.dialog-close'
        ];
        
        for (const selector of closeSelectors) {
            const closeButton = await page.$(selector);
            if (closeButton) {
                console.log('❌ Closing modal popup...');
                const buttonBox = await closeButton.boundingBox();
                if (buttonBox) {
                    await humanMouseMove(page, 
                        buttonBox.x + buttonBox.width / 2, 
                        buttonBox.y + buttonBox.height / 2
                    );
                    await shortDelay();
                    await closeButton.click();
                    await mediumDelay();
                    break;
                }
            }
        }
    } catch (error) {
        // No modal found
    }
    
    // Simulate more human browsing
    await page.evaluate(() => {
        // Random small movements
        document.addEventListener('mousemove', (e) => {
            window.mouseX = e.clientX;
            window.mouseY = e.clientY;
        });
    });
    
    // Additional human-like delays and movements
    await humanScroll(page);
    await shortDelay();
};

// Enhanced stealth configuration
const createStealthyBrowser = async () => {
    const browser = await puppeteer.launch({
        headless: "new", // Use new headless mode for better stealth
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-dev-tools',
            '--disable-extensions',
            '--disable-default-apps',
            '--disable-translate',
            '--disable-device-discovery-notifications',
            '--disable-software-rasterizer',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-hang-monitor',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--enable-features=NetworkService',
            '--force-color-profile=srgb',
            '--metrics-recording-only',
            '--use-mock-keychain',
            '--disable-web-security',
            '--allow-running-insecure-content',
            '--disable-notifications',
            '--mute-audio',
            '--disable-component-extensions-with-background-pages',
            '--disable-background-networking',
            '--disable-breakpad',
            '--disable-component-update',
            '--disable-domain-reliability',
            '--disable-sync',
            '--lang=en-US',
            '--accept-lang=en-US,en;q=0.9'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
        slowMo: Math.random() * 50 + 10 // Random slowdown
    });
    
    return browser;
};

// Enhanced page setup with randomization
const setupPage = async (browser) => {
    const page = await browser.newPage();
    
    // Random viewport sizes
    const viewports = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1440, height: 900 },
        { width: 1536, height: 864 },
        { width: 1600, height: 900 }
    ];
    
    const viewport = viewports[Math.floor(Math.random() * viewports.length)];
    await page.setViewport(viewport);
    
    // Set random user agent
    const userAgent = getRandomUserAgent();
    await page.setUserAgent(userAgent);
    console.log(`🎭 Using User Agent: ${userAgent.split(' ')[0]}...`);
    
    // Enhanced stealth measures
    await page.evaluateOnNewDocument(() => {
        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        
        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5]
        });
        
        // Mock languages
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en']
        });
        
        // Mock hardware concurrency
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => 4 + Math.floor(Math.random() * 4)
        });
        
        // Mock memory
        Object.defineProperty(navigator, 'deviceMemory', {
            get: () => 8
        });
        
        // Override permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );
        
        // Mock chrome object
        window.chrome = {
            runtime: {},
            loadTimes: function() {},
            csi: function() {},
            app: {}
        };
        
        // Add some randomness to screen properties
        Object.defineProperty(screen, 'availHeight', {
            get: () => screen.height - Math.floor(Math.random() * 100)
        });
    });
    
    // Set extra headers
    await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
    });
    
    return page;
};

// Scrape only the first 5 most relevant products
const scrapeTopProducts = async (page, searchQuery, maxProducts = 5) => {
    try {
        console.log('🔍 Looking for products...');
        await mediumDelay();
        await page.waitForSelector('[data-spm*="product"], .product-item, .search-card, [class*="card"]', {timeout: 20000});
    } catch (error) {
        console.log("❌ No products found on this page");
        return [];
    }

    // Simulate human reading behavior
    await humanScroll(page);
    await shortDelay();

    const containerSelectors = [
        '.fy23-search-card',
        '.search-card',
        '.product-item',
        '[data-spm*="product"]',
        '.card'
    ];

    let productContainersSelector = '';
    for (const selector of containerSelectors) {
        const count = await page.evaluate((sel) => document.querySelectorAll(sel).length, selector);
        if (count > 0) {
            productContainersSelector = selector;
            console.log(`📦 Found ${count} products using selector: ${selector}`);
            break;
        }
    }

    if (!productContainersSelector) {
        console.log("❌ No product containers found. Page might have changed structure.");
        return [];
    }

    const productDataList = await page.evaluate(async (selector, nameSelectors, priceSelectors, linkSelectors, ratingSelectors, imageSelectors, companySelectors, searchQuery) => {
        const containers = Array.from(document.querySelectorAll(selector)).slice(0, 20);
        const products = [];

        const extractData = (container, selectors, attribute = null) => {
            for (const sel of selectors) {
                const elem = container.querySelector(sel);
                if (elem) {
                    if (attribute) {
                        return elem.getAttribute(attribute) || "nil";
                    } else {
                        return elem.textContent.trim() || "nil";
                    }
                }
            }
            return "nil";
        };

        const calculateRelevanceScore = (searchQuery, productName) => {
            if (!productName || productName === "nil") return 0;
            
            const query = searchQuery.toLowerCase().trim();
            const product = productName.toLowerCase().trim();
            
            const queryWords = query.split(/\s+/).filter(word => 
                word.length > 2 && !['the', 'and', 'for', 'with'].includes(word)
            );
            const productWords = product.split(/\s+/);
            
            let score = 0;
            let exactMatches = 0;
            let partialMatches = 0;
            
            queryWords.forEach(queryWord => {
                if (productWords.some(productWord => productWord.includes(queryWord))) {
                    exactMatches++;
                    score += 10;
                }
            });
            
            queryWords.forEach(queryWord => {
                productWords.forEach(productWord => {
                    if (productWord.includes(queryWord.substring(0, 3)) && queryWord.length > 3) {
                        partialMatches++;
                        score += 3;
                    }
                });
            });
            
            if (product.includes(query)) {
                score += 20;
            }
            
            let orderBonus = 0;
            for (let i = 0; i < queryWords.length - 1; i++) {
                const currentWordIndex = product.indexOf(queryWords[i]);
                const nextWordIndex = product.indexOf(queryWords[i + 1]);
                if (currentWordIndex !== -1 && nextWordIndex !== -1 && currentWordIndex < nextWordIndex) {
                    orderBonus += 5;
                }
            }
            score += orderBonus;
            
            const relevancePercentage = Math.min((score / (queryWords.length * 10)) * 100, 100);
            
            return {
                score: Math.round(relevancePercentage),
                exactMatches,
                partialMatches,
                details: `${exactMatches} exact matches, ${partialMatches} partial matches`
            };
        };

        for (const container of containers) {
            let name = extractData(container, nameSelectors);
            let price = extractData(container, priceSelectors);
            let productLink = extractData(container, linkSelectors, 'href');
            if (productLink !== "nil" && productLink.startsWith('/')) {
                productLink = 'https://www.alibaba.com' + productLink;
            }
            let rating = extractData(container, ratingSelectors);
            let imageLink = extractData(container, imageSelectors, 'src');
            let company = extractData(container, companySelectors);

            if (name !== 'nil' && productLink !== 'nil') {
                const relevance = calculateRelevanceScore(searchQuery, name);
                products.push({
                    productName: name,
                    price: price,
                    company: company,
                    rating: rating,
                    imageLink: imageLink,
                    productLink: productLink,
                    relevanceScore: relevance.score,
                    relevanceDetails: relevance.details
                });
            }
        }
        return products;
    }, productContainersSelector, [
        '.search-card-e-title a span',
        '.title a',
        '.product-title',
        'h3 a',
        'a[title] span'
    ], [
        '.search-card-e-price-main',
        '.price-main',
        '.price',
        '[data-spm*="price"]',
        '.cost'
    ], [
        '.search-card-e-title a',
        '.title a',
        '.product-title a',
        'h3 a',
        'a[href*="product"]'
    ], [
        '.search-card-e-review strong',
        '.rating strong',
        '.review-score',
        '.stars'
    ], [
        'a.search-card-e-slider__link img.search-card-e-slider__img',
        '.product-img img',
        'img[src*="jpg"], img[src*="png"]'
    ], [
        '.search-card-e-company',
        '.company-name',
        '.supplier'
    ], searchQuery);

    const sortedProducts = productDataList
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxProducts);

    console.log(`\n📊 Found ${productDataList.length} total products, showing top ${sortedProducts.length} most relevant:`);
    
    sortedProducts.forEach((product, index) => {
        console.log(`\n🏆 Rank ${index + 1} (${product.relevanceScore}% match):`);
        console.log(`📱 Product: ${product.productName}`);
        console.log(`💰 Price: ${product.price}`);
        console.log(`🏢 Company: ${product.company}`);
        console.log(`⭐ Rating: ${product.rating}`);
        console.log(`🔗 Link: ${product.productLink}`);
        console.log(`📈 Match Details: ${product.relevanceDetails}`);
    });

    return sortedProducts;
};

const main = async () => {
    const browser = await createStealthyBrowser();
    const page = await setupPage(browser);

    try {
        await connectToDatabase();
        
        const userInput = await question("Enter the specific product you want to search for (e.g., 'iPhone 14 Pro Max'): ");
        const maxPriceInput = await question("Enter the maximum price you want to filter by (or press Enter to skip): ");

        const searchQuery = encodeURIComponent(userInput);
        let url = `https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&CatId=&SearchText=${searchQuery}`;
        
        if (maxPriceInput) {
            url += `&priceto=${maxPriceInput}`;
        }

        console.log(`\n🔍 Searching for: "${userInput}"`);
        console.log("🌐 Loading the search page...");
        
        // Navigate with human-like behavior
        await page.goto(url, {waitUntil: 'networkidle2'});

        await handlePageLoad(page);

        // Additional human-like interactions
        await humanScroll(page);
        await mediumDelay();

        const topProducts = await scrapeTopProducts(page, userInput, 5);

        if (topProducts.length > 0) {
            await saveToDatabase(topProducts, userInput);
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `alibaba_results_${timestamp}.json`;
            
            const results = {
                searchQuery: userInput,
                timestamp: new Date().toISOString(),
                totalResults: topProducts.length,
                products: topProducts
            };
            
            await fs.writeFile(filename, JSON.stringify(results, null, 2), "utf-8");
            console.log(`\n✅ Successfully found ${topProducts.length} most relevant products for "${userInput}"`);
            console.log(`💾 Results saved to MongoDB collection 'alibaba' and file ${filename}`);
            
            console.log(`\n📋 SUMMARY - Top matches for "${userInput}":`);
            topProducts.forEach((product, index) => {
                console.log(`${index + 1}. ${product.productName} (${product.relevanceScore}% match) - ${product.price}`);
            });
            
        } else {
            console.log(`\n❌ No relevant products found for "${userInput}". Try a different search term.`);
        }

    } catch (error) {
        console.error("❌ An error occurred:", error);
    } finally {
        await browser.close();
        await closeDatabase();
        rl.close();
    }
};

main().catch(console.error);