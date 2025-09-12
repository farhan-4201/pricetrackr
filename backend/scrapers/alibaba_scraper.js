import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
const { Options } = chrome;
import mongoose from 'mongoose';
import readline from 'readline';
import { promises as fs } from 'fs';
import winston from 'winston';

// Configure logging
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'scraper_errors.log', level: 'error' }),
        new winston.transports.File({ filename: 'scraper.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// MongoDB Schema
const ProductSchema = new mongoose.Schema({
    searchQuery: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    price: { type: String, required: true },
    company: { type: String, default: 'N/A' },
    moq: { type: String, default: 'N/A' },
    rating: { type: String, default: 'N/A' },
    imageUrl: { type: String, default: 'N/A' },
    productUrl: { type: String, required: true },
    source: { type: String, required: true },
    scrapedAt: { type: Date, default: Date.now },
    responseTime: { type: Number }, // in milliseconds
    pageQualityScore: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Add indexes for better query performance
ProductSchema.index({ searchQuery: 1, scrapedAt: -1 });
ProductSchema.index({ source: 1, scrapedAt: -1 });

const Product = mongoose.model('Product', ProductSchema);

class AdvancedProductScraper {
    constructor() {
        this.TIMEOUT_LIMIT = 7000; // 7 seconds strict limit
        this.RETRY_ATTEMPTS = 2;
        this.MIN_PRODUCTS = 3;
        this.MAX_PRODUCTS = 15;
        this.QUALITY_THRESHOLD = 0.7;
        
        this.SUPPORTED_SITES = {
            alibaba: {
                baseUrl: 'https://www.alibaba.com/trade/search',
                selectors: {
                    productContainer: '.fy23-search-card',
                    fallbackContainer: '.organic-offer-wrapper',
                    title: '.search-card-e-title a span',
                    price: '.search-card-e-price-main',
                    company: '.search-card-e-company',
                    rating: '.search-card-e-review strong',
                    image: 'a.search-card-e-slider__link img.search-card-e-slider__img',
                    link: '.search-card-e-title a',
                    moq: '.search-card-m-sale-features__item'
                }
            }
        };
        
        this.rejectedPages = [];
        this.performanceMetrics = {
            totalScrapes: 0,
            successfulScrapes: 0,
            averageResponseTime: 0,
            cacheHits: 0
        };
    }

    async connectToMongoDB(uri = 'mongodb://localhost:27017/scraping_db') {
        try {
            await mongoose.connect(uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            logger.info('Connected to MongoDB successfully');
            return true;
        } catch (error) {
            logger.error('MongoDB connection failed:', error);
            return false;
        }
    }

    async createOptimizedDriver() {
        const options = new Options();
        
        // Performance optimizations
        options.addArguments(
            '--headless=new',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images', // Skip images for faster loading
            '--disable-javascript', // Disable JS if not needed
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '--window-size=1920,1080',
            '--memory-pressure-off',
            '--max_old_space_size=4096'
        );

        // Additional performance settings
        options.setUserPreferences({
            'profile.default_content_setting_values.notifications': 2,
            'profile.default_content_settings.popups': 0,
            'profile.managed_default_content_settings.images': 2
        });

        const driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        // Set aggressive timeouts
        await driver.manage().setTimeouts({
            implicit: 2000,
            pageLoad: this.TIMEOUT_LIMIT - 1000,
            script: 3000
        });

        return driver;
    }

    async validatePageQuality(driver, products) {
        let qualityScore = 0;
        const startTime = Date.now();

        try {
            // Check if page loaded completely
            const loadTime = Date.now() - startTime;
            if (loadTime > this.TIMEOUT_LIMIT) {
                logger.warn(`Page load exceeded timeout: ${loadTime}ms`);
                return 0;
            }

            // Product count check
            const productCount = products.length;
            if (productCount < this.MIN_PRODUCTS) {
                logger.warn(`Insufficient products found: ${productCount}`);
                return 0.2;
            }

            // Data quality check
            let validProducts = 0;
            for (const product of products) {
                if (this.isValidProduct(product)) {
                    validProducts++;
                }
            }

            const dataQuality = validProducts / productCount;
            qualityScore = Math.min(1, (dataQuality * 0.6) + (productCount >= 5 ? 0.4 : 0.2));

            // Check for anti-bot detection
            const bodyText = await driver.findElement(By.tagName('body')).getText();
            const suspiciousPatterns = ['captcha', 'robot', 'blocked', 'access denied'];
            const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
                bodyText.toLowerCase().includes(pattern)
            );

            if (hasSuspiciousContent) {
                logger.warn('Potential bot detection detected');
                qualityScore *= 0.3;
            }

            logger.info(`Page quality score: ${qualityScore.toFixed(2)}`);
            return qualityScore;

        } catch (error) {
            logger.error('Quality validation failed:', error);
            return 0;
        }
    }

    isValidProduct(product) {
        const requiredFields = ['productName', 'price', 'productUrl'];
        return requiredFields.every(field => 
            product[field] && 
            product[field] !== 'nil' && 
            product[field].trim() !== '' &&
            !product[field].includes('undefined')
        ) && 
        product.price.match(/[\d.,]+/) && // Has numeric price
        product.productUrl.startsWith('http'); // Valid URL
    }

    async extractData(container, selector, attribute = null) {
        try {
            const element = await container.findElement(By.css(selector));
            const data = attribute ? await element.getAttribute(attribute) : await element.getText();
            return data?.trim() || 'nil';
        } catch {
            return 'nil';
        }
    }

    async scrapeAlibaba(query, maxPrice = '', filters = []) {
        let driver;
        const startTime = Date.now();
        const site = this.SUPPORTED_SITES.alibaba;

        try {
            driver = await this.createOptimizedDriver();
            
            // Build URL with parameters
            const searchQuery = encodeURIComponent(query);
            const priceParam = maxPrice ? `&pricet=${maxPrice}` : '';
            const url = `${site.baseUrl}?fsb=y&mergeResult=true&ta=y&tab=all&searchText=${searchQuery}${priceParam}`;
            
            logger.info(`Scraping: ${url}`);
            
            // Navigate with timeout protection
            const navigationPromise = driver.get(url);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Navigation timeout')), this.TIMEOUT_LIMIT - 1000)
            );
            
            await Promise.race([navigationPromise, timeoutPromise]);

            // Wait for products with timeout
            const remainingTime = this.TIMEOUT_LIMIT - (Date.now() - startTime);
            if (remainingTime < 1000) {
                throw new Error('Insufficient time remaining for scraping');
            }

            await driver.wait(
                until.elementsLocated(By.css(site.selectors.productContainer)),
                Math.min(remainingTime, 3000)
            );

            // Extract products
            const products = await this.extractAlibabaProducts(driver, query, site.selectors);
            
            // Validate page quality
            const qualityScore = await this.validatePageQuality(driver, products);
            if (qualityScore < this.QUALITY_THRESHOLD) {
                this.rejectedPages.push({
                    url,
                    reason: 'Low quality score',
                    score: qualityScore,
                    productCount: products.length,
                    timestamp: new Date()
                });
                throw new Error(`Page rejected: Quality score ${qualityScore} below threshold ${this.QUALITY_THRESHOLD}`);
            }

            const responseTime = Date.now() - startTime;
            logger.info(`Scraping completed successfully in ${responseTime}ms with ${products.length} products`);

            // Add metadata to products
            products.forEach(product => {
                product.responseTime = responseTime;
                product.pageQualityScore = qualityScore;
            });

            return products;

        } catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error(`Scraping failed after ${responseTime}ms:`, error.message);
            throw error;
        } finally {
            if (driver) {
                try {
                    await driver.quit();
                } catch (quitError) {
                    logger.error('Driver quit error:', quitError);
                }
            }
        }
    }

    async extractAlibabaProducts(driver, searchQuery, selectors) {
        const products = [];
        
        try {
            const containers = await driver.findElements(By.css(selectors.productContainer));
            logger.info(`Found ${containers.length} product containers`);

            // Limit processing to avoid timeout
            const maxContainers = Math.min(containers.length, this.MAX_PRODUCTS);
            
            for (let i = 0; i < maxContainers; i++) {
                try {
                    const container = containers[i];
                    
                    const product = {
                        searchQuery: searchQuery,
                        productName: await this.extractData(container, selectors.title),
                        price: await this.extractData(container, selectors.price),
                        company: await this.extractData(container, selectors.company),
                        moq: await this.extractData(container, selectors.moq),
                        rating: await this.extractData(container, selectors.rating),
                        imageUrl: await this.extractData(container, selectors.image, 'src'),
                        productUrl: await this.extractData(container, selectors.link, 'href'),
                        source: 'alibaba'
                    };

                    // Clean and validate product data
                    if (this.isValidProduct(product)) {
                        // Clean URL if relative
                        if (product.productUrl && !product.productUrl.startsWith('http')) {
                            product.productUrl = 'https://www.alibaba.com' + product.productUrl;
                        }
                        
                        products.push(product);
                        logger.debug(`Extracted product: ${product.productName}`);
                    } else {
                        logger.debug(`Skipped invalid product at index ${i}`);
                    }

                } catch (error) {
                    logger.warn(`Failed to extract product ${i}:`, error.message);
                }
            }

        } catch (error) {
            logger.error('Product extraction failed:', error);
            throw error;
        }

        return products;
    }

    async scrapeWithRetry(query, maxPrice = '', filters = []) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
            try {
                logger.info(`Scraping attempt ${attempt}/${this.RETRY_ATTEMPTS} for query: "${query}"`);
                
                const products = await this.scrapeAlibaba(query, maxPrice, filters);
                
                this.performanceMetrics.totalScrapes++;
                this.performanceMetrics.successfulScrapes++;
                
                return products;
                
            } catch (error) {
                lastError = error;
                logger.warn(`Attempt ${attempt} failed: ${error.message}`);
                
                if (attempt < this.RETRY_ATTEMPTS) {
                    const delay = Math.min(1000 * attempt, 3000);
                    logger.info(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        this.performanceMetrics.totalScrapes++;
        throw lastError || new Error('All retry attempts failed');
    }

    async saveToMongoDB(products) {
        try {
            if (!products || products.length === 0) {
                logger.warn('No products to save to MongoDB');
                return 0;
            }

            const result = await Product.insertMany(products, { 
                ordered: false, // Continue on duplicate key errors
                lean: true 
            });
            
            logger.info(`Successfully saved ${result.length} products to MongoDB`);
            return result.length;
            
        } catch (error) {
            if (error.code === 11000) {
                // Handle duplicate key errors
                const savedCount = products.length - (error.writeErrors?.length || 0);
                logger.info(`Saved ${savedCount} products (${error.writeErrors?.length || 0} duplicates skipped)`);
                return savedCount;
            }
            
            logger.error('MongoDB save failed:', error);
            throw error;
        }
    }

    async getCachedResults(query, maxAgeHours = 1) {
        try {
            const cutoff = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
            const results = await Product.find({
                searchQuery: new RegExp(query, 'i'),
                scrapedAt: { $gte: cutoff }
            })
            .sort({ scrapedAt: -1, pageQualityScore: -1 })
            .limit(this.MAX_PRODUCTS)
            .lean();

            if (results.length > 0) {
                this.performanceMetrics.cacheHits++;
                logger.info(`Found ${results.length} cached results for "${query}"`);
            }

            return results;
        } catch (error) {
            logger.error('Cache lookup failed:', error);
            return [];
        }
    }

    async exportResults(products, format = 'json') {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `scraped_products_${timestamp}`;

            if (format === 'json') {
                const filepath = `${filename}.json`;
                await fs.writeFile(filepath, JSON.stringify(products, null, 2), 'utf-8');
                logger.info(`Results exported to ${filepath}`);
                return filepath;
            }
            
            // Add CSV export if needed
            
        } catch (error) {
            logger.error('Export failed:', error);
            throw error;
        }
    }

    getPerformanceReport() {
        const { totalScrapes, successfulScrapes, cacheHits } = this.performanceMetrics;
        const successRate = totalScrapes > 0 ? (successfulScrapes / totalScrapes * 100).toFixed(1) : 0;
        
        return {
            totalScrapes,
            successfulScrapes,
            successRate: `${successRate}%`,
            cacheHits,
            rejectedPages: this.rejectedPages.length,
            rejectedPageDetails: this.rejectedPages
        };
    }

    async cleanup() {
        try {
            await mongoose.connection.close();
            logger.info('Cleanup completed');
        } catch (error) {
            logger.error('Cleanup error:', error);
        }
    }
}

// CLI Interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    const scraper = new AdvancedProductScraper();
    
    try {
        // Connect to MongoDB
        const mongoConnected = await scraper.connectToMongoDB();
        if (!mongoConnected) {
            console.log('Warning: MongoDB connection failed. Results will not be saved.');
        }

        console.log('\n🚀 Advanced Product Scraper v2.0');
        console.log('⚡ Optimized for 5-7 second response times');
        console.log('🔍 Intelligent page filtering and quality validation');
        console.log('💾 MongoDB integration with caching\n');

        while (true) {
            try {
                const query = await question('Enter product search query (or "exit" to quit): ');
                if (query.toLowerCase() === 'exit') break;

                if (!query.trim()) {
                    console.log('Please enter a valid search query.\n');
                    continue;
                }

                const useCache = (await question('Use cached results if available? (y/n): ')).toLowerCase() === 'y';
                const maxPrice = await question('Maximum price (USD, optional): ');

                console.log('\n⏳ Scraping started...\n');
                const startTime = Date.now();

                let products = [];

                // Check cache first
                if (useCache && mongoConnected) {
                    products = await scraper.getCachedResults(query.trim());
                    if (products.length > 0) {
                        console.log(`✅ Found ${products.length} cached results`);
                    }
                }

                // Scrape if no cache results
                if (products.length === 0) {
                    products = await scraper.scrapeWithRetry(
                        query.trim(), 
                        maxPrice.trim(),
                        []
                    );
                    
                    // Save to MongoDB
                    if (mongoConnected && products.length > 0) {
                        await scraper.saveToMongoDB(products);
                    }
                }

                const totalTime = Date.now() - startTime;
                
                console.log(`\n✅ Scraping completed in ${totalTime}ms`);
                console.log(`📦 Found ${products.length} products\n`);

                // Display results
                products.forEach((product, index) => {
                    console.log(`--- Product ${index + 1} ---`);
                    console.log(`Name: ${product.productName}`);
                    console.log(`Price: ${product.price}`);
                    console.log(`Company: ${product.company}`);
                    console.log(`Rating: ${product.rating}`);
                    console.log(`URL: ${product.productUrl}`);
                    console.log('');
                });

                // Export option
                const shouldExport = (await question('Export results to file? (y/n): ')).toLowerCase() === 'y';
                if (shouldExport) {
                    const filename = await scraper.exportResults(products);
                    console.log(`📁 Results exported to ${filename}`);
                }

                console.log('\n' + '='.repeat(50) + '\n');

            } catch (error) {
                console.error(`❌ Error: ${error.message}\n`);
                logger.error('Scraping error:', error);
            }
        }

        // Show performance report
        console.log('\n📊 Performance Report:');
        console.log(JSON.stringify(scraper.getPerformanceReport(), null, 2));

    } catch (error) {
        console.error('Fatal error:', error);
        logger.error('Fatal error:', error);
    } finally {
        await scraper.cleanup();
        rl.close();
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n\n⚠️  Shutting down gracefully...');
    rl.close();
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the scraper
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export default AdvancedProductScraper;