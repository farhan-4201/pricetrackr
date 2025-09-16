import logging
import time
import re
import json
import sys
import socket
import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from fuzzywuzzy import fuzz   # or rapidfuzz if you swap
import os
from urllib.parse import urljoin, urlparse, quote
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
        
        # Base URLs
        self.base_urls = [
            "https://www.daraz.pk",
            "https://daraz.pk"
        ]
        self.working_base_url = None
        
        self.session = requests.Session()
        
        # Updated selectors — need to verify via Inspect in browser
        # --- Search / listing page selectors ---
        self.item_selector = "div[data-qa-locator='general-products'] div[data-qa-locator='product-item'], div[class*='gridItem'], div[class*='Box--product']"
        # name/title inside item
        self.name_selector = "div.info--ifj7U .title--wFj93 a, div.info--ifj7U .title--wFj93, h2.title"
        # link to product page
        self.link_selector = "a[data-qa-locator='product-item'], div.info--ifj7U a"
        # image element
        self.image_selector = "img[data-src], img[src], a img"
        # current price
        self.current_price_selector = "div.info--ifj7U .price--NVB62 span, span.currency--GVKjl"
        # original price if discount
        self.original_price_selector = "div.priceExtra--ocAYk span.origPrice--AJxRs del span, del.currency--GVKjl"
        # discount label
        self.discount_selector = "span.discount--HADrg, span.tag--discount"

        # pagination / next page
        self.next_page_selector = "li[title='Next Page'] a, a.next, ul.pagination li.next a"
        
        # --- Product detail page selectors ---
        self.product_name_selector = "h1.pdp-mod-product-badge-title, .pdp-mod-product-title, div.pdp-product-title"
        self.ratings_selector = "div.pdp-review-summary a.pdp-link, .review-box .stars, .product-rating"
        self.product_current_price_selector = "div.pdp-mod-product-price span.pdp-price_type_normal, .pdp-product-price .price-current"
        self.product_original_price_selector = "div.pdp-mod-product-price span.pdp-price_type_deleted, span.pdp-price_deleted"
        self.product_image_selector = "img.pdp-mod-common-image, .pdp-image img, .pdp-gallery img"
        self.store_selector = "div.seller-name__detail a, .seller-name, .store-info a"

        self.setup_session()

    def setup_session(self):
        """Configure session with proper headers and settings"""
        self.session.headers.update({
            'User-Agent': self.get_user_agent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        })
        
        adapter = requests.adapters.HTTPAdapter(
            max_retries=requests.packages.urllib3.util.retry.Retry(
                total=3,
                backoff_factor=1,
                status_forcelist=[500, 502, 503, 504]
            )
        )
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)

    def validate_url(self, url: str) -> bool:
        if not url:
            return False
        
        parsed = urlparse(url)
        if 'daraz' not in parsed.netloc.lower():
            return False
        
        useful_patterns = ['/products/', '/i/', '-i.']
        return any(pattern in url for pattern in useful_patterns)

    def check_connectivity(self) -> bool:
        try:
            for base_url in self.base_urls:
                resp = self.session.head(base_url, timeout=15, allow_redirects=True)
                if resp.status_code == 200:
                    self.working_base_url = base_url
                    logger.info(f"Connected to: {base_url}")
                    return True
            return False
        except Exception as e:
            logger.warning(f"Connectivity check failed: {e}")
            return False

    def extract_price(self, price_text: str) -> Optional[int]:
        if not price_text:
            return None
        clean = re.sub(r'[^\d.,]', '', price_text)
        match = re.search(r'(\d{1,3}(?:,\d{3})*|\d+)', clean)
        if match:
            try:
                ps = match.group(1).replace(',', '')
                price = int(float(ps))
                return price if price > 0 else None
            except:
                return None
        return None

    def get_user_agent(self) -> str:
        agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/121.0.0.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        ]
        return random.choice(agents)

    def fetch_html(self, url: str, retries: int = 3) -> str:
        last_exception = None
        for attempt in range(retries):
            try:
                if attempt > 0:
                    self.session.headers['User-Agent'] = self.get_user_agent()
                    time.sleep(random.uniform(2,5))
                
                logger.info(f"Fetching URL (attempt {attempt + 1}): {url}")
                resp = self.session.get(url, timeout=30, allow_redirects=True)
                if resp.status_code == 200:
                    return resp.text
                elif resp.status_code == 403:
                    logger.warning(f"Access denied (403) for URL: {url}")
                    time.sleep(random.uniform(5,10))
                elif resp.status_code == 429:
                    logger.warning(f"Rate limited (429) for URL: {url}")
                    time.sleep(random.uniform(10,20))
                else:
                    logger.warning(f"HTTP {resp.status_code} for URL: {url}")
            except requests.exceptions.RequestException as e:
                last_exception = e
                logger.warning(f"Request failed (attempt {attempt + 1}): {e}")
                if attempt < retries - 1:
                    time.sleep(random.uniform(3,7))
        raise Exception(f"Failed to fetch URL after {retries} attempts. Last error: {last_exception}")

    def extract_item_data_soup(self, item, index: int) -> Optional[Dict[str, Any]]:
        try:
            # Name/title
            name_elem = item.select_one(self.name_selector)
            name = name_elem.get_text().strip() if name_elem else None
            if not name or len(name) <= 3:
                return None
            
            # Link
            link_elem = item.select_one(self.link_selector)
            link = None
            if link_elem:
                href = link_elem.get('href')
                if href:
                    if not href.startswith("http"):
                        href = urljoin(self.working_base_url, href)
                    if self.validate_url(href):
                        link = href
            if not link:
                return None
            
            # Image
            image = None
            image_elem = item.select_one(self.image_selector)
            if image_elem:
                src = image_elem.get('src') or image_elem.get('data-src') or image_elem.get('data-original')
                if src and len(src) > 10:
                    image = src if src.startswith('http') else urljoin(self.working_base_url, src)
            
            # Current price
            curr_elem = item.select_one(self.current_price_selector)
            current_price = self.extract_price(curr_elem.get_text()) if curr_elem else None
            
            # Original price
            orig_elem = item.select_one(self.original_price_selector)
            original_price = self.extract_price(orig_elem.get_text()) if orig_elem else None
            
            # Discount
            discount_elem = item.select_one(self.discount_selector)
            discount = discount_elem.get_text().strip() if discount_elem else None
            
            return {
                'name': name[:200],
                'currentPrice': current_price,
                'originalPrice': original_price,
                'discount': discount,
                'url': link,
                'imageUrl': image,
                'vendor': 'daraz',
                'lastChecked': int(time.time() * 1000)
            }
        except Exception as e:
            logger.debug(f"Failed to extract item {index}: {e}")
            return None

    def generate_search_url(self, product_name: str) -> str:
        if not self.working_base_url:
            return ""
        query = quote(product_name)
        return f"{self.working_base_url}/catalog/?q={query}&_keyori=ss&from=input"

    def scrape_search_results(self, product_name: str, max_results: int = 10) -> List[Dict[str, Any]]:
        if not self.working_base_url and not self.check_connectivity():
            raise Exception("Cannot connect to Daraz")

        results: List[Dict[str, Any]] = []
        url = self.generate_search_url(product_name)
        logger.info(f"Searching: {url}")

        while len(results) < max_results and url:
            try:
                html = self.fetch_html(url)
                soup = BeautifulSoup(html, 'html.parser')

                items = soup.select(self.item_selector)
                if not items:
                    logger.warning("No products found on page with selector: " + self.item_selector)
                    break

                logger.info(f"Found {len(items)} items on page")

                for i, item in enumerate(items):
                    if len(results) >= max_results:
                        break
                    data = self.extract_item_data_soup(item, i)
                    if data:
                        data['search_query'] = product_name
                        results.append(data)
                        logger.info(f"Extracted: {data['name'][:50]}...")

                # Next page link
                next_btn = soup.select_one(self.next_page_selector)
                if not next_btn:
                    break
                href = next_btn.get('href')
                if href:
                    next_url = urljoin(url, href)
                    if next_url == url:
                        break
                    url = next_url
                    time.sleep(random.uniform(1,3))
                else:
                    break
            except Exception as e:
                logger.error(f"Error scraping page: {e}")
                break

        return results

    def find_best_match(self, results: List[Dict[str, Any]], target_product: str) -> Optional[Dict[str, Any]]:
        if not results:
            return None
        target_lower = target_product.lower().strip()
        best_match = None
        best_score = 0

        for result in results:
            if not result.get('name'):
                continue
            rn = result['name'].lower().strip()
            scores = [
                fuzz.ratio(target_lower, rn),
                fuzz.partial_ratio(target_lower, rn),
                fuzz.token_sort_ratio(target_lower, rn)
            ]
            if target_lower in rn or rn in target_lower:
                scores.append(90)
            final = max(scores) if scores else 0
            if final > best_score:
                best_score = final
                best_match = result

        if best_match and best_score > 30:
            logger.info(f"Best match: {best_match['name'][:50]}... (score: {best_score:.1f})")
            return best_match
        elif results:
            logger.info("Using first available result")
            return results[0]
        return None

    def scrape_product(self, product_name: str, max_results: int = 5) -> Optional[Dict[str, Any]]:
        try:
            logger.info(f"Scraping product: {product_name}")
            search_results = self.scrape_search_results(product_name, max_results)
            if not search_results:
                return {
                    'error': 'No products found',
                    'message': f'No products found for \"{product_name}\"'
                }
            
            best = self.find_best_match(search_results, product_name)
            if not best:
                return {
                    'error': 'No suitable match found',
                    'message': f'No suitable match found for \"{product_name}\"'
                }
            
            if not all(k in best for k in ['name', 'url']):
                return {
                    'error': 'Invalid product data',
                    'message': 'Product data is incomplete'
                }
            
            try:
                prod_html = self.fetch_html(best['url'])
                prod_soup = BeautifulSoup(prod_html, 'html.parser')
                
                # override name if better
                ne = prod_soup.select_one(self.product_name_selector)
                if ne:
                    best['name'] = ne.get_text().strip()
                
                ce = prod_soup.select_one(self.product_current_price_selector)
                if ce:
                    best['currentPrice'] = self.extract_price(ce.get_text())
                
                oe = prod_soup.select_one(self.product_original_price_selector)
                if oe:
                    best['originalPrice'] = self.extract_price(oe.get_text())
                
                relem = prod_soup.select_one(self.ratings_selector)
                if relem:
                    rt_text = relem.get_text().strip()
                    star_match = re.search(r'([\d.]+)\s*out\s*of\s*5', rt_text, re.I)
                    count_match = re.search(r'\((\d+)\s*(?:reviews?|ratings?)?\)', rt_text, re.I)
                    best['rating'] = float(star_match.group(1)) if star_match else None
                    best['numRatings'] = int(count_match.group(1)) if count_match else None
                
                se = prod_soup.select_one(self.store_selector)
                if se:
                    best['store'] = se.get_text().strip()
                
                ie = prod_soup.select_one(self.product_image_selector)
                if ie:
                    src = ie.get('src') or ie.get('data-src') or ie.get('data-original')
                    if src:
                        best['imageUrl'] = src if src.startswith('http') else urljoin(best['url'], src)
                
            except Exception as e:
                logger.warning(f"Failed to scrape product page: {e}")
            
            logger.info(f"Successfully scraped: {best['name'][:50]}...")
            return best

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Scraping error: {error_msg}")
            return {
                'error': 'Scraping failed',
                'message': error_msg
            }

    def connect_mongodb(self):
        try:
            self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            self.db = self.client.get_database()
            self.collection = self.db.scraped_products
            logger.info("MongoDB connected")
        except Exception as e:
            logger.warning(f"MongoDB connection failed: {e}")

    def store_product(self, product_data: Dict[str, Any]):
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

    def close(self):
        if self.session:
            self.session.close()
        if self.client:
            self.client.close()


# Front-end friendly API functions (same as yours)...
def scrape_daraz_product(product_name: str, store_in_db: bool = False) -> Dict[str, Any]:
    scraper = OptimizedDarazScraper()
    if store_in_db:
        scraper.connect_mongodb()
    try:
        result = scraper.scrape_product(product_name)
        if store_in_db and result and not result.get('error'):
            scraper.store_product(result)
        return result
    finally:
        scraper.close()


def test_daraz_connection() -> Dict[str, Any]:
    scraper = OptimizedDarazScraper()
    try:
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
    finally:
        scraper.close()


def batch_scrape_products(product_names: List[str]) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    scraper = OptimizedDarazScraper()
    try:
        scraper.connect_mongodb()
        for product_name in product_names:
            try:
                res = scraper.scrape_product(product_name)
                if res and not res.get('error'):
                    scraper.store_product(res)
                results.append(res)
                time.sleep(random.uniform(2,5))
            except Exception as e:
                results.append({
                    'error': 'Scraping failed',
                    'message': str(e),
                    'product': product_name
                })
    finally:
        scraper.close()
    return results


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
