import logging
import time
import re
import json
import sys
import yaml
import socket
import requests
from playwright.sync_api import sync_playwright
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from fuzzywuzzy import fuzz
import os
from urllib.parse import urljoin
import random
import subprocess
import platform
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class OptimizedDarazScraper:
    def __init__(self):
        self.mongo_uri = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/price_tracker")
        self.client = None
        self.db = None
        self.collection = None
        
        # Multiple base URLs to try
        self.base_urls = [
            "https://www.daraz.pk",
            "https://daraz.pk",
            "http://www.daraz.pk",
            "http://daraz.pk"
        ]
        
        self.working_base_url = None
        
        # Load selectors from YAML file or use defaults
        self.selectors = self.load_selectors()
        
        # Fallback selectors in priority order
        self.item_selectors = [
            "[data-item-id]",
            "[data-qa-locator='product-item']",
            ".card-product",
            ".gridItem",
            ".product-card",
            ".product-item",
            "[class*='card']",
            "[class*='item']",
            ".c-listing",
            ".item--deal",
            ".c-main-product"
        ]

        self.name_selectors = [
            "[data-qa-locator='product-name']",
            ".title",
            ".product-title",
            ".item-name",
            ".product-name",
            "h3 a",
            "h4 a",
            "a[data-spm]",
            "a[class*='title']",
            "[class*='title']",
            ".product-card-title"
        ]

        self.price_selectors = [
            "[data-qa-locator='product-price']",
            ".currency",
            ".price",
            ".current-price",
            ".sales-price",
            "span[class*='price']",
            "span[class*='amount']",
            ".product-price span",
            ".price--NVB62",
            ".price-display",
            "[data-price]"
        ]

        self.link_selectors = [
            "a[href*='/products/']",
            "a[href*='/i/']",
            "a[data-spm]",
            "a[class*='product']",
            "[href*='/products/']",
            "[href*='/product/']"
        ]

        self.image_selectors = [
            "[data-qa-locator='product-image']",
            ".image",
            ".product-image img",
            ".item-image img",
            "img[src*='//']",
            "img[data-src]",
            "a img"
        ]

    def check_dns_resolution(self, domain):
        """Check if DNS can resolve the domain"""
        try:
            socket.gethostbyname(domain)
            logger.info(f"✓ DNS resolution successful for {domain}")
            return True
        except socket.gaierror as e:
            logger.error(f"✗ DNS resolution failed for {domain}: {e}")
            return False

    def check_network_connectivity(self):
        """Enhanced network connectivity check with detailed diagnostics"""
        logger.info("Running comprehensive network connectivity check...")
        
        # Step 1: Check basic internet connectivity
        try:
            socket.create_connection(("8.8.8.8", 53), timeout=5)
            logger.info("✓ Basic internet connection: OK")
        except socket.error as e:
            logger.error(f"✗ No internet connection: {e}")
            return False
        
        # Step 2: Check DNS resolution for daraz domains
        domains_to_check = ["daraz.pk", "www.daraz.pk"]
        dns_working = False
        
        for domain in domains_to_check:
            if self.check_dns_resolution(domain):
                dns_working = True
                break
        
        if not dns_working:
            logger.error("✗ DNS resolution failed for all Daraz domains")
            logger.info("Troubleshooting: Try changing DNS to 8.8.8.8 or use VPN")
            return False
        
        # Step 3: Test HTTP connectivity to each base URL
        working_urls = []
        
        for base_url in self.base_urls:
            try:
                logger.info(f"Testing HTTP connectivity to: {base_url}")
                response = requests.get(
                    base_url, 
                    timeout=15, 
                    headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                    },
                    allow_redirects=True
                )
                
                if response.status_code == 200:
                    working_urls.append(base_url)
                    logger.info(f"✓ Successfully connected to: {base_url}")
                    if not self.working_base_url:
                        self.working_base_url = base_url
                else:
                    logger.warning(f"✗ {base_url} returned status: {response.status_code}")
                    
            except requests.exceptions.SSLError as e:
                logger.warning(f"✗ SSL Error for {base_url}: {e}")
            except requests.exceptions.ConnectionError as e:
                logger.warning(f"✗ Connection Error for {base_url}: {e}")
            except requests.exceptions.Timeout as e:
                logger.warning(f"✗ Timeout Error for {base_url}: {e}")
            except requests.exceptions.RequestException as e:
                logger.warning(f"✗ Request Error for {base_url}: {e}")
        
        if working_urls:
            logger.info(f"✓ Network connectivity check passed. Working URLs: {len(working_urls)}")
            return True
        else:
            logger.error("✗ Could not connect to any Daraz URL")
            self.print_troubleshooting_guide()
            return False

    def print_troubleshooting_guide(self):
        """Print detailed troubleshooting guide"""
        logger.info("\n" + "="*60)
        logger.info("TROUBLESHOOTING GUIDE")
        logger.info("="*60)
        logger.info("1. DNS Issues:")
        logger.info("   - Change DNS to 8.8.8.8 and 8.8.4.4 (Google DNS)")
        logger.info("   - Flush DNS cache: ipconfig /flushdns (Windows) or sudo dscacheutil -flushcache (Mac)")
        logger.info("")
        logger.info("2. Regional Blocking:")
        logger.info("   - Use VPN connected to Pakistan")
        logger.info("   - Try different VPN servers")
        logger.info("")
        logger.info("3. Network/Firewall:")
        logger.info("   - Disable antivirus/firewall temporarily")
        logger.info("   - Try different network (mobile hotspot)")
        logger.info("   - Check corporate firewall settings")
        logger.info("")
        logger.info("4. ISP Issues:")
        logger.info("   - Contact ISP about domain blocking")
        logger.info("   - Try using mobile data")
        logger.info("="*60)

    def test_with_ping(self):
        """Test connectivity using ping"""
        logger.info("Testing with ping...")
        domains = ["daraz.pk", "www.daraz.pk"]
        
        for domain in domains:
            try:
                if platform.system().lower() == "windows":
                    result = subprocess.run(["ping", "-n", "4", domain], 
                                          capture_output=True, text=True, timeout=10)
                else:
                    result = subprocess.run(["ping", "-c", "4", domain], 
                                          capture_output=True, text=True, timeout=10)
                
                if result.returncode == 0:
                    logger.info(f"✓ Ping successful for {domain}")
                    return True
                else:
                    logger.warning(f"✗ Ping failed for {domain}")
            except subprocess.TimeoutExpired:
                logger.warning(f"✗ Ping timeout for {domain}")
            except Exception as e:
                logger.warning(f"✗ Ping error for {domain}: {e}")
        
        return False

    def load_selectors(self):
        """Load selectors from YAML file or return defaults"""
        try:
            with open('selectors.yaml', 'r') as file:
                selectors = yaml.safe_load(file)
                logger.info("✓ Loaded selectors from selectors.yaml")
                return selectors
        except FileNotFoundError:
            logger.warning("⚠ selectors.yaml not found, using hardcoded selectors")
            return {
                'category_main_contents': "div[data-qa-locator='product-item']",
                'category_product_names': "div.title--wFj93",
                'category_product_links': "div.mainPic--ehOdr a",
                'category_product_image': "div.mainPic--ehOdr a img.image--WOyuZ",
                'category_discount_price': "div.price--NVB62 span.currency--GVKjl",
                'product_name': "span.pdp-mod-product-badge-title",
                'product_dc_price': "div.pdp-mod-product-price span.pdp-price.pdp-price_type_normal.pdp-price_color_orange.pdp-price_size_xl",
                'image_link': "img.pdp-mod-common-image.gallery-preview-panel__image"
            }
        except Exception as e:
            logger.error(f"✗ Error loading YAML: {e}")
            return {}

    def connect_mongodb(self):
        """Connect to MongoDB database"""
        try:
            self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            self.db = self.client.get_database()
            self.collection = self.db.scraped_products
            logger.info("✓ MongoDB connected successfully")
        except ConnectionFailure as e:
            logger.error(f"✗ MongoDB connection failed: {e}")
            raise

    def extract_price(self, price_text):
        """Enhanced price extraction with multiple patterns"""
        if not price_text:
            return None
        
        # Clean the text
        price_text = price_text.replace('\u00a0', ' ').replace(',', '').strip()
        
        # Multiple regex patterns to try
        patterns = [
            r'(?:Rs\.?\s*|PKR\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)',
            r'(\d+(?:,\d{3})*)',
            r'(\d+\.?\d*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, price_text)
            if match:
                try:
                    price_str = match.group(1).replace(',', '')
                    price_value = int(float(price_str))
                    if price_value > 0:  # Ensure positive price
                        return price_value
                except (ValueError, IndexError):
                    continue
        
        logger.debug(f"Could not extract price from: {price_text}")
        return None

    def get_user_agent(self):
        """Get random user agent"""
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        ]
        return random.choice(user_agents)

    def setup_browser_page(self, browser):
        """Setup optimized browser page with better network handling"""
        context = browser.new_context(
            user_agent=self.get_user_agent(),
            viewport={'width': 1920, 'height': 1080},
            java_script_enabled=True,
            extra_http_headers={
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        )
        
        page = context.new_page()
        
        # Set longer timeout for network issues
        page.set_default_timeout(45000)
        
        # Block heavy resources but keep essential ones for better performance
        page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2,mp4,avi,mov,ico}", 
                  lambda route: route.abort())
        
        return page

    def extract_item_data_with_fallbacks(self, item, index):
        """Enhanced item data extraction with multiple fallback strategies"""
        try:
            data = {'index': index}
            
            # Extract name with fallbacks
            name = None
            for selector in self.name_selectors:
                try:
                    elem = item.query_selector(selector)
                    if elem:
                        name = elem.text_content()
                        if name:
                            name = name.strip()
                            if len(name) > 3 and len(name) < 200:  # Reasonable name length
                                break
                        # Try title attribute
                        title = elem.get_attribute("title")
                        if title and len(title) > 3 and len(title) < 200:
                            name = title.strip()
                            break
                except Exception as e:
                    logger.debug(f"Name selector '{selector}' failed: {e}")
                    continue
            
            if not name:
                # Last resort - try to get from any link title or text
                try:
                    link_elem = item.query_selector("a")
                    if link_elem:
                        name = link_elem.get_attribute("title") or link_elem.text_content()
                        if name:
                            name = name.strip()
                except:
                    pass
            
            if not name or len(name) < 3:
                logger.debug(f"Could not extract valid name for item {index}")
                return None
            
            data['name'] = name
            
            # Extract price with fallbacks
            price = None
            for selector in self.price_selectors:
                try:
                    elem = item.query_selector(selector)
                    if elem:
                        price_text = elem.text_content()
                        if price_text:
                            price = self.extract_price(price_text.strip())
                            if price and price > 0:
                                break
                except Exception as e:
                    logger.debug(f"Price selector '{selector}' failed: {e}")
                    continue
            
            data['currentPrice'] = price
            
            # Extract link with fallbacks
            link = None
            for selector in self.link_selectors:
                try:
                    elem = item.query_selector(selector)
                    if elem:
                        link = elem.get_attribute("href")
                        if link:
                            if not link.startswith("http"):
                                link = urljoin(self.working_base_url, link)
                            # Validate URL
                            if "daraz" in link.lower():
                                break
                except Exception as e:
                    logger.debug(f"Link selector '{selector}' failed: {e}")
                    continue
            
            if not link:
                logger.debug(f"Could not extract valid link for item {index}")
                return None
            
            data['url'] = link
            
            # Extract image with fallbacks (optional)
            image = None
            for selector in self.image_selectors:
                try:
                    elem = item.query_selector(selector)
                    if elem:
                        image = elem.get_attribute("src") or elem.get_attribute("data-src")
                        if image:
                            if not image.startswith("http"):
                                image = urljoin(self.working_base_url, image)
                            break
                except Exception as e:
                    logger.debug(f"Image selector '{selector}' failed: {e}")
                    continue
            
            data['imageUrl'] = image
            
            return data
            
        except Exception as e:
            logger.warning(f"Error extracting item {index}: {e}")
            return None

    def generate_search_urls(self, product_name):
        """Generate multiple search URL variations"""
        if not self.working_base_url:
            return []
            
        encoded_queries = [
            product_name.replace(' ', '+'),
            product_name.replace(' ', '%20'),
            product_name.replace(' ', '-')
        ]
        
        urls = []
        for query in encoded_queries:
            urls.extend([
                f"{self.working_base_url}/catalog/?q={query}&_keyori=ss&from=input",
                f"{self.working_base_url}/catalog/?q={query}&page=1",
                f"{self.working_base_url}/catalog/?q={query}",
                f"{self.working_base_url}/products/?q={query}",
                f"{self.working_base_url}/search/?q={query}"
            ])
        
        # Remove duplicates while preserving order
        seen = set()
        unique_urls = []
        for url in urls:
            if url not in seen:
                seen.add(url)
                unique_urls.append(url)
        
        return unique_urls

    def scrape_search_results_enhanced(self, product_name, debug_mode=False):
        """Enhanced search results scraping with better error handling"""
        # First check connectivity
        if not self.check_network_connectivity():
            logger.error("Network connectivity check failed")
            return []
        
        results = []
        
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=not debug_mode,
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-blink-features=AutomationControlled',
                    '--ignore-certificate-errors',
                    '--ignore-ssl-errors',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ]
            )
            
            page = self.setup_browser_page(browser)
            
            search_urls = self.generate_search_urls(product_name)
            
            for url_index, url in enumerate(search_urls[:8]):  # Try first 8 URLs
                try:
                    logger.info(f"Trying URL {url_index + 1}/{min(len(search_urls), 8)}: {url[:100]}...")
                    
                    # Navigate with retry mechanism
                    max_retries = 3
                    page_loaded = False
                    
                    for retry in range(max_retries):
                        try:
                            response = page.goto(url, timeout=30000, wait_until='networkidle')
                            if response and response.status == 200:
                                page_loaded = True
                                logger.info(f"✓ Page loaded successfully (attempt {retry + 1})")
                                break
                            else:
                                logger.warning(f"Got status {response.status if response else 'None'}, retry {retry + 1}")
                        except Exception as e:
                            logger.warning(f"Navigation attempt {retry + 1} failed: {str(e)[:100]}...")
                            if retry < max_retries - 1:
                                time.sleep(2 + retry)  # Increasing delay
                                continue
                            else:
                                break
                    
                    if not page_loaded:
                        logger.warning(f"Failed to load URL {url_index + 1} after {max_retries} attempts")
                        continue
                    
                    # Wait for page to stabilize
                    page.wait_for_timeout(3000)
                    
                    # Check if we got redirected or blocked
                    current_url = page.url
                    blocked_keywords = ['blocked', 'captcha', 'error', '404', 'forbidden', 'access-denied']
                    if any(keyword in current_url.lower() for keyword in blocked_keywords):
                        logger.warning(f"Detected blocking/error page: {current_url}")
                        if debug_mode:
                            with open(f'debug_blocked_{url_index}.html', 'w', encoding='utf-8') as f:
                                f.write(page.content())
                        continue
                    
                    # Try to find products using multiple strategies
                    items_found = False
                    items = []
                    
                    # Strategy 1: Wait for specific selectors
                    for selector_index, selector in enumerate(self.item_selectors):
                        try:
                            logger.info(f"Trying selector {selector_index + 1}: {selector}")
                            page.wait_for_selector(selector, timeout=8000)
                            items = page.query_selector_all(selector)
                            if items and len(items) > 0:
                                logger.info(f"✓ Found {len(items)} items with selector: {selector}")
                                items_found = True
                                break
                        except Exception as e:
                            logger.debug(f"Selector '{selector}' failed: {e}")
                            continue
                    
                    if not items_found:
                        # Strategy 2: Look for any product-like elements
                        generic_selectors = [
                            "div[class*='product']",
                            "div[class*='item']",
                            "a[href*='products']",
                            ".product",
                            ".item",
                            "div[data-*]",
                            "[class*='card']"
                        ]
                        
                        for selector in generic_selectors:
                            try:
                                items = page.query_selector_all(selector)
                                if items and len(items) > 2:  # At least a few items
                                    logger.info(f"✓ Found {len(items)} items with generic selector: {selector}")
                                    items_found = True
                                    break
                            except:
                                continue
                    
                    if not items_found:
                        logger.warning(f"No items found with URL {url_index + 1}")
                        if debug_mode:
                            # Save page content for debugging
                            with open(f'debug_page_{url_index}.html', 'w', encoding='utf-8') as f:
                                f.write(page.content())
                            logger.info(f"Debug: Saved page content to debug_page_{url_index}.html")
                        continue
                    
                    # Extract data from found items
                    successful_extractions = 0
                    for i, item in enumerate(items[:20]):  # Limit to first 20 items
                        try:
                            item_data = self.extract_item_data_with_fallbacks(item, i)
                            if item_data and item_data.get('name') and item_data.get('url'):
                                item_data['search_query'] = product_name
                                item_data['source_url'] = url
                                results.append(item_data)
                                successful_extractions += 1
                                logger.info(f"✓ Extracted: {item_data['name'][:60]}...")
                            
                            # Small delay to avoid being too aggressive
                            if i % 5 == 0:
                                time.sleep(0.2)
                                
                        except Exception as e:
                            logger.debug(f"Failed to extract item {i}: {e}")
                            continue
                    
                    logger.info(f"Successfully extracted {successful_extractions} products from URL {url_index + 1}")
                    
                    if successful_extractions > 0:
                        break  # Success with this URL, no need to try others
                        
                except Exception as e:
                    logger.error(f"Error with URL {url_index + 1}: {str(e)[:100]}...")
                    continue
            
            browser.close()
        
        logger.info(f"Total extraction completed: {len(results)} results")
        return results

    def scrape_product_details_enhanced(self, product_url, debug_mode=False):
        """Enhanced product details scraping"""
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=not debug_mode,
                args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
                      '--ignore-certificate-errors', '--ignore-ssl-errors']
            )
            
            page = self.setup_browser_page(browser)
            
            try:
                logger.info(f"Getting product details from: {product_url[:100]}...")
                response = page.goto(product_url, timeout=30000, wait_until='networkidle')
                if not response or response.status != 200:
                    logger.warning(f"Failed to load product page: {response.status if response else 'No response'}")
                    return None
                
                page.wait_for_timeout(3000)
                
                details = {}
                
                # Extract title
                title_selectors = [
                    self.selectors.get('product_name', "span.pdp-mod-product-badge-title"),
                    "span.pdp-mod-product-badge-title",
                    "h1[data-spm='product_title']",
                    "h1",
                    ".title",
                    "[class*='title']",
                    ".product-title"
                ]
                
                for selector in title_selectors:
                    try:
                        elem = page.query_selector(selector)
                        if elem and elem.text_content().strip():
                            details['name'] = elem.text_content().strip()
                            logger.info(f"✓ Found product title: {details['name'][:50]}...")
                            break
                    except:
                        continue
                else:
                    details['name'] = "Unknown Product"
                
                # Extract price
                price_selectors = [
                    self.selectors.get('product_dc_price', "div.pdp-mod-product-price span.pdp-price.pdp-price_type_normal.pdp-price_color_orange.pdp-price_size_xl"),
                    "div.pdp-mod-product-price span.pdp-price",
                    ".pdp-price",
                    ".price-current",
                    ".current-price",
                    "[class*='price']",
                    ".product-price"
                ]
                
                for selector in price_selectors:
                    try:
                        elem = page.query_selector(selector)
                        if elem:
                            price = self.extract_price(elem.text_content().strip())
                            if price:
                                details['currentPrice'] = price
                                logger.info(f"✓ Found price: Rs. {price}")
                                break
                    except:
                        continue
                else:
                    details['currentPrice'] = None
                
                # Extract image
                image_selectors = [
                    self.selectors.get('image_link', "img.pdp-mod-common-image.gallery-preview-panel__image"),
                    "img.pdp-mod-common-image",
                    ".gallery-preview-panel__image",
                    "img[src*='//']",
                    ".product-image img",
                    "img"
                ]
                
                for selector in image_selectors:
                    try:
                        img_elem = page.query_selector(selector)
                        if img_elem:
                            img_src = img_elem.get_attribute("src") or img_elem.get_attribute("data-src")
                            if img_src and len(img_src) > 10:
                                details['imageUrl'] = img_src if img_src.startswith('http') else urljoin(self.working_base_url, img_src)
                                logger.info("✓ Found product image")
                                break
                    except:
                        continue
                else:
                    details['imageUrl'] = None
                
                # Extract rating (bonus)
                try:
                    rating_elem = page.query_selector(".score-average, .rating, [class*='rating']")
                    if rating_elem:
                        rating_text = rating_elem.text_content().strip()
                        rating_match = re.search(r'(\d+\.?\d*)', rating_text)
                        if rating_match:
                            details['rating'] = float(rating_match.group(1))
                            logger.info(f"✓ Found rating: {details['rating']}")
                except:
                    details['rating'] = None
                
                # Add metadata
                details['url'] = product_url
                details['vendor'] = 'daraz'
                details['lastChecked'] = int(time.time() * 1000)
                details['description'] = ""
                details['category'] = "Unknown"
                
                return details
                
            except Exception as e:
                logger.error(f"Product details extraction failed for {product_url}: {str(e)[:100]}...")
                return None
            finally:
                browser.close()

    def find_best_match_enhanced(self, results, target_product):
        """Enhanced fuzzy matching with better scoring"""
        if not results:
            return None
        
        target_lower = target_product.lower().strip()
        target_words = set(target_lower.split())
        
        best_match = None
        best_score = 0
        
        logger.info(f"Finding best match for '{target_product}' among {len(results)} results...")
        
        for i, result in enumerate(results):
            if not result.get('name'):
                continue
                
            result_name = result['name'].lower().strip()
            result_words = set(result_name.split())
            
            # Multiple scoring methods
            scores = []
            
            # 1. Exact substring match (highest priority)
            if target_lower in result_name or result_name in target_lower:
                scores.append(95)
            
            # 2. Word overlap score
            common_words = target_words.intersection(result_words)
            if target_words and result_words:
                word_score = (len(common_words) / max(len(target_words), len(result_words))) * 100
                scores.append(word_score)
            
            # 3. Fuzzy string similarity
            fuzzy_score = fuzz.ratio(target_lower, result_name)
            scores.append(fuzzy_score)
            
            # 4. Partial ratio (for when one string is much longer)
            partial_score = fuzz.partial_ratio(target_lower, result_name)
            scores.append(partial_score)
            
            # 5. Token sort ratio (order-independent comparison)
            token_score = fuzz.token_sort_ratio(target_lower, result_name)
            scores.append(token_score)
            
            # Final score is weighted average with preference for exact matches
            if scores and scores[0] == 95:
                final_score = 95  # Exact match gets full score
            else:
                final_score = sum(scores) / len(scores) if scores else 0
            
            logger.debug(f"Result {i+1}: '{result_name[:50]}...' Score: {final_score:.1f}")
            
            if final_score > best_score:
                best_score = final_score
                best_match = result
        
        threshold = 25  # Lower threshold to be more inclusive
        if best_match and best_score > threshold:
            logger.info(f"✓ Best match found: '{best_match['name'][:60]}...' (score: {best_score:.1f})")
            return best_match
        elif results:
            logger.info("⚠ No good match found based on name similarity, returning first available result")
            return results[0]
        else:
            return None

    def store_in_db(self, product_data):
        """Store product in database"""
        try:
            result = self.collection.update_one(
                {'url': product_data['url']},
                {'$set': product_data},
                upsert=True
            )
            
            if result.upserted_id:
                logger.info(f"✓ Product inserted with ID: {result.upserted_id}")
            else:
                logger.info(f"✓ Product updated: {result.modified_count} document(s)")
                
        except Exception as e:
            logger.error(f"✗ Failed to store product: {e}")

    def scrape_daraz_enhanced(self, product_name, store_in_db=True, get_detailed_info=True, debug_mode=False):
        """Main enhanced scraping function with network diagnostics"""
        start_time = time.time()
        
        logger.info(f"🚀 Starting enhanced scraping for: '{product_name}'")
        
        if store_in_db:
            try:
                self.connect_mongodb()
            except:
                logger.error("Failed to connect to MongoDB")
                store_in_db = False

        try:
            # Step 1: Search for products
            logger.info("Step 1: Searching for products...")
            search_results = self.scrape_search_results_enhanced(product_name, debug_mode)
            
            if not search_results:
                logger.warning("✗ No search results found")
                return None
            
            search_time = time.time() - start_time
            logger.info(f"✓ Search completed in {search_time:.2f} seconds")
            
            # Step 2: Find best match
            logger.info("Step 2: Finding best match...")
            best_match = self.find_best_match_enhanced(search_results, product_name)
            if not best_match:
                logger.warning("✗ No suitable match found")
                return None
            
            # Step 3: Get detailed info if requested
            if get_detailed_info and best_match.get('url'):
                logger.info("Step 3: Getting detailed product information...")
                detailed_product = self.scrape_product_details_enhanced(best_match['url'], debug_mode)
                
                if detailed_product:
                    # Merge detailed info with search result, preferring detailed info
                    for key, value in detailed_product.items():
                        if value is not None and value != "":
                            best_match[key] = value
                    logger.info("✓ Product details merged successfully")
                else:
                    logger.warning("⚠ Could not get detailed product information, using search result data")
            
            # Step 4: Ensure required fields
            if 'vendor' not in best_match:
                best_match['vendor'] = 'daraz'
            if 'lastChecked' not in best_match:
                best_match['lastChecked'] = int(time.time() * 1000)
            
            # Step 5: Store in database if requested
            if store_in_db and self.collection:
                logger.info("Step 5: Storing in database...")
                self.store_in_db(best_match)
            
            total_time = time.time() - start_time
            logger.info(f"🎉 Enhanced scraping completed successfully in {total_time:.2f} seconds")
            
            return best_match
            
        except Exception as e:
            logger.error(f"✗ Enhanced scraping failed: {str(e)[:200]}...")
            if debug_mode:
                import traceback
                logger.error(f"Full traceback: {traceback.format_exc()}")
            return None
        finally:
            if self.client:
                self.client.close()

    def get_scraping_stats(self):
        """Get basic scraping statistics"""
        return {
            'working_base_url': self.working_base_url,
            'total_selectors': {
                'item_selectors': len(self.item_selectors),
                'name_selectors': len(self.name_selectors),
                'price_selectors': len(self.price_selectors),
                'link_selectors': len(self.link_selectors),
                'image_selectors': len(self.image_selectors)
            }
        }

# Convenience functions
def scrape_daraz_fast(product_name, debug_mode=False):
    """Fast scraper function - gets basic info quickly"""
    scraper = OptimizedDarazScraper()
    return scraper.scrape_daraz_enhanced(product_name, store_in_db=False, get_detailed_info=False, debug_mode=debug_mode)

def scrape_daraz_detailed(product_name, debug_mode=False):
    """Detailed scraper function - gets full info"""
    scraper = OptimizedDarazScraper()
    return scraper.scrape_daraz_enhanced(product_name, store_in_db=False, get_detailed_info=True, debug_mode=debug_mode)

def scrape_daraz(product_name, debug_mode=False):
    """Main function with balanced speed/detail"""
    scraper = OptimizedDarazScraper()
    return scraper.scrape_daraz_enhanced(product_name, store_in_db=False, get_detailed_info=True, debug_mode=debug_mode)

def test_connectivity():
    """Test function to check connectivity"""
    scraper = OptimizedDarazScraper()
    return scraper.check_network_connectivity()

def run_diagnostics():
    """Run comprehensive diagnostics"""
    logger.info("🔧 Running comprehensive diagnostics...")
    scraper = OptimizedDarazScraper()
    
    # Test basic connectivity
    connectivity_ok = scraper.check_network_connectivity()
    
    # Test ping
    ping_ok = scraper.test_with_ping()
    
    # Get stats
    stats = scraper.get_scraping_stats()
    
    return {
        'connectivity': connectivity_ok,
        'ping': ping_ok,
        'working_base_url': stats['working_base_url'],
        'selectors_loaded': stats['total_selectors']
    }

def scrape_daraz(query):
    try:
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        driver = webdriver.Chrome(options=chrome_options)
        
        url = f"https://www.daraz.pk/catalog/?q={query}"
        driver.get(url)
        
        products = []
        items = driver.find_elements(By.CSS_SELECTOR, '.gridItem')
        
        for item in items[:10]:
            try:
                product = {
                    'name': item.find_element(By.CSS_SELECTOR, '.title').text.strip(),
                    'price': item.find_element(By.CSS_SELECTOR, '.price').text.strip(),
                    'url': item.find_element(By.CSS_SELECTOR, 'a').get_attribute('href'),
                    'imageUrl': item.find_element(By.CSS_SELECTOR, 'img').get_attribute('src'),
                    'marketplace': 'Daraz'
                }
                # Only add products with valid data
                if product['name'] and product['price'] and product['url']:
                    products.append(product)
            except Exception as e:
                continue
                
        driver.quit()
        print(json.dumps({'products': products}, ensure_ascii=False))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        product_name = sys.argv[1]
        
        # Special commands
        if product_name == "--test-connection":
            print("🔧 Testing network connectivity...")
            result = test_connectivity()
            print("✓ Network connectivity test passed" if result else "✗ Network connectivity test failed")
            sys.exit()
        
        elif product_name == "--diagnostics":
            print("🔧 Running comprehensive diagnostics...")
            diagnostics = run_diagnostics()
            print(json.dumps(diagnostics, indent=2))
            sys.exit()
        
        elif product_name == "--help":
            print("🕷️  Enhanced Daraz Scraper - Help")
            print("=" * 50)
            print("BASIC USAGE:")
            print("  python scraper.py 'product name'                    # Normal scraping")
            print("  python scraper.py 'product name' --fast             # Fast mode (search only)")
            print("  python scraper.py 'product name' --debug            # Debug mode (visible browser)")
            print("")
            print("DIAGNOSTIC COMMANDS:")
            print("  python scraper.py --test-connection                 # Test connectivity")
            print("  python scraper.py --diagnostics                     # Full diagnostics")
            print("  python scraper.py --help                            # Show this help")
            print("")
            print("EXAMPLES:")
            print("  python scraper.py 'iphone 14 pro'")
            print("  python scraper.py 'samsung galaxy s23' --debug")
            print("  python scraper.py 'laptop dell' --fast")
            print("")
            print("TROUBLESHOOTING:")
            print("  1. Run --test-connection first")
            print("  2. Use --debug to see browser actions")
            print("  3. Check internet connection")
            print("  4. Try VPN if Daraz is blocked")
            print("=" * 50)
            sys.exit()
        
        # Check for flags
        fast_mode = "--fast" in sys.argv
        debug_mode = "--debug" in sys.argv
        
        try:
            scraper = OptimizedDarazScraper()
            
            if debug_mode:
                print("🐛 Debug mode - browser visible, debug info saved")
                result = scraper.scrape_daraz_enhanced(product_name, store_in_db=False, get_detailed_info=True, debug_mode=True)
            elif fast_mode:
                print("⚡ Fast mode - basic info only")
                result = scraper.scrape_daraz_enhanced(product_name, store_in_db=False, get_detailed_info=False, debug_mode=False)
            else:
                result = scraper.scrape_daraz_enhanced(product_name, store_in_db=False, get_detailed_info=True, debug_mode=False)
            
            if result:
                print(json.dumps(result, indent=2, ensure_ascii=False))
            else:
                print(json.dumps({"error": "No product found"}))
                
        except KeyboardInterrupt:
            print(json.dumps({"error": "Scraping interrupted by user"}))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    
    else:
        print("🕷️  Enhanced Daraz Scraper with Network Diagnostics")
        print("=" * 60)
        print("QUICK START:")
        print("  python scraper.py 'product name'        # Normal scraping")
        print("  python scraper.py --help                # Show detailed help")
        print("  python scraper.py --test-connection     # Test connectivity")
        print("")
        
        # Run automatic diagnostics on startup
        print("🔧 Running startup diagnostics...")
        try:
            diagnostics = run_diagnostics()
            
            if diagnostics['connectivity']:
                print("✅ Network: OK")
                if diagnostics['working_base_url']:
                    print(f"✅ Daraz URL: {diagnostics['working_base_url']}")
                
                # Quick scraping test
                print("🧪 Running quick test...")
                result = scrape_daraz_fast("iPhone 13")
                if result:
                    print(f"✅ Test successful: {result['name'][:50]}... - Rs. {result.get('currentPrice', 'N/A')}")
                    print("")
                    print("🎉 System ready! You can now scrape products.")
                    print("Example: python scraper.py 'iphone 14 pro'")
                else:
                    print("⚠️  Test completed but no products found")
                    print("This might be normal - try with different search terms")
            else:
                print("❌ Network connectivity issues detected")
                print("Run 'python scraper.py --test-connection' for detailed diagnostics")
                
        except Exception as e:
            print(f"⚠️  Startup test failed: {e}")
            print("Try running with --debug flag for more information")
