#!/usr/bin/env python3
"""
Pure Playwright AliExpress Scraper
Browser-only scraper with product loading detection to avoid captcha
Uses sync_playwright as requested
"""

import json
import random
import urllib.parse
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from playwright.sync_api import sync_playwright
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('aliexpress_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ProductData:
    """Data structure for AliExpress product information"""
    product_id: str
    title: str
    price: Dict[str, Any]
    images: List[str]
    rating: float
    reviews_count: int
    seller_info: Dict[str, Any]
    shipping_info: Dict[str, Any]
    variations: List[Dict[str, Any]]
    description: str
    url: str
    scraped_at: datetime

class PureBrowserScraper:
    """Pure Playwright Browser Scraper - Only browser-based scraping"""

    def __init__(self):
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        ]

    def scrape_products(self, query: str, max_pages: int = 1) -> List[Dict[str, Any]]:
        """Scrape products using pure Playwright with specific selectors"""
        logger.info(f"Starting pure Playwright scrape for: '{query}'")

        all_products = []

        with sync_playwright() as p:
            # Launch browser with captcha avoidance settings
            browser_context = self._setup_browser_context(p)
            page = browser_context.new_page()

            try:
                for page_num in range(1, max_pages + 1):
                    products = self._scrape_page_products(page, query, page_num)
                    all_products.extend(products)
                    logger.info(f"Found {len(products)} products on page {page_num}")

                # Exit early if we have more than 20 products
                if len(all_products) >= 20:
                    break

            finally:
                page.close()
                browser_context.close()

        logger.info(f"Total products scraped: {len(all_products)}")
        return all_products

    def _setup_browser_context(self, playwright_instance):
        """Setup browser context with anti-detection measures"""
        browser = playwright_instance.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent=random.choice(self.user_agents),
            extra_http_headers={
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Upgrade-Insecure-Requests': '1',
            }
        )

        # Add anti-detection scripts
        context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => false});
            Object.defineProperty(navigator, 'plugins', {
                get: () => [
                    {name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer'},
                    {name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai'},
                    {name: 'Native Client Executable', filename: 'internal-nacl-plugin'},
                ]
            });
        """)

        return context

    def _scrape_page_products(self, page, query: str, page_num: int) -> List[Dict[str, Any]]:
        """Scrape products from a single page"""
        products = []

        try:
            # Build search URL
            url = f"https://www.aliexpress.us/wholesale?SearchText={urllib.parse.quote(query)}"
            if page_num > 1:
                url += f"&page={page_num}"

            logger.info(f"Loading URL: {url}")

            # Navigate to page
            page.goto(url, timeout=30000)

            # Wait for product grid to load (as per user specification)
            page.wait_for_selector("div.list--gallery--34TropR", timeout=15000)

            # Find all product items in the grid
            product_elements = page.query_selector_all("div.list--gallery--34TropR div.list-item")

            logger.info(f"Found {len(product_elements)} product elements")

            for prod_element in product_elements:
                try:
                    product_data = self._extract_product_from_element(prod_element)
                    if product_data:
                        products.append(product_data)
                except Exception as e:
                    logger.debug(f"Error extracting product: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error scraping page {page_num}: {e}")

        return products

    def _extract_product_from_element(self, element) -> Optional[Dict[str, Any]]:
        """Extract product data from a product element"""
        try:
            # Extract title (exactly as user specified)
            title = ""
            for selector in ["h1, h2, .title"]:
                title_elem = element.query_selector(selector)
                if title_elem:
                    title = title_elem.inner_text().strip()
                    break

            if not title:
                return None

            # Extract product URL to get product ID
            url = ""
            link_elem = element.query_selector("a[href*='/item/']")
            if link_elem:
                url = link_elem.get_attribute("href")
                if not url.startswith("http"):
                    url = "https://www.aliexpress.us" + url

            # Extract product ID from URL
            product_id = ""
            if url:
                import re
                match = re.search(r'/item/(\d+)\.html', url)
                if match:
                    product_id = match.group(1)

            # Create product data structure
            product = {
                'product_id': product_id,
                'title': title,
                'price': self._extract_price(element),
                'images': self._extract_images(element),
                'rating': self._extract_rating(element),
                'reviews_count': self._extract_reviews(element),
                'seller_info': self._extract_seller(element),
                'shipping_info': {},
                'variations': [],
                'description': '',
                'url': url,
                'scraped_at': datetime.now()
            }

            return product

        except Exception as e:
            logger.debug(f"Error extracting product data: {e}")
            return None

    def _extract_price(self, element) -> Dict[str, Any]:
        """Extract price from product element"""
        try:
            # Look for price in various formats
            price_elem = element.query_selector(".notranslate") or \
                        element.query_selector("[class*='price']") or \
                        element.query_selector(".item-price")

            if price_elem:
                price_text = price_elem.inner_text().strip()
                # Extract numeric price
                import re
                price_match = re.search(r'[\$£€]?(\d+(?:\.\d{2})?)', price_text.replace(',', ''))
                if price_match:
                    price_value = float(price_match.group(1))
                    return {
                        'min_price': price_value,
                        'max_price': price_value,
                        'currency': 'USD',
                        'formatted': price_text
                    }
        except Exception:
            pass

        return {}

    def _extract_images(self, element) -> List[str]:
        """Extract images from product element"""
        images = []
        try:
            img_elements = element.query_selector_all("img")
            for img in img_elements:
                img_src = img.get_attribute("src") or img.get_attribute("data-src")
                if img_src and not img_src.endswith(('.ico', '.svg')):
                    if img_src.startswith('//'):
                        img_src = 'https:' + img_src
                    elif img_src.startswith('/'):
                        img_src = 'https://www.aliexpress.us' + img_src
                    images.append(img_src)

        except Exception:
            pass

        return images[:3]  # Limit to 3 images

    def _extract_rating(self, element) -> float:
        """Extract rating from product element"""
        try:
            rating_elem = element.query_selector("[class*='rate']") or \
                         element.query_selector(".feedback-rating") or \
                         element.query_selector(".rate[title*='star']")

            if rating_elem:
                rating_text = rating_elem.inner_text().strip()
                import re
                rating_match = re.search(r'(\d+(?:\.\d)?)', rating_text)
                if rating_match:
                    rating = float(rating_match.group(1))
                    if 0 <= rating <= 5:
                        return rating
        except Exception:
            pass

        return 0.0

    def _extract_reviews(self, element) -> int:
        """Extract review count from product element"""
        try:
            review_elem = element.query_selector("[class*='review']") or \
                         element.query_selector(".feedback-count") or \
                         element.query_selector("[title*='review']")

            if review_elem:
                review_text = review_elem.inner_text().strip()
                import re
                # Handle numbers like 1.2k, 500, etc.
                if 'k' in review_text.lower():
                    rev_match = re.search(r'(\d+(?:\.\d)?)k', review_text.lower())
                    if rev_match:
                        return int(float(rev_match.group(1)) * 1000)
                else:
                    rev_match = re.search(r'(\d+(?:,\d{3})*)', review_text.replace(',', ''))
                    if rev_match:
                        return int(rev_match.group(1))
        except Exception:
            pass

        return 0

    def _extract_seller(self, element) -> Dict[str, Any]:
        """Extract seller information from product element"""
        try:
            seller_elem = element.query_selector('[class*="store"]') or \
                         element.query_selector('[class*="seller"]') or \
                         element.query_selector('a[href*="/store/"]')

            if seller_elem:
                seller_name = seller_elem.inner_text().strip()
                seller_url = seller_elem.get_attribute("href")
                if seller_url and not seller_url.startswith("http"):
                    seller_url = "https://www.aliexpress.us" + seller_url

                return {
                    'store_name': seller_name,
                    'store_url': seller_url,
                    'store_id': ''
                }
        except Exception:
            pass

        return {}


# Main execution
if __name__ == "__main__":
    # Simple CLI example
    scraper = PureBrowserScraper()

    # Example usage as per user's request
    query = input("Enter search query: ") or "iphone 14 pro max"

    print("Scraping products with pure Playwright...")
    products = scraper.scrape_products(query, max_pages=1)

    print(f"\nScraped {len(products)} products:")

    for i, product in enumerate(products[:5], 1):  # Show first 5 products
        print(f"\nProduct {i}:")
        print(f"Title: {product['title']}")
        print(f"Price: {product.get('price', {}).get('formatted', 'N/A')}")
        print(f"URL: {product.get('url', 'N/A')}")
        print(f"Rating: {product.get('rating', 'N/A')}")
        print(f"Reviews: {product.get('reviews_count', 'N/A')}")

    print("\nScraping completed!")

class EnhancedPlaywrightBrowserManager:
    """Enhanced Playwright browser with improved product loading detection"""

    def __init__(self):
        self.browser = None
        self.context = None
        self.logger = logging.getLogger(__name__ + '.EnhancedPlaywrightBrowserManager')

    async def setup_browser(self, headless: bool = True, proxy: Optional[Dict] = None) -> BrowserContext:
        """Setup browser with enhanced configuration"""
        playwright = await async_playwright().start()

        # Choose random browser type for better detection avoidance
        browser_type = random.choice([playwright.chromium, playwright.firefox])

        launch_options = {
            'headless': headless,
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        }

        if proxy:
            launch_options['proxy'] = proxy

        self.browser = await browser_type.launch(**launch_options)

        # Enhanced context with more realistic settings
        context_options = {
            'user_agent': UserAgentRotator().get_random_agent(),
            'viewport': {'width': random.randint(1200, 1920), 'height': random.randint(900, 1080)},
            'locale': 'en-US',
            'timezone_id': 'America/New_York',
            'permissions': ['geolocation'],
            'geolocation': {'latitude': 40.7128, 'longitude': -74.0060},
            'color_scheme': 'light',
            'reduced_motion': 'no-preference',
            'forced_colors': 'none',
            'device_scale_factor': 1,
            'is_mobile': False,
            'has_touch': False,
            'extra_http_headers': {
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            }
        }

        self.context = await self.browser.new_context(**context_options)

        # Enhanced anti-detection script
        await self.context.add_init_script("""
            // Override multiple navigator properties
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );

            Object.defineProperty(navigator, 'webdriver', {get: () => false});
            Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
            Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
            Object.defineProperty(navigator, 'platform', {get: () => 'Win32'});

            // Hide automation indicators
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_JSON;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Object;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Proxy;
        """)

        # Add additional anti-detection scripts
        await self.context.add_init_script("""
            // Mock hardware and system properties
            Object.defineProperty(navigator, 'hardwareConcurrency', {get: () => 8});
            Object.defineProperty(navigator, 'deviceMemory', {get: () => 8});
            Object.defineProperty(navigator, 'maxTouchPoints', {get: () => 0});

            // Mock WebGL properties to look like real hardware
            try {
                const getParameter = WebGLRenderingContext.prototype.getParameter;
                WebGLRenderingContext.prototype.getParameter = function(parameter) {
                    if (parameter === 37445) return 'Intel Inc.';
                    if (parameter === 37446) return 'Intel(R) Iris(TM) Graphics 6100';
                    if (parameter === 7937) return 'WebKit';
                    if (parameter === 7938) return 'WebKit WebGL';
                    return getParameter(parameter);
                };
            } catch(e) { console.log('WebGL mocking failed', e); }

            // Mock screen properties
            Object.defineProperty(screen, 'availHeight', {get: () => 1040});
            Object.defineProperty(screen, 'availWidth', {get: () => 1920});
            Object.defineProperty(screen, 'colorDepth', {get: () => 24});
            Object.defineProperty(screen, 'pixelDepth', {get: () => 24});
        """)

        self.logger.info("Enhanced browser setup completed successfully")
        return self.context

    async def get_page_with_product_loading_detection(self, url: str) -> Optional[str]:
        """Get page content with comprehensive product loading detection"""
        if not self.context:
            await self.setup_browser()

        page = await self.context.new_page()

        try:
            # Set enhanced headers
            await page.set_extra_http_headers({
                'Referer': 'https://www.google.com/search?q=aliexpress+shopping',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Purpose': 'prefetch'
            })

            # Navigate with enhanced options
            await page.goto(url, timeout=45000)

            # Comprehensive product loading detection
            products_loaded = await self._wait_for_products_comprehensive(page, url)

            if not products_loaded:
                self.logger.warning("Product loading detection timed out, proceeding with available content")

            # Enhanced human behavior simulation
            await self._simulate_enhanced_human_behavior(page)

            # Wait for any remaining dynamic content
            await asyncio.sleep(random.uniform(4, 6))

            # Get page content
            content = await page.content()

            self.logger.info(f"Successfully loaded page with enhanced product detection: {url}")
            return content

        except Exception as e:
            self.logger.error(f"Error loading page with product detection: {e}")
            return None
        finally:
            await page.close()

    async def _wait_for_products_comprehensive(self, page: Page, url: str) -> bool:
        """Comprehensive product loading detection with multiple strategies"""
        max_wait = 40  # seconds

        try:
            # Strategy 1: Wait for DOM content and basic structure
            await page.wait_for_load_state('domcontentloaded')

            # Strategy 2: Multiple product detection patterns
            product_detection_strategies = [
                # Generic product selectors
                {'selector': '[data-product-id], [data-product-info]', 'description': 'product data attributes'},
                {'selector': '.product-item, .product-card, .product-list-item', 'description': 'product containers'},
                {'selector': '[class*="product"]:not(:empty)', 'description': 'product-related elements'},
                {'selector': '[data-spm*="product"], [data-spm*="item"]', 'description': 'Aliexpress tracking data'},

                # Aliexpress specific selectors
                {'selector': '.JIIxO, .product-container', 'description': 'Aliexpress product grid'},
                {'selector': '.search-item-card, .product-item-v2', 'description': 'Search result items'},
                {'selector': '[class^="product-"]:not(select)', 'description': 'Product-specific classes'},
            ]

            for strategy in product_detection_strategies:
                try:
                    # Wait for selector with timeout
                    await page.wait_for_selector(strategy['selector'], timeout=max_wait * 1000)
                    self.logger.info(f"Products detected using strategy: {strategy['description']}")

                    # Additional validation - check if we actually have meaningful content
                    product_count = await page.evaluate("""
                        (selector) => {
                            const elements = document.querySelectorAll(selector);
                            let visibleCount = 0;
                            elements.forEach(el => {
                                const rect = el.getBoundingClientRect();
                                if (rect.width > 0 && rect.height > 0) {
                                    visibleCount++;
                                }
                            });
                            return visibleCount;
                        }
                    """, strategy['selector'])

                    if product_count > 3:  # Require at least 3 visible products
                        self.logger.info(f"Found {product_count} visible products using strategy: {strategy['description']}")
                        return True

                except Exception as e:
                    self.logger.debug(f"Strategy '{strategy['description']}' failed: {e}")
                    continue

            # Strategy 3: Network-based detection (fall back to networkidle if selector-based failed)
            try:
                await page.wait_for_load_state('networkidle', timeout=15000)
                self.logger.info("Fell back to network idle detection")
                return True
            except:
                pass

            # Strategy 4: Time-based fallback (scroll and see if content loads)
            self.logger.info("Attempting scroll-based product loading detection")
            await self._scroll_to_load_more_products(page)

            # Final check for any product-related content
            final_check_js = """
                () => {
                    const selectors = [
                        '[data-product-id]',
                        '.product-item:not(:empty)',
                        '[class*="product"]:not(:empty)',
                        '.JIIxO .product',
                        '[pid]'
                    ];

                    for (const sel of selectors) {
                        const elements = document.querySelectorAll(sel);
                        if (elements.length > 0) {
                            return {found: true, count: elements.length, selector: sel};
                        }
                    }
                    return {found: false, count: 0, selector: null};
                }
            """

            final_result = await page.evaluate(final_check_js)
            if final_result['found']:
                self.logger.info(f"Final validation found {final_result['count']} products using selector: {final_result['selector']}")
                return True

        except Exception as e:
            self.logger.error(f"Comprehensive product detection failed: {e}")

        return False

    async def _scroll_to_load_more_products(self, page: Page):
        """Scroll the page to trigger lazy loading of products"""
        try:
            # Get initial page height
            initial_height = await page.evaluate("document.body.scrollHeight")

            # Perform multiple scroll actions
            for i in range(5):
                # Scroll down
                await page.evaluate(f"window.scrollTo(0, {(i+1) * 800})")

                # Wait for potential loading
                await asyncio.sleep(random.uniform(1, 2))

                # Check if page height increased (indicating content loaded)
                current_height = await page.evaluate("document.body.scrollHeight")
                if current_height > initial_height + 100:
                    self.logger.info(f"Page height increased from {initial_height} to {current_height}, content loaded")
                    initial_height = current_height

                # Simulate human-like pausing
                await asyncio.sleep(random.uniform(0.5, 1.5))

            # Final upward scroll (human behavior)
            await page.evaluate("window.scrollTo(0, 200)")
            await asyncio.sleep(0.5)

        except Exception as e:
            self.logger.debug(f"Scroll-based loading failed: {e}")

    async def _simulate_enhanced_human_behavior(self, page: Page):
        """Enhanced human behavior simulation with product interaction"""
        try:
            # Random initial delay
            await asyncio.sleep(random.uniform(1, 3))

            # Scroll with varying speeds
            scroll_steps = random.randint(3, 8)
            for i in range(scroll_steps):
                scroll_distance = random.randint(200, 600)
                await page.evaluate(f"window.scrollTo(0, {scroll_distance * (i+1)})")
                await asyncio.sleep(random.uniform(0.3, 0.8))

            # Look for and hover over product elements (without clicking)
            product_selectors = [
                '[data-product-id]',
                '.product-item:not(:empty)',
                '.product-card:not(:empty)',
                '.JIIxO [class*="product"]'
            ]

            for selector in product_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    if elements and len(elements) > 0:
                        # Pick a few random elements to hover
                        sample_size = min(3, len(elements))
                        sample_elements = random.sample(elements, sample_size)

                        for element in sample_elements:
                            try:
                                # Check if element is visible
                                is_visible = await element.evaluate("""
                                    (el) => {
                                        const rect = el.getBoundingClientRect();
                                        return rect.width > 0 && rect.height > 0 && rect.top >= 0;
                                    }
                                """)

                                if is_visible:
                                    # Scroll element into view
                                    await element.scroll_into_view_if_needed()
                                    await asyncio.sleep(random.uniform(0.1, 0.3))

                                    # Hover over the element
                                    await element.hover()
                                    await asyncio.sleep(random.uniform(0.5, 1.5))

                                    # Small mouse movement to simulate interest
                                    await page.mouse.move(random.randint(-10, 10), random.randint(-10, 10))
                                    await asyncio.sleep(random.uniform(0.2, 0.5))

                            except Exception as e:
                                self.logger.debug(f"Element interaction failed: {e}")
                                continue

                        break  # If we found and interacted with elements from one selector, stop

                except Exception as e:
                    self.logger.debug(f"Product interaction failed for selector {selector}: {e}")
                    continue

            # Simulate reading time
            await asyncio.sleep(random.uniform(2, 4))

            # Final random scroll
            await page.evaluate("window.scrollTo(0, 0)")
            await asyncio.sleep(0.5)

        except Exception as e:
            self.logger.debug(f"Enhanced human behavior simulation failed: {e}")

    async def close(self):
        """Close browser and cleanup"""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        self.logger.info("Browser closed successfully")

class StreamlinedAliExpressScraper:
    """Streamlined AliExpress scraper using JSON API and enhanced Playwright"""

    def __init__(self, mongodb_connection: str = "mongodb://localhost:27017/",
                 database_name: str = "aliexpress_data", use_browser: bool = True):
        self.json_api = AliExpressJSONAPI()
        self.browser_manager = EnhancedPlaywrightBrowserManager() if use_browser else None
        self.user_agent_rotator = UserAgentRotator()

        # MongoDB setup
        self.mongodb_client = MongoClient(mongodb_connection)
        self.db = self.mongodb_client[database_name]
        self.products_collection: Collection = self.db.products
        self.search_history_collection: Collection = self.db.search_history

        # Create indexes
        self.products_collection.create_index("product_id", unique=True)
        self.products_collection.create_index("scraped_at")
        self.search_history_collection.create_index("query")
        self.search_history_collection.create_index("timestamp")

        logger.info("Streamlined AliExpress Scraper initialized successfully")

    async def search_products(self, query: str, max_pages: int = 3, method: str = "api") -> List[Dict[str, Any]]:
        """Search for products using API-first approach with Playwright fallback"""
        logger.info(f"Starting streamlined search for: '{query}' using method: {method}")

        all_products = []

        # Method 1: JSON API (primary method)
        if method in ["api", "all"]:
            logger.info("Trying enhanced JSON API method...")
            api_products = await self._search_with_api(query, max_pages)
            all_products.extend(api_products)

        # Method 2: Playwright browser (fallback for when API fails)
        if method in ["browser", "all"] and len(all_products) < 5:
            logger.info("Trying Playwright browser method...")
            browser_products = await self._search_with_playwright_browser(query, max_pages)
            all_products.extend(browser_products)

        # Remove duplicates based on product_id
        unique_products = {}
        for product in all_products:
            product_id = product.get('product_id')
            if product_id:
                unique_products[product_id] = product

        final_products = list(unique_products.values())
        logger.info(f"Total unique products found: {len(final_products)}")

        # Save search history
        self._save_search_history(query, len(final_products), method)

        return final_products

    async def _search_with_api(self, query: str, max_pages: int) -> List[Dict[str, Any]]:
        """Search using enhanced JSON API"""
        products = []
        connector = aiohttp.TCPConnector(limit=15, ssl=self.json_api.ssl_context)

        async with aiohttp.ClientSession(connector=connector) as session:
            for page in range(1, max_pages + 1):
                try:
                    logger.info(f"API Search - Page {page}")
                    data = await self.json_api.search_products_enhanced(session, query, page)

                    if data:
                        page_products = self._extract_products_from_api_response(data, query)
                        products.extend(page_products)
                        logger.info(f"API found {len(page_products)} products on page {page}")
                    else:
                        logger.warning(f"No data returned from API for page {page}")

                    # Simulate human delay
                    await asyncio.sleep(random.uniform(1.5, 3.5))

                except Exception as e:
                    logger.error(f"API search error on page {page}: {e}")
                    await asyncio.sleep(random.uniform(2.0, 4.0))  # Longer delay after error
                    continue

        return products

    async def _search_with_playwright_browser(self, query: str, max_pages: int) -> List[Dict[str, Any]]:
        """Search using Playwright browser with enhanced product detection"""
        products = []

        if not self.browser_manager:
            logger.warning("Browser manager not available")
            return products

        try:
            for page in range(1, min(max_pages, 2) + 1):  # Limit browser to 2 pages for efficiency
                try:
                    url = self._build_search_url(query, page)
                    logger.info(f"Browser Search - Page {page}: {url}")

                    html = await self.browser_manager.get_page_with_product_loading_detection(url)

                    if html:
                        page_products = self._extract_products_from_html_raw(html, query)
                        products.extend(page_products)
                        logger.info(f"Browser found {len(page_products)} products on page {page}")

                    await asyncio.sleep(random.uniform(4.0, 7.0))  # Longer delays for browser

                except Exception as e:
                    logger.error(f"Browser search error on page {page}: {e}")
                    continue

        except Exception as e:
            logger.error(f"Browser search failed: {e}")
        finally:
            try:
                await self.browser_manager.close()
            except:
                pass

        return products

    def _build_search_url(self, query: str, page: int = 1) -> str:
        """Build AliExpress search URL"""
        base_url = 'https://www.aliexpress.com'
        params = {
            'SearchText': query,
            'page': page,
            'sortType': 'default',
            'shipToCountry': 'US',
            'initiate': 'search',
            'g': 'y'
        }
        return f"{base_url}/wholesale?{urllib.parse.urlencode(params)}"

    def _extract_products_from_api_response(self, data: Dict, query: str) -> List[Dict[str, Any]]:
        """Extract products from API response using enhanced parsing"""
        products = []

        try:
            # Handle different API response structures
            product_containers = []

            # Structure 1: Direct product list
            if 'products' in data and isinstance(data['products'], list):
                product_containers = data['products']

            # Structure 2: Items array
            elif 'items' in data and isinstance(data['items'], list):
                product_containers = data['items']

            # Structure 3: Results
            elif 'results' in data and isinstance(data['results'], list):
                product_containers = data['results']

            # Structure 4: Data wrapper
            elif 'data' in data:
                data_obj = data['data']
                if isinstance(data_obj, list):
                    product_containers = data_obj
                elif isinstance(data_obj, dict):
                    # Look for various possible arrays
                    for key in ['products', 'items', 'results', 'productList']:
                        if key in data_obj and isinstance(data_obj[key], list):
                            product_containers = data_obj[key]
                            break

            # Process found products
            for item in product_containers[:60]:  # Limit per page
                if isinstance(item, dict):
                    product = self._parse_api_product(item)
                    if product:
                        products.append(product)

        except Exception as e:
            logger.error(f"Error extracting products from API response: {e}")

        return products

    def _extract_products_from_html_raw(self, html: str, query: str) -> List[Dict[str, Any]]:
        """Extract products from HTML using regex patterns (no BeautifulSoup)"""
        products = []

        try:
            # Use regex to find product data patterns
            product_patterns = [
                # Data attribute products
                r'data-product-id="([^"]+)"[^>]*>(.*?)</\w+>',
                # JSON-like structures in HTML
                r'\{[^}]*"productId"\s*:\s*"([^"]+)"[^}]*\}',
                # Product links
                r'href="[^"]+/item/(\d+)/[^"]*"[^>]*>(.*?)</a>',
            ]

            found_products = set()

            for pattern in product_patterns:
                matches = re.findall(pattern, html, re.IGNORECASE | re.DOTALL)
                for match in matches[:30]:  # Limit matches per pattern
                    if isinstance(match, tuple):
                        product_id, title = match[0], match[1].strip()
                    else:
                        product_id, title = match, ""

                    if product_id and product_id not in found_products:
                        # Try to extract more data around this product
                        product_data = self._extract_single_product_from_html(html, product_id, title)
                        if product_data:
                            products.append(product_data)
                            found_products.add(product_id)

            logger.info(f"Extracted {len(products)} products from HTML using regex")

        except Exception as e:
            logger.error(f"HTML extraction error: {e}")

        return products[:40]  # Limit total products

    def _extract_single_product_from_html(self, html: str, product_id: str, title: str = "") -> Optional[Dict[str, Any]]:
        """Extract individual product data from HTML around a known product ID"""
        try:
            # Find the product section in HTML
            product_start = html.find(product_id)
            if product_start == -1:
                return None

            # Extract a reasonable amount of HTML around the product
            start = max(0, product_start - 1000)
            end = min(len(html), product_start + 2000)
            product_html = html[start:end]

            # Extract product information using regex
            product_info = {
                'product_id': product_id,
                'title': title or self._extract_title_from_html(product_html),
                'price': self._extract_price_from_html(product_html),
                'rating': self._extract_rating_from_html(product_html),
                'reviews_count': self._extract_reviews_from_html(product_html),
                'images': self._extract_images_from_html(product_html),
                'seller_info': self._extract_seller_from_html(product_html),
                'url': f"https://www.aliexpress.com/item/{product_id}.html",
                'scraped_at': datetime.now()
            }

            # Clean up and validate
            if product_info['title'] or product_info['price']:
                return product_info
            else:
                logger.debug(f"No significant data found for product {product_id}")
                return None

        except Exception as e:
            logger.debug(f"Single product extraction failed: {e}")
            return None

    def _parse_api_product(self, item: Dict) -> Optional[Dict[str, Any]]:
        """Parse product from API response"""
        try:
            product_id = str(item.get('productId', item.get('id', item.get('itemId', ''))))

            if not product_id:
                return None

            # Extract basic product information
            title = item.get('title', item.get('name', item.get('displayTitle', '')))
            if isinstance(title, dict):
                title = title.get('displayTitle', title.get('name', ''))

            price_info = self._parse_api_price(item.get('price', item.get('prices', {})))

            # Extract images
            images = []
            if 'image' in item:
                image_data = item['image']
                if isinstance(image_data, str):
                    images = [self._normalize_image_url(image_data)]
                elif isinstance(image_data, dict):
                    img_url = image_data.get('imgUrl') or image_data.get('url')
                    if img_url:
                        images = [self._normalize_image_url(img_url)]
                elif isinstance(image_data, list):
                    images = [self._normalize_image_url(img) for img in image_data if isinstance(img, str)]

            return {
                'product_id': product_id,
                'title': title,
                'price': price_info,
                'images': images,
                'rating': float(item.get('rating', item.get('averageRating', 0))),
                'reviews_count': int(item.get('reviewsCount', item.get('reviewCount', 0))),
                'seller_info': self._parse_api_seller(item.get('seller', item.get('store', {}))),
                'shipping_info': item.get('shipping', item.get('shippingInfo', {})),
                'variations': item.get('variations', item.get('sku', [])),
                'description': item.get('description', item.get('shortDescription', '')),
                'url': item.get('url', item.get('productUrl', f"https://www.aliexpress.com/item/{product_id}.html")),
                'scraped_at': datetime.now()
            }

        except Exception as e:
            logger.debug(f"API product parsing error: {e}")
            return None

    def _parse_api_price(self, price_data) -> Dict[str, Any]:
        """Parse price data from API response"""
        try:
            if isinstance(price_data, dict):
                return {
                    'min_price': float(price_data.get('minPrice', price_data.get('originalPrice', 0))),
                    'max_price': float(price_data.get('maxPrice', price_data.get('salePrice', 0))),
                    'currency': price_data.get('currencyCode', 'USD'),
                    'formatted': price_data.get('formattedPrice', '')
                }
            elif isinstance(price_data, str):
                # Try to parse numeric values from string
                numbers = re.findall(r'[\d.]+', price_data.replace(',', ''))
                if numbers:
                    prices = [float(n) for n in numbers]
                    return {
                        'min_price': min(prices),
                        'max_price': max(prices),
                        'currency': 'USD',
                        'formatted': price_data
                    }
        except Exception as e:
            logger.debug(f"Price parsing error: {e}")

        return {}

    def _parse_api_seller(self, seller_data) -> Dict[str, Any]:
        """Parse seller information from API response"""
        try:
            if isinstance(seller_data, dict):
                return {
                    'store_id': seller_data.get('id', seller_data.get('storeId', '')),
                    'store_name': seller_data.get('name', seller_data.get('storeName', '')),
                    'store_url': seller_data.get('url', seller_data.get('storeUrl', ''))
                }
        except Exception as e:
            logger.debug(f"Seller parsing error: {e}")

        return {}

    def _extract_title_from_html(self, html: str) -> str:
        """Extract title from HTML using regex"""
        try:
            # Multiple title patterns
            title_patterns = [
                r'<h1[^>]*>([^<]+)</h1>',
                r'title="([^"]*product[^"]*)"',
                r'alt="([^"]*product[^"]*)"',
                r'data-title="([^"]*)"',
                r'<title>([^<]*)</title>'
            ]

            for pattern in title_patterns:
                matches = re.findall(pattern, html, re.IGNORECASE)
                for match in matches:
                    title = match.strip()
                    if title and len(title) > 3 and not title.lower().startswith(('aliexpress', 'http')):
                        return title

        except Exception as e:
            logger.debug(f"Title extraction error: {e}")

        return ""

    def _extract_price_from_html(self, html: str) -> Dict[str, Any]:
        """Extract price from HTML using regex"""
        try:
            # Price patterns
            price_patterns = [
                r'[\$€£]\s*([0-9,]+\.?[0-9]*)',  # $12.99 format
                r'price["\']\s*:\s*["\']([0-9,]+\.?[0-9]*)\$?["\']',  # JSON-style price
                r'data-price="([0-9,]+\.?[0-9]*)"',  # Data attribute price
                r'([0-9,]+\.?[0-9]*)\s*(?:USD|EUR|GBP)'  # Currency format
            ]

            for pattern in price_patterns:
                matches = re.findall(pattern, html, re.IGNORECASE)
                if matches:
                    prices = [float(m.replace(',', '')) for m in matches[:3] if float(m.replace(',', '')) > 0]
                    if prices:
                        return {
                            'min_price': min(prices),
                            'max_price': max(prices),
                            'currency': 'USD',
                            'formatted': matches[0]
                        }

        except Exception as e:
            logger.debug(f"Price extraction error: {e}")

        return {}

    def _extract_rating_from_html(self, html: str) -> float:
        """Extract rating from HTML using regex"""
        try:
            rating_patterns = [
                r'([0-4]\.[0-9]|5\.0)\s*(?:stars?|rating)',
                r'"rating"\s*:\s*"([0-4]\.[0-9]|5\.0)"',
                r'data-rating="([0-4]\.[0-9]|5\.0)"'
            ]

            for pattern in rating_patterns:
                matches = re.findall(pattern, html, re.IGNORECASE)
                if matches:
                    rating = float(matches[0])
                    if 0 <= rating <= 5:
                        return rating

        except Exception as e:
            logger.debug(f"Rating extraction error: {e}")

        return 0.0

    def _extract_reviews_from_html(self, html: str) -> int:
        """Extract reviews count from HTML using regex"""
        try:
            review_patterns = [
                r'([0-9]+(?:,[0-9]{3})*)\s*(?:reviews?|reviewers?)',
                r'"reviewCount"\s*:\s*"([0-9]+(?:,[0-9]{3})*)"',
                r'data-reviews="([0-9]+(?:,[0-9]{3})*)"'
            ]

            for pattern in review_patterns:
                matches = re.findall(pattern, html, re.IGNORECASE)
                if matches:
                    count_str = matches[0].replace(',', '')
                    if count_str.isdigit():
                        return int(count_str)

        except Exception as e:
            logger.debug(f"Reviews extraction error: {e}")

        return 0

    def _extract_images_from_html(self, html: str) -> List[str]:
        """Extract images from HTML using regex"""
        try:
            image_patterns = [
                r'src="([^"]*\.(?:jpg|jpeg|png|webp))"',
                r'data-src="([^"]*\.(?:jpg|jpeg|png|webp))"',
                r'"imagePathList"\s*:\s*\[([^\]]+)\]',
                r'srcset="([^"]*\.(?:jpg|jpeg|png|webp))[^"]*"'
            ]

            images = set()  # Use set to avoid duplicates

            for pattern in image_patterns:
                matches = re.findall(pattern, html, re.IGNORECASE)
                for match in matches:
                    if isinstance(match, str):
                        img_url = match.strip()

                        # Skip very small images, placeholders, icons
                        if (img_url and
                            not img_url.lower().endswith(('ico', 'svg')) and
                            not any(skip in img_url.lower() for skip in ['placeholder', 'icon', 'banner', 'logo']) and
                            len(img_url) > 10):

                            normalized_url = self._normalize_image_url(img_url)
                            images.add(normalized_url)

            return list(images)[:5]  # Limit to 5 images

        except Exception as e:
            logger.debug(f"Images extraction error: {e}")

        return []

    def _extract_seller_from_html(self, html: str) -> Dict[str, Any]:
        """Extract seller from HTML using regex"""
        try:
            seller_patterns = [
                r'"storeName"\s*:\s*"([^"]*)"',
                r'store-name">([^<]+)</[^>]+>',
                r'data-store-name="([^"]*)"'
            ]

            for pattern in seller_patterns:
                matches = re.findall(pattern, html, re.IGNORECASE)
                if matches:
                    return {
                        'store_name': matches[0],
                        'store_id': '',
                        'store_url': ''
                    }

        except Exception as e:
            logger.debug(f"Seller extraction error: {e}")

        return {}

    def _normalize_image_url(self, url: str) -> str:
        """Normalize image URL"""
        if not url:
            return ""

        if url.startswith('//'):
            return f"https:{url}"
        elif url.startswith('/'):
            return f"https://www.aliexpress.com{url}"
        elif not url.startswith(('http://', 'https://')):
            return f"https://www.aliexpress.com/{url.lstrip('/')}"
        return url

    def save_products_to_mongodb(self, products: List[Dict[str, Any]]) -> int:
        """Save products to MongoDB"""
        if not products:
            return 0

        saved_count = 0
        for product in products:
            try:
                result = self.products_collection.update_one(
                    {'product_id': product['product_id']},
                    {'$set': product},
                    upsert=True
                )

                if result.upserted_id or result.modified_count:
                    saved_count += 1

            except Exception as e:
                logger.error(f"Error saving product {product.get('product_id', 'Unknown')}: {e}")

        logger.info(f"Saved {saved_count} products to MongoDB")
        return saved_count

    def _save_search_history(self, query: str, results_count: int, method: str):
        """Save search history to MongoDB"""
        try:
            search_record = {
                'query': query,
                'results_count': results_count,
                'method': method,
                'timestamp': datetime.now(),
                'query_hash': hashlib.md5(query.encode()).hexdigest()
            }

            self.search_history_collection.insert_one(search_record)

        except Exception as e:
            logger.error(f"Error saving search history: {e}")

    def export_to_json(self, products: List[Dict[str, Any]], filename: str = None) -> str:
        """Export products to JSON file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"aliexpress_products_{timestamp}.json"

        json_products = []
        for product in products:
            json_product = product.copy()
            if 'scraped_at' in json_product and isinstance(json_product['scraped_at'], datetime):
                json_product['scraped_at'] = json_product['scraped_at'].isoformat()
            json_products.append(json_product)

        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(json_products, f, ensure_ascii=False, indent=2)

            logger.info(f"Products exported to {filename}")
            return filename

        except Exception as e:
            logger.error(f"Error exporting to JSON: {e}")
            return ""

    async def scrape_products(self, query: str, max_pages: int = 3, method: str = "api") -> Dict[str, Any]:
        """Main scraping method using streamlined approach"""
        start_time = time.time()

        try:
            # Search for products
            products = await self.search_products(query, max_pages, method)

            if not products:
                return {
                    'success': False,
                    'message': 'No products found',
                    'query': query,
                    'method': method,
                    'products': [],
                    'stats': {
                        'total_products': 0,
                        'execution_time': round(time.time() - start_time, 2)
                    }
                }

            # Optionally get detailed information for top products (simplified)
            for product in products[:3]:  # Only detail top 3 products
                product_id = product.get('product_id')
                if product_id:
                    try:
                        # Simplified detailed fetch - just add some basic extra info
                        enriched_product = await self._get_enriched_product_info(product_id)
                        if enriched_product:
                            product.update(enriched_product)
                    except Exception as e:
                        logger.debug(f"Could not enrich product {product_id}: {e}")

            # Save to database
            saved_count = self.save_products_to_mongodb(products)

            result = {
                'success': True,
                'message': f'Successfully scraped {len(products)} products',
                'query': query,
                'method': method,
                'products': products,
                'stats': {
                    'total_products': len(products),
                    'saved_to_db': saved_count,
                    'execution_time': round(time.time() - start_time, 2)
                }
            }

            logger.info(f"Scraping completed successfully in {result['stats']['execution_time']} seconds")
            return result

        except Exception as e:
            logger.error(f"Scraping failed: {e}")
            return {
                'success': False,
                'message': f'Scraping failed: {str(e)}',
                'query': query,
                'method': method,
                'products': [],
                'stats': {
                    'total_products': 0,
                    'execution_time': round(time.time() - start_time, 2)
                }
            }

    async def _get_enriched_product_info(self, product_id: str) -> Optional[Dict[str, Any]]:
        """Get additional product information (simplified)"""
        try:
            # This could be enhanced to fetch from AliExpress API
            # For now, just return some basic enhanced info
            return {
                'detailed_scraped_at': datetime.now(),
                'scraping_method': 'API + Browser hybrid'
            }
        except Exception as e:
            logger.debug(f"Could not enrich product {product_id}: {e}")
            return None

    async def close(self):
        """Close all connections"""
        if self.browser_manager:
            await self.browser_manager.close()

        if self.mongodb_client:
            self.mongodb_client.close()

        logger.info("All connections closed")

# CLI Interface
async def main():
    """Command line interface for the streamlined scraper"""
    import argparse

    parser = argparse.ArgumentParser(description='Streamlined AliExpress API Scraper')
    parser.add_argument('query', help='Search query for products')
    parser.add_argument('--pages', type=int, default=3, help='Number of pages to scrape (default: 3)')
    parser.add_argument('--method', choices=['api', 'browser', 'all'], default='api',
                       help='Scraping method (default: api)')
    parser.add_argument('--mongodb-uri', default='mongodb://localhost:27017/',
                       help='MongoDB connection URI')
    parser.add_argument('--database', default='aliexpress_data', help='Database name')
    parser.add_argument('--no-db', action='store_true', help='Skip saving to database')
    parser.add_argument('--no-json', action='store_true', help='Skip JSON export')
    parser.add_argument('--no-browser', action='store_true', help='Disable browser-based scraping')

    args = parser.parse_args()

    scraper = StreamlinedAliExpressScraper(
        args.mongodb_uri,
        args.database,
        use_browser=not args.no_browser
    )

    try:
        result = await scraper.scrape_products(
            query=args.query,
            max_pages=args.pages,
            method=args.method
        )

        print(json.dumps({
            'success': result['success'],
            'message': result['message'],
            'query': result['query'],
            'method': result['method'],
            'stats': result['stats'],
            'products_count': len(result['products']) if 'products' in result else 0
        }, indent=2))

        if result['success'] and result.get('products'):
            print(f"\nFirst product sample:")
            if result['products']:
                first_product = result['products'][0]
                print(json.dumps({
                    'product_id': first_product.get('product_id'),
                    'title': first_product.get('title', '')[:100] + '...' if len(first_product.get('title', '')) > 100 else first_product.get('title', ''),
                    'price': first_product.get('price'),
                    'rating': first_product.get('rating'),
                    'reviews_count': first_product.get('reviews_count'),
                    'images_count': len(first_product.get('images', [])),
                    'url': first_product.get('url')
                }, indent=2))

    except KeyboardInterrupt:
        logger.info("Scraping interrupted by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
    finally:
        await scraper.close()

if __name__ == "__main__":
    # CLI help
    print("Streamlined AliExpress API Scraper")
    print("=" * 40)
    print("This scraper uses:")
    print("• Enhanced JSON API for primary scraping")
    print("• Playwright browser for fallback + advanced detection")
    print("• No BeautifulSoup dependency")
    print("=" * 40)

    # Run the scraper
    asyncio.run(main())
