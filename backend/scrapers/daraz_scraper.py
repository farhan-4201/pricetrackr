import logging
import time
import re
import json
import sys
import socket
import requests
from playwright.sync_api import sync_playwright, TimeoutError
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from fuzzywuzzy import fuzz
import os
from urllib.parse import urljoin, urlparse
import random
from typing import Optional, Dict, List, Any
import traceback

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class OptimizedDarazScraper:
    def __init__(self):
        self.mongo_uri = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/price_tracker")
        self.client = None
        self.db = None
        self.collection = None
        
        # Optimized base URLs - only working ones
        self.base_urls = [
            "https://www.daraz.pk",
            "https://daraz.pk"
        ]
        
        self.working_base_url = None
        
        # Optimized selectors - most reliable ones first
        self.item_selectors = [
            "[data-qa-locator='product-item']",
            ".gridItem--Yd0sa",
            "[data-item-id]",
            ".card-product",
            ".gridItem"
        ]

        self.name_selectors = [
            "[data-qa-locator='product-name']",
            ".title--wFj93",
            ".title",
            ".product-title",
            "h3 a",
            "a[title]"
        ]

        self.price_selectors = [
            "[data-qa-locator='product-price']",
            ".price--NVB62",
            ".currency--GVKjl",
            ".price",
            ".current-price"
        ]

        self.link_selectors = [
            "a[href*='/products/']",
            "a[href*='/i/']",
            "a[data-spm]"
        ]

        self.image_selectors = [
            ".image--WOyuZ",
            "[data-qa-locator='product-image']",
            "img[src*='//']"
        ]

    def validate_url(self, url: str) -> bool:
        """Validate if URL is useful and from Daraz"""
        if not url:
            return False
        
        try:
            parsed = urlparse(url)
            # Must be daraz domain
            if 'daraz' not in parsed.netloc.lower():
                return False
            
            # Must contain product identifier
            useful_patterns = ['/products/', '/i/', '-i.']
            return any(pattern in url for pattern in useful_patterns)
        except:
            return False

    def check_connectivity(self) -> bool:
        """Quick connectivity check"""
        try:
            for base_url in self.base_urls:
                response = requests.head(
                    base_url, 
                    timeout=10,
                    headers={'User-Agent': self.get_user_agent()},
                    allow_redirects=True
                )
                if response.status_code == 200:
                    self.working_base_url = base_url
                    logger.info(f"Connected to: {base_url}")
                    return True
            return False
        except:
            return False

    def extract_price(self, price_text: str) -> Optional[int]:
        """Extract numeric price from text"""
        if not price_text:
            return None
        
        # Clean text
        clean_text = re.sub(r'[^\d.,]', '', price_text)
        
        # Extract number
        match = re.search(r'(\d{1,3}(?:,\d{3})*|\d+)', clean_text)
        if match:
            try:
                price_str = match.group(1).replace(',', '')
                price = int(float(price_str))
                return price if price > 0 else None
            except:
                pass
        return None

    def get_user_agent(self) -> str:
        """Random user agent"""
        agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        ]
        return random.choice(agents)

    def setup_browser_page(self, browser):
        """Setup optimized browser page"""
        context = browser.new_context(
            user_agent=self.get_user_agent(),
            viewport={'width': 1366, 'height': 768}
        )
        
        page = context.new_page()
        page.set_default_timeout(20000)
        
        # Block heavy resources for speed
        page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2,mp4,avi,ico}", 
                  lambda route: route.abort())
        
        return page

    def extract_item_data(self, item, index: int) -> Optional[Dict[str, Any]]:
        """Extract data from product item with validation"""
        try:
            data = {}
            
            # Extract name
            name = None
            for selector in self.name_selectors:
                try:
                    elem = item.query_selector(selector)
                    if elem:
                        text = elem.text_content() or elem.get_attribute("title")
                        if text and len(text.strip()) > 3:
                            name = text.strip()[:200]
                            break
                except:
                    continue
            
            if not name:
                return None
            
            # Extract price
            price = None
            for selector in self.price_selectors:
                try:
                    elem = item.query_selector(selector)
                    if elem:
                        price = self.extract_price(elem.text_content())
                        if price:
                            break
                except:
                    continue
            
            # Extract link and validate
            link = None
            for selector in self.link_selectors:
                try:
                    elem = item.query_selector(selector)
                    if elem:
                        href = elem.get_attribute("href")
                        if href:
                            if not href.startswith("http"):
                                href = urljoin(self.working_base_url, href)
                            if self.validate_url(href):
                                link = href
                                break
                except:
                    continue
            
            if not link:
                return None
            
            # Extract image
            image = None
            for selector in self.image_selectors:
                try:
                    elem = item.query_selector(selector)
                    if elem:
                        src = elem.get_attribute("src") or elem.get_attribute("data-src")
                        if src and len(src) > 10:
                            image = src if src.startswith('http') else urljoin(self.working_base_url, src)
                            break
                except:
                    continue
            
            return {
                'name': name,
                'currentPrice': price,
                'url': link,
                'imageUrl': image,
                'vendor': 'daraz',
                'lastChecked': int(time.time() * 1000)
            }
            
        except Exception as e:
            logger.debug(f"Failed to extract item {index}: {e}")
            return None

    def generate_search_url(self, product_name: str) -> str:
        """Generate single optimized search URL"""
        if not self.working_base_url:
            return ""
        
        query = product_name.replace(' ', '+')
        return f"{self.working_base_url}/catalog/?q={query}&_keyori=ss&from=input"

    def scrape_search_results(self, product_name: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """Scrape search results with error handling"""
        if not self.check_connectivity():
            raise Exception("Cannot connect to Daraz")
        
        results = []
        
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
            )
            
            page = self.setup_browser_page(browser)
            
            try:
                url = self.generate_search_url(product_name)
                logger.info(f"Searching: {url}")
                
                response = page.goto(url, timeout=20000, wait_until='domcontentloaded')
                if not response or response.status != 200:
                    raise Exception(f"Failed to load search page: {response.status if response else 'No response'}")
                
                # Wait for products to load
                page.wait_for_timeout(3000)
                
                # Find products
                items = []
                for selector in self.item_selectors:
                    try:
                        items = page.query_selector_all(selector)
                        if items and len(items) > 0:
                            logger.info(f"Found {len(items)} items with selector: {selector}")
                            break
                    except:
                        continue
                
                if not items:
                    logger.warning("No products found")
                    return results
                
                # Extract data from items
                for i, item in enumerate(items[:max_results]):
                    item_data = self.extract_item_data(item, i)
                    if item_data:
                        item_data['search_query'] = product_name
                        results.append(item_data)
                        logger.info(f"Extracted: {item_data['name'][:50]}...")
                    
                    if len(results) >= max_results:
                        break
                
            except TimeoutError:
                raise Exception("Page load timeout")
            except Exception as e:
                raise Exception(f"Scraping failed: {str(e)}")
            finally:
                browser.close()
        
        return results

    def find_best_match(self, results: List[Dict[str, Any]], target_product: str) -> Optional[Dict[str, Any]]:
        """Find best matching product"""
        if not results:
            return None
        
        target_lower = target_product.lower().strip()
        best_match = None
        best_score = 0
        
        for result in results:
            if not result.get('name'):
                continue
            
            result_name = result['name'].lower().strip()
            
            # Calculate similarity score
            scores = [
                fuzz.ratio(target_lower, result_name),
                fuzz.partial_ratio(target_lower, result_name),
                fuzz.token_sort_ratio(target_lower, result_name)
            ]
            
            # Bonus for exact substring match
            if target_lower in result_name or result_name in target_lower:
                scores.append(90)
            
            final_score = max(scores) if scores else 0
            
            if final_score > best_score:
                best_score = final_score
                best_match = result
        
        # Return best match if score is reasonable, otherwise first result
        if best_match and best_score > 30:
            logger.info(f"Best match: {best_match['name'][:50]}... (score: {best_score:.1f})")
            return best_match
        elif results:
            logger.info("Using first available result")
            return results[0]
        
        return None

    def scrape_product(self, product_name: str, max_results: int = 5) -> Optional[Dict[str, Any]]:
        """Main scraping function optimized for frontend"""
        try:
            logger.info(f"Scraping product: {product_name}")
            
            # Get search results
            search_results = self.scrape_search_results(product_name, max_results)
            if not search_results:
                return {
                    'error': 'No products found',
                    'message': f'No products found for "{product_name}"'
                }
            
            # Find best match
            best_match = self.find_best_match(search_results, product_name)
            if not best_match:
                return {
                    'error': 'No suitable match found',
                    'message': f'No suitable match found for "{product_name}"'
                }
            
            # Validate result has required fields
            if not all(key in best_match for key in ['name', 'url']):
                return {
                    'error': 'Invalid product data',
                    'message': 'Product data is incomplete'
                }
            
            logger.info(f"Successfully scraped: {best_match['name'][:50]}...")
            return best_match
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Scraping error: {error_msg}")
            return {
                'error': 'Scraping failed',
                'message': error_msg
            }

    def connect_mongodb(self):
        """Connect to MongoDB (optional)"""
        try:
            self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            self.db = self.client.get_database()
            self.collection = self.db.scraped_products
            logger.info("MongoDB connected")
        except Exception as e:
            logger.warning(f"MongoDB connection failed: {e}")

    def store_product(self, product_data: Dict[str, Any]):
        """Store product in database if connected"""
        if not self.collection:
            return
        
        try:
            self.collection.update_one(
                {'url': product_data['url']},
                {'$set': product_data},
                upsert=True
            )
            logger.info("Product stored in database")
        except Exception as e:
            logger.warning(f"Database storage failed: {e}")

# Frontend-friendly API functions
def scrape_daraz_product(product_name: str, store_in_db: bool = False) -> Dict[str, Any]:
    """
    Main API function for frontend integration
    
    Args:
        product_name: Product to search for
        store_in_db: Whether to store result in database
    
    Returns:
        Dict with product data or error information
    """
    scraper = OptimizedDarazScraper()
    
    if store_in_db:
        scraper.connect_mongodb()
    
    try:
        result = scraper.scrape_product(product_name)
        
        if store_in_db and result and not result.get('error'):
            scraper.store_product(result)
        
        return result
    
    finally:
        if scraper.client:
            scraper.client.close()

def test_daraz_connection() -> Dict[str, Any]:
    """Test connectivity to Daraz"""
    scraper = OptimizedDarazScraper()
    
    if scraper.check_connectivity():
        return {
            'status': 'success',
            'message': 'Successfully connected to Daraz',
            'working_url': scraper.working_base_url
        }
    else:
        return {
            'status': 'error',
            'message': 'Cannot connect to Daraz'
        }

def batch_scrape_products(product_names: List[str]) -> List[Dict[str, Any]]:
    """Scrape multiple products (for bulk operations)"""
    results = []
    scraper = OptimizedDarazScraper()
    
    try:
        scraper.connect_mongodb()
        
        for product_name in product_names:
            try:
                result = scraper.scrape_product(product_name)
                if result and not result.get('error'):
                    scraper.store_product(result)
                results.append(result)
                
                # Small delay between requests
                time.sleep(1)
                
            except Exception as e:
                results.append({
                    'error': 'Scraping failed',
                    'message': str(e),
                    'product': product_name
                })
    
    finally:
        if scraper.client:
            scraper.client.close()
    
    return results

# CLI interface
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "No product name provided",
            "usage": "python scraper.py 'product name' [--test]"
        }))
        sys.exit(1)
    
    if sys.argv[1] == "--test":
        result = test_daraz_connection()
        print(json.dumps(result, indent=2))
        sys.exit(0)
    
    product_name = sys.argv[1]
    
    try:
        result = scrape_daraz_product(product_name, store_in_db=False)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except KeyboardInterrupt:
        print(json.dumps({"error": "Interrupted by user"}))
    except Exception as e:
        print(json.dumps({"error": f"Unexpected error: {str(e)}"}))