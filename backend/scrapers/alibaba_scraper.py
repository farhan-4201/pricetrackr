"""
Advanced Alibaba Web Scraper with Free CAPTCHA Handling
Author: AI Assistant
Date: 2023-11-15
Description: Robust web scraping solution for Alibaba with free CAPTCHA handling methods
"""

import sys
import time
import random
import logging
import argparse
import json
import base64
import requests
import speech_recognition as sr
from typing import List, Dict, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
from urllib.parse import quote, urljoin, urlparse
from io import BytesIO

# Third-party imports
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException, 
    NoSuchElementException, 
    ElementClickInterceptedException,
    WebDriverException,
    StaleElementReferenceException
)
from webdriver_manager.chrome import ChromeDriverManager
import undetected_chromedriver as uc
from fake_useragent import UserAgent
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("alibaba_scraper.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("AlibabaScraper")

class ScraperState(Enum):
    IDLE = "idle"
    SCRAPING = "scraping"
    BLOCKED = "blocked"
    CAPTCHA = "captcha"
    ERROR = "error"

@dataclass
class ScraperConfig:
    headless: bool = True
    max_products: int = 50
    max_retries: int = 3
    timeout: int = 30
    delay_min: float = 1.0
    delay_max: float = 3.0
    page_load_timeout: int = 60
    proxy_list: List[str] = None
    use_proxy_rotation: bool = False
    use_user_agent_rotation: bool = True
    solve_captchas: bool = True  # Enable free CAPTCHA solving methods
    captcha_timeout: int = 60  # Timeout for CAPTCHA solving in seconds
    avoid_captcha: bool = True  # Use techniques to avoid CAPTCHAs

@dataclass
class ProductData:
    title: str
    price: str
    min_order: str
    seller_name: str
    seller_rating: str
    seller_years: str
    response_rate: str
    link: str
    image_url: str
    description: str = ""

class FreeCaptchaSolver:
    """Class to handle CAPTCHA solving using free methods"""
    
    def __init__(self, timeout: int = 60):
        self.timeout = timeout
        self.recognizer = sr.Recognizer()
        
    def solve_recaptcha_v2(self, driver, site_key: str) -> bool:
        """
        Attempt to solve reCAPTCHA v2 using free methods
        This is challenging but we can try to use audio challenge
        """
        try:
            # Switch to reCAPTCHA iframe
            recaptcha_iframe = driver.find_element(
                By.CSS_SELECTOR, 
                "iframe[src*='recaptcha'], iframe[title*='recaptcha']"
            )
            driver.switch_to.frame(recaptcha_iframe)
            
            # Click on the audio challenge button
            audio_button = driver.find_element(By.ID, "recaptcha-audio-button")
            audio_button.click()
            
            # Wait for audio challenge to load
            time.sleep(2)
            
            # Get the audio source
            audio_src = driver.find_element(By.ID, "audio-source").get_attribute("src")
            
            # Download the audio
            response = requests.get(audio_src)
            audio_data = BytesIO(response.content)
            
            # Use speech recognition to convert audio to text
            with sr.AudioFile(audio_data) as source:
                audio = self.recognizer.record(source)
                
            try:
                text = self.recognizer.recognize_google(audio)
                
                # Input the text
                audio_response = driver.find_element(By.ID, "audio-response")
                audio_response.send_keys(text)
                
                # Verify
                verify_button = driver.find_element(By.ID, "recaptcha-verify-button")
                verify_button.click()
                
                # Switch back to main content
                driver.switch_to.default_content()
                
                logger.info("reCAPTCHA solved using audio challenge")
                return True
                
            except sr.UnknownValueError:
                logger.error("Could not understand audio")
            except sr.RequestError as e:
                logger.error(f"Speech recognition error: {e}")
                
            # Switch back to main content
            driver.switch_to.default_content()
            return False
            
        except Exception as e:
            logger.error(f"Error solving reCAPTCHA v2: {e}")
            # Ensure we switch back to main content
            try:
                driver.switch_to.default_content()
            except:
                pass
            return False
    
    def solve_image_captcha(self, driver) -> bool:
        """Solve image-based CAPTCHA using OCR"""
        try:
            # Find the CAPTCHA image
            captcha_image = driver.find_element(
                By.CSS_SELECTOR, 
                "img[src*='captcha'], img[alt*='captcha'], #captcha-img, .captcha-img"
            )
            
            # Get the image location and size
            location = captcha_image.location
            size = captcha_image.size
            
            # Take screenshot of the CAPTCHA
            driver.save_screenshot("screenshot.png")
            
            # Open screenshot and crop to CAPTCHA
            image = Image.open("screenshot.png")
            left = location['x']
            top = location['y']
            right = location['x'] + size['width']
            bottom = location['y'] + size['height']
            
            image = image.crop((left, top, right, bottom))
            
            # Enhance image for better OCR
            image = image.convert('L')  # Convert to grayscale
            image = image.filter(ImageFilter.MedianFilter())  # Apply filter to remove noise
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(2)  # Enhance contrast
            
            # Use Tesseract OCR to read the CAPTCHA
            custom_config = r'--oem 3 --psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            text = pytesseract.image_to_string(image, config=custom_config).strip()
            
            if not text:
                logger.error("Could not read CAPTCHA text")
                return False
            
            # Find the input field and enter the solution
            captcha_input = driver.find_element(
                By.CSS_SELECTOR, 
                "input[name*='captcha'], #captcha, .captcha-input"
            )
            captcha_input.clear()
            captcha_input.send_keys(text)
            
            # Find and click the submit button
            submit_button = driver.find_element(
                By.CSS_SELECTOR, 
                "input[type='submit'], button[type='submit']"
            )
            submit_button.click()
            
            logger.info(f"Image CAPTCHA solved with text: {text}")
            return True
            
        except Exception as e:
            logger.error(f"Error solving image CAPTCHA: {e}")
            return False
    
    def bypass_cloudflare(self, driver) -> bool:
        """Attempt to bypass Cloudflare protection"""
        try:
            # Check if we're on a Cloudflare challenge page
            if "challenge" in driver.current_url or "cloudflare" in driver.page_source.lower():
                logger.warning("Cloudflare protection detected, attempting to bypass")
                
                # Wait for the challenge to load
                time.sleep(5)
                
                # Look for the challenge form and submit it
                challenge_form = driver.find_elements(By.TAG_NAME, "form")
                if challenge_form:
                    challenge_form[0].submit()
                    time.sleep(3)
                    return True
                    
            return False
        except Exception as e:
            logger.error(f"Error bypassing Cloudflare: {e}")
            return False

class AdvancedAlibabaScraper:
    """Advanced web scraper for Alibaba with anti-blocking mechanisms and free CAPTCHA handling"""
    
    def __init__(self, config: ScraperConfig):
        self.config = config
        self.state = ScraperState.IDLE
        self.driver = None
        self.current_proxy = None
        self.current_user_agent = None
        self.retry_count = 0
        self.scraped_count = 0
        self.failed_count = 0
        self.proxy_index = 0
        self.session_start_time = time.time()
        
        # Initialize CAPTCHA solver
        self.captcha_solver = FreeCaptchaSolver(config.captcha_timeout) if config.solve_captchas else None
        
        # Initialize user agent generator
        self.ua_generator = UserAgent()
        
        # Initialize proxy list if provided
        if config.proxy_list is None:
            config.proxy_list = []
        
        logger.info("Initializing AdvancedAlibabaScraper with config: %s", config)
        self._init_driver()
    
def _init_driver(self) -> None:
    """Initialize the Chrome driver with advanced options to avoid detection"""
    try:
        chrome_options = Options()
        
        # Basic options to avoid detection
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-infobars")
        chrome_options.add_argument("--remote-debugging-port=9222")
        
        # Add more stealth options
        chrome_options.add_argument("--disable-web-security")
        chrome_options.add_argument("--allow-running-insecure-content")
        chrome_options.add_argument("--disable-notifications")
        chrome_options.add_argument("--disable-popup-blocking")
        
        # Headless mode if configured
        if self.config.headless:
            chrome_options.add_argument("--headless=new")
        
        # User agent rotation
        if self.config.use_user_agent_rotation:
            self.current_user_agent = self.ua_generator.random
            chrome_options.add_argument(f"--user-agent={self.current_user_agent}")
            logger.info("Using user agent: %s", self.current_user_agent)
        
        # Proxy configuration
        if self.config.use_proxy_rotation and self.config.proxy_list:
            self.current_proxy = self._get_next_proxy()
            chrome_options.add_argument(f"--proxy-server={self.current_proxy}")
            logger.info("Using proxy: %s", self.current_proxy)
        
        # Try using undetected-chromedriver first
        try:
            # For undetected-chromedriver, we need to use a different approach
            self.driver = uc.Chrome(
                headless=self.config.headless,
                use_subprocess=True,  # This might help with the options issue
                version_main=114  # Try to match your Chrome version
            )
        except Exception as e:
            logger.warning("Failed to initialize undetected-chromedriver: %s. Falling back to standard driver.", e)
            # For standard driver, we can add the excludeSwitches option
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            
            self.driver = webdriver.Chrome(
                service=Service(ChromeDriverManager().install()),
                options=chrome_options
            )
        
        # Set page load timeout
        self.driver.set_page_load_timeout(self.config.page_load_timeout)
        
        # Execute CDP commands to avoid detection
        self.driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": """
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                })
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                })
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en']
                })
                window.chrome = {
                    runtime: {},
                }
            """
        })
        
        # Set window size to mimic human
        self.driver.set_window_size(random.randint(1200, 1920), random.randint(800, 1080))
        
        logger.info("WebDriver initialized successfully")
        
    except Exception as e:
        logger.error("Failed to initialize WebDriver: %s", e)
        raise
    
    def _get_next_proxy(self) -> str:
        """Get the next proxy from the proxy list"""
        if not self.config.proxy_list:
            return None
        
        proxy = self.config.proxy_list[self.proxy_index]
        self.proxy_index = (self.proxy_index + 1) % len(self.config.proxy_list)
        return proxy
    
    def _human_like_delay(self) -> None:
        """Add a random delay between actions to mimic human behavior"""
        # Vary delay based on action type
        delay = random.uniform(self.config.delay_min, self.config.delay_max)
        
        # Add occasional longer pauses
        if random.random() < 0.1:  # 10% chance
            delay += random.uniform(2, 5)
            
        logger.debug("Waiting for %.2f seconds", delay)
        time.sleep(delay)
    
    def _human_like_mouse_movement(self, element):
        """Simulate human-like mouse movement to an element"""
        try:
            # Get element location
            location = element.location_once_scrolled_into_view
            
            # Generate random movement path
            actions = webdriver.ActionChains(self.driver)
            
            # Move to a random position first
            random_x = random.randint(0, 300)
            random_y = random.randint(0, 300)
            actions.move_by_offset(random_x, random_y)
            
            # Move to the element with slight overshoot
            actions.move_to_element_with_offset(
                element, 
                random.randint(-5, 5), 
                random.randint(-5, 5)
            )
            
            # Perform the actions
            actions.perform()
            
        except Exception as e:
            logger.debug("Error simulating mouse movement: %s", e)
            # Fallback to simple click
            element.click()
    
    def _wait_for_element(self, by: By, selector: str, timeout: int = None) -> Any:
        """Wait for an element to be present with explicit wait"""
        if timeout is None:
            timeout = self.config.timeout
            
        try:
            return WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by, selector))
            )
        except TimeoutException:
            logger.warning("Timeout waiting for element: %s", selector)
            return None
    
    def _wait_for_elements(self, by: By, selector: str, timeout: int = None) -> List[Any]:
        """Wait for multiple elements to be present"""
        if timeout is None:
            timeout = self.config.timeout
            
        try:
            return WebDriverWait(self.driver, timeout).until(
                EC.presence_of_all_elements_located((by, selector))
            )
        except TimeoutException:
            logger.warning("Timeout waiting for elements: %s", selector)
            return []
    
    def _is_blocked(self) -> bool:
        """Check if the scraper is being blocked by Alibaba"""
        try:
            # Check for common blocking indicators
            page_source = self.driver.page_source.lower()
            blocking_indicators = [
                "captcha", "security check", "access denied", 
                "blocked", "robot", "unusual traffic", "verification",
                "distil", "incapsula", "cloudflare"
            ]
            
            for indicator in blocking_indicators:
                if indicator in page_source:
                    logger.warning("Blocking detected: %s", indicator)
                    return True
                    
            # Check for specific Alibaba blocking elements
            blocking_elements = [
                "div.secs-container",  # Alibaba security check
                "div.verify-bar",      # Verification bar
                "div.captcha-container",
                "iframe[src*='recaptcha']"
            ]
            
            for element in blocking_elements:
                if self.driver.find_elements(By.CSS_SELECTOR, element):
                    logger.warning("Blocking element detected: %s", element)
                    return True
                    
            return False
            
        except Exception as e:
            logger.error("Error checking if blocked: %s", e)
            return False
    
    def _has_captcha(self) -> Tuple[bool, Optional[str]]:
        """Check if there's a CAPTCHA challenge and return its type"""
        try:
            # Check for reCAPTCHA
            recaptcha_elements = self.driver.find_elements(By.CSS_SELECTOR, ".g-recaptcha, iframe[src*='recaptcha']")
            if recaptcha_elements:
                # Try to extract site key
                site_key = None
                for element in recaptcha_elements:
                    data_sitekey = element.get_attribute("data-sitekey")
                    if data_sitekey:
                        site_key = data_sitekey
                        break
                
                logger.warning("reCAPTCHA detected")
                return True, "recaptcha", site_key
            
            # Check for image CAPTCHA
            captcha_image_elements = self.driver.find_elements(
                By.CSS_SELECTOR, 
                "img[src*='captcha'], img[alt*='captcha'], #captcha-img, .captcha-img"
            )
            
            if captcha_image_elements:
                logger.warning("Image CAPTCHA detected")
                return True, "image", None
            
            # Check for Cloudflare protection
            if "challenge" in self.driver.current_url or "cloudflare" in self.driver.page_source.lower():
                logger.warning("Cloudflare protection detected")
                return True, "cloudflare", None
            
            return False, None, None
            
        except Exception as e:
            logger.error("Error checking for CAPTCHA: %s", e)
            return False, None, None
    
    def _avoid_captcha_techniques(self) -> None:
        """Use various techniques to avoid triggering CAPTCHAs"""
        if not self.config.avoid_captcha:
            return
            
        try:
            # Limit request rate
            current_time = time.time()
            elapsed = current_time - self.session_start_time
            
            # If we're making requests too quickly, slow down
            if elapsed < 30 and self.scraped_count > 10:  # More than 10 requests in 30 seconds
                sleep_time = random.uniform(5, 15)
                logger.info(f"Slowing down to avoid detection. Sleeping for {sleep_time:.1f} seconds")
                time.sleep(sleep_time)
                
            # Vary user behavior patterns
            if random.random() < 0.3:  # 30% chance
                # Scroll randomly
                scroll_height = random.randint(200, 800)
                self.driver.execute_script(f"window.scrollBy(0, {scroll_height});")
                self._human_like_delay()
                
            # Occasionally simulate going back
            if random.random() < 0.1 and len(self.driver.window_handles) > 1:  # 10% chance
                self.driver.back()
                self._human_like_delay()
                self.driver.forward()
                
        except Exception as e:
            logger.debug("Error in avoid CAPTCHA techniques: %s", e)
    
    def _handle_captcha(self) -> bool:
        """Handle CAPTCHA challenges using free methods"""
        logger.warning("CAPTCHA detected. Attempting to handle with free methods...")
        
        if not self.config.solve_captchas or not self.captcha_solver:
            logger.error("CAPTCHA solving is disabled or not configured")
            return False
        
        # Check what type of CAPTCHA we're dealing with
        has_captcha, captcha_type, site_key = self._has_captcha()
        
        if not has_captcha:
            logger.warning("No CAPTCHA found despite detection")
            # Try to refresh the page
            try:
                self.driver.refresh()
                self._human_like_delay()
                return not self._is_blocked()
            except:
                return False
        
        try:
            if captcha_type == "recaptcha" and site_key:
                return self.captcha_solver.solve_recaptcha_v2(self.driver, site_key)
            elif captcha_type == "image":
                return self.captcha_solver.solve_image_captcha(self.driver)
            elif captcha_type == "cloudflare":
                return self.captcha_solver.bypass_cloudflare(self.driver)
            else:
                logger.error(f"Unsupported CAPTCHA type: {captcha_type}")
                # Fallback: refresh the page
                self.driver.refresh()
                self._human_like_delay()
                return not self._is_blocked()
                
        except Exception as e:
            logger.error(f"Error handling {captcha_type} CAPTCHA: {e}")
            # Fallback: refresh the page
            try:
                self.driver.refresh()
                self._human_like_delay()
                return not self._is_blocked()
            except:
                return False
    
    def _scrape_product_listing_page(self, url: str) -> List[ProductData]:
        """Scrape a product listing page and extract product data"""
        products = []
        
        try:
            logger.info("Scraping product listing page: %s", url)
            self.driver.get(url)
            self._human_like_delay()
            
            # Use techniques to avoid CAPTCHAs
            self._avoid_captcha_techniques()
            
            # Check if blocked
            if self._is_blocked():
                self.state = ScraperState.BLOCKED
                if not self._handle_captcha():
                    logger.error("Failed to bypass blocking")
                    return products
                self.state = ScraperState.SCRAPING
            
            # Wait for products to load
            product_selector = "div.list-no-v2-outter.J-offer-wrapper, .organic-list .list-item, .item-main"
            product_elements = self._wait_for_elements(By.CSS_SELECTOR, product_selector, 20)
            
            if not product_elements:
                logger.warning("No product elements found on page")
                return products
            
            logger.info("Found %d product elements", len(product_elements))
            
            # Extract data from each product element
            for i, product_element in enumerate(product_elements):
                try:
                    # Scroll element into view with human-like behavior
                    self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", product_element)
                    self._human_like_delay()
                    
                    # Extract product data
                    product_data = self._extract_product_data(product_element)
                    if product_data:
                        products.append(product_data)
                        self.scraped_count += 1
                        logger.info("Scraped product %d: %s", self.scraped_count, product_data.title[:50] + "..." if len(product_data.title) > 50 else product_data.title)
                    
                    # Check if we've reached the maximum products
                    if self.scraped_count >= self.config.max_products:
                        logger.info("Reached maximum products limit (%d)", self.config.max_products)
                        break
                        
                except Exception as e:
                    self.failed_count += 1
                    logger.error("Error scraping product %d: %s", i, e)
                    continue
            
        except Exception as e:
            logger.error("Error scraping product listing page: %s", e)
        
        return products
    
    def _extract_product_data(self, product_element: Any) -> Optional[ProductData]:
        """Extract product data from a product element"""
        try:
            # Extract title
            title_element = product_element.find_element(By.CSS_SELECTOR, "h2.title a, .title a, .item-title a")
            title = title_element.text.strip()
            link = title_element.get_attribute("href")
            
            # Extract price
            price_element = product_element.find_element(By.CSS_SELECTOR, ".price, .price-value, .item-price")
            price = price_element.text.strip()
            
            # Extract minimum order
            min_order = ""
            try:
                min_order_element = product_element.find_element(By.CSS_SELECTOR, ".min-order, .moq, .min-order-amount")
                min_order = min_order_element.text.strip()
            except NoSuchElementException:
                pass
            
            # Extract seller information
            seller_name = ""
            seller_rating = ""
            seller_years = ""
            response_rate = ""
            
            try:
                seller_element = product_element.find_element(By.CSS_SELECTOR, ".company-name, .supplier-name, .seller-name")
                seller_name = seller_element.text.strip()
            except NoSuchElementException:
                pass
                
            try:
                rating_element = product_element.find_element(By.CSS_SELECTOR, ".supplier-level, .seller-level, .rating")
                seller_rating = rating_element.text.strip()
            except NoSuchElementException:
                pass
                
            try:
                years_element = product_element.find_element(By.CSS_SELECTOR, ".years, .gold-supplier-years")
                seller_years = years_element.text.strip()
            except NoSuchElementException:
                pass
                
            try:
                response_element = product_element.find_element(By.CSS_SELECTOR, ".response-rate, .response-rate-value")
                response_rate = response_element.text.strip()
            except NoSuchElementException:
                pass
            
            # Extract image URL
            image_url = ""
            try:
                image_element = product_element.find_element(By.CSS_SELECTOR, "img, .image, .product-image")
                image_url = image_element.get_attribute("src")
                if not image_url or image_url.startswith("data:image"):
                    image_url = image_element.get_attribute("data-src")
            except NoSuchElementException:
                pass
            
            return ProductData(
                title=title,
                price=price,
                min_order=min_order,
                seller_name=seller_name,
                seller_rating=seller_rating,
                seller_years=seller_years,
                response_rate=response_rate,
                link=link,
                image_url=image_url
            )
            
        except Exception as e:
            logger.error("Error extracting product data: %s", e)
            return None
    
    def search_products(self, query: str, max_products: int = None) -> List[ProductData]:
        """Search for products on Alibaba based on a query"""
        if max_products is not None:
            self.config.max_products = max_products
            
        self.state = ScraperState.SCRAPING
        self.scraped_count = 0
        self.failed_count = 0
        self.session_start_time = time.time()
        
        products = []
        encoded_query = quote(query)
        search_url = f"https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&SearchText={encoded_query}"
        
        try:
            # Scrape the first page of results
            page_products = self._scrape_product_listing_page(search_url)
            products.extend(page_products)
            
            # If we need more products, try to paginate
            if self.scraped_count < self.config.max_products:
                try:
                    next_page_btn = self._wait_for_element(
                        By.CSS_SELECTOR, 
                        ".next, .next-page, a.next"
                    )
                    
                    if next_page_btn and next_page_btn.is_enabled():
                        logger.info("Moving to next page of results")
                        # Use human-like interaction for clicking
                        self._human_like_mouse_movement(next_page_btn)
                        self._human_like_delay()
                        
                        # Scrape the next page
                        next_page_products = self._scrape_product_listing_page(self.driver.current_url)
                        products.extend(next_page_products)
                except Exception as e:
                    logger.warning("Could not navigate to next page: %s", e)
            
            logger.info("Successfully scraped %d products (%d failed)", self.scraped_count, self.failed_count)
            
        except Exception as e:
            logger.error("Error during product search: %s", e)
            self.state = ScraperState.ERROR
        
        self.state = ScraperState.IDLE
        return products
    
    def close(self):
        """Clean up resources"""
        if self.driver:
            self.driver.quit()
            logger.info("WebDriver closed")

def load_proxies_from_file(file_path: str) -> List[str]:
    """Load proxies from a file"""
    proxies = []
    try:
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    proxies.append(line)
        logger.info("Loaded %d proxies from %s", len(proxies), file_path)
    except Exception as e:
        logger.error("Error loading proxies from file: %s", e)
    return proxies

def get_free_proxies():
    """Get a list of free proxies from online sources"""
    proxies = []
    try:
        # Example free proxy source (you might want to use more reliable sources)
        response = requests.get("https://www.proxy-list.download/api/v1/get?type=http", timeout=10)
        if response.status_code == 200:
            proxies = response.text.strip().split('\r\n')
            logger.info("Retrieved %d free proxies", len(proxies))
    except Exception as e:
        logger.error("Error retrieving free proxies: %s", e)
    
    return proxies

def main():
    """Main function to run the scraper"""
    parser = argparse.ArgumentParser(description="Advanced Alibaba Product Scraper with Free CAPTCHA Handling")
    parser.add_argument("--query", type=str, default="electronics", help="Search query")
    parser.add_argument("--max-products", type=int, default=20, help="Maximum number of products to scrape")
    parser.add_argument("--headless", action="store_true", default=True, help="Run browser in headless mode")
    parser.add_argument("--proxy-file", type=str, help="Path to file containing proxies")
    parser.add_argument("--free-proxies", action="store_true", help="Use free proxies from online sources")
    parser.add_argument("--output", type=str, default="products.json", help="Output file path")
    parser.add_argument("--avoid-captcha", action="store_true", default=True, help="Use techniques to avoid CAPTCHAs")
    
    args = parser.parse_args()
    
    # Load proxies if provided
    proxies = []
    if args.proxy_file:
        proxies = load_proxies_from_file(args.proxy_file)
    elif args.free_proxies:
        proxies = get_free_proxies()
    
    # Configure scraper
    config = ScraperConfig(
        headless=args.headless,
        max_products=args.max_products,
        use_proxy_rotation=bool(proxies),
        proxy_list=proxies,
        solve_captchas=True,  # Enable free CAPTCHA solving
        avoid_captcha=args.avoid_captcha
    )
    
    # Initialize scraper
    scraper = AdvancedAlibabaScraper(config)
    
    try:
        # Search for products
        products = scraper.search_products(args.query, args.max_products)
        
        # Convert products to JSON-serializable format
        products_data = []
        for product in products:
            products_data.append({
                "title": product.title,
                "price": product.price,
                "min_order": product.min_order,
                "seller_name": product.seller_name,
                "seller_rating": product.seller_rating,
                "seller_years": product.seller_years,
                "response_rate": product.response_rate,
                "link": product.link,
                "image_url": product.image_url,
                "description": product.description
            })
        
        # Save results to file
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(products_data, f, ensure_ascii=False, indent=2)
        
        logger.info("Results saved to %s", args.output)
        
        # Print summary
        print(f"\nScraping completed!")
        print(f"Products found: {len(products)}")
        print(f"Output file: {args.output}")
        
    except Exception as e:
        logger.error("Fatal error during scraping: %s", e)
    finally:
        scraper.close()

if __name__ == "__main__":
    # Install required packages for free CAPTCHA solving
    # pip install speechrecognition pytesseract pillow
    
    main()