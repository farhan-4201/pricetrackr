import logging
import time
import re
import json
import sys
import requests
from bs4 import BeautifulSoup
from typing import Optional, Dict, List, Any
import os
from urllib.parse import urljoin, urlparse, quote

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AliExpressScraper:
    def __init__(self):
        # Initialize Crawlbase scraping
        self.crawlbase_token = os.getenv('CRAWLBASE_TOKEN')
        if not self.crawlbase_token:
            raise Exception("CRAWLBASE_TOKEN not found in environment")

    def fetch_crawlbase_html(self, url: str) -> str:
        """Fetch HTML content using Crawlbase API"""
        if not self.crawlbase_token:
            raise Exception("CRAWLBASE_TOKEN not found in environment")

        encoded_url = quote(url)
        crawlbase_url = f"https://api.crawlbase.com/scraper?token={self.crawlbase_token}&url={encoded_url}"

        try:
            response = requests.get(crawlbase_url, timeout=30000)
            if response.status_code != 200:
                raise Exception(f"Crawlbase API error: {response.status_code}")

            data = response.json()
            if not data.get('success'):
                raise Exception(f"Crawlbase scraping failed: {data.get('status')}")

            return data.get('body', '')
        except requests.Timeout:
            raise Exception("Crawlbase request timed out")
        except Exception as e:
            raise Exception(f"Crawlbase error: {str(e)}")

    def scrape_products(self, query: str, max_results: int = 10) -> Dict[str, Any]:
        """Main scraping method using Crawlbase API"""
        if not query.strip():
            return {"products": [], "error": "Query cannot be empty"}

        try:
            # Construct search URL
            search_query = query.replace(' ', '+')
            url = f"https://www.aliexpress.com/wholesale?SearchText={search_query}&page=1"

            print(f"Fetching URL via Crawlbase: {url}")
            html_content = self.fetch_crawlbase_html(url)

            if not html_content or len(html_content) < 1000:
                return {"products": [], "error": "Failed to fetch content from AliExpress"}

            # Simple extraction without complex dependencies
            soup = BeautifulSoup(html_content, 'html.parser')
            products = []

            # Look for product cards using common AliExpress selectors
            product_selectors = [
                "[data-spm='CateList'] a[href*='/item/']",
                ".product-item a[href*='/item/']",
                ".card-product a[href*='/item/']",
                "[data-title] a[href*='/item/']",
                ".search-item-card-wrapper a[href*='/item/']"
            ]

            found_elements = []
            for selector in product_selectors:
                elements = soup.select(selector)
                if elements:
                    found_elements.extend(elements[:max_results])
                    if len(found_elements) >= max_results:
                        break

            print(f"Found {len(found_elements)} product elements")

            for element in found_elements[:max_results]:
                try:
                    # Extract title
                    title = element.get('title') or element.get_text(strip=True)
                    if not title or len(title) < 5:
                        continue

                    # Extract URL
                    href = element.get('href')
                    if not href:
                        continue
                    if not href.startswith('http'):
                        href = 'https://www.aliexpress.com' + href

                    # Extract price from siblings/parents
                    price = "N/A"
                    parent = element.parent
                    price_elem = None

                    # Look for price in nearby elements
                    if parent:
                        price_elem = parent.find(attrs={'data-price': True})
                        if not price_elem:
                            price_elem = parent.find(class_=lambda x: x and ('price' in x.lower() or 'cost' in x.lower()))

                    if price_elem:
                        price = price_elem.get_text(strip=True)
                        if not price:
                            price = price_elem.get('data-price', 'N/A')

                    # Extract image
                    img_elem = element.find('img')
                    if img_elem:
                        img_url = img_elem.get('src') or img_elem.get('data-src')
                        if img_url and not img_url.startswith('http'):
                            img_url = 'https:' + img_url if img_url.startswith('//') else f"https:{img_url}"
                    else:
                        img_url = None

                    product = {
                        'name': title[:100],  # Limit title length
                        'price': price if price != "N/A" else None,
                        'url': href,
                        'imageUrl': img_url,
                        'marketplace': 'aliexpress',
                        'source': 'crawler'
                    }

                    # Only add if we have essential fields
                    if product['name'] and product['url']:
                        products.append(product)
                        print(f"✓ Extracted: {title[:50]}...")

                except Exception as e:
                    print(f"Error extracting product: {e}")
                    continue

            print(f"Successfully scraped {len(products)} products from AliExpress")
            return {
                "products": products,
                "query": query,
                "total_found": len(products),
                "source": "aliexpress_crawler"
            }

        except Exception as e:
            print(f"AliExpress scraping error: {str(e)}")
            return {"products": [], "error": str(e)}

def scrape_aliexpress_products(query: str, max_results: int = 10) -> Dict[str, Any]:
    """
    Public function to scrape AliExpress products
    """
    try:
        scraper = AliExpressScraper()
        return scraper.scrape_products(query, max_results)
    except Exception as e:
        return {"products": [], "error": f"Scraping setup failed: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "No product name provided",
            "usage": "python scraper.py 'product name'"
        }))
        sys.exit(1)

    product_name = sys.argv[1]

    try:
        result = scrape_aliexpress_products(product_name)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except KeyboardInterrupt:
        print(json.dumps({"error": "Interrupted by user"}))
    except Exception as e:
        print(json.dumps({"error": f"Unexpected error: {str(e)}"}))
