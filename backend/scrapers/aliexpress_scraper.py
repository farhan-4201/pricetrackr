import asyncio
import json
import os
import random
import requests
import pandas as pd
import re
from typing import List, Dict, Optional
from pydantic import BaseModel
from openai import OpenAI
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, ProxyConfig, RoundRobinProxyStrategy
from bs4 import BeautifulSoup
import time

class Product(BaseModel):
    title: str
    price: str
    image: str
    link: str
    rating: Optional[str] = None
    orders: Optional[str] = None

class AliExpressScraper:
    def __init__(self):
        self.client = OpenAI(
            base_url="https://api.deepseek.com", 
            api_key=os.getenv("DEEPSEEK_API_KEY")
        )
        self.model = "deepseek-r1"
        
    def fetch_proxies(self) -> List[str]:
        """Fetch working proxies from multiple sources"""
        proxy_sources = [
            "https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=http&country=all&anonymity=all&timeout=10000&format=text",
            "https://www.proxy-list.download/api/v1/get?type=http",
        ]
        
        proxies = []
        for source in proxy_sources:
            try:
                print(f"Fetching proxies from: {source}")
                response = requests.get(source, timeout=10)
                if response.status_code == 200:
                    potential_proxies = [
                        p.strip() for p in response.text.splitlines() 
                        if p.strip() and ':' in p and self._is_valid_proxy_format(p.strip())
                    ]
                    proxies.extend(potential_proxies)
                    print(f"Found {len(potential_proxies)} potential proxies from this source")
            except Exception as e:
                print(f"Failed to fetch from {source}: {e}")
                continue
                
        unique_proxies = list(set(proxies))
        print(f"Total unique proxies found: {len(unique_proxies)}")
        return unique_proxies
    
    def _is_valid_proxy_format(self, proxy: str) -> bool:
        """Validate proxy format (IP:PORT)"""
        parts = proxy.split(':')
        if len(parts) != 2:
            return False
        
        try:
            ip_parts = parts[0].split('.')
            if len(ip_parts) != 4:
                return False
            
            for part in ip_parts:
                if not 0 <= int(part) <= 255:
                    return False
                    
            port = int(parts[1])
            if not 1 <= port <= 65535:
                return False
                
            return True
        except ValueError:
            return False
    
    def test_proxy(self, proxy_str: str) -> bool:
        """Test if a proxy is working"""
        proxy = f"http://{proxy_str}"
        try:
            response = requests.get(
                "http://httpbin.org/ip", 
                proxies={"http": proxy, "https": proxy}, 
                timeout=5
            )
            return response.status_code == 200
        except:
            return False
    
    def extract_product_elements(self, html: str) -> List[Dict]:
        """Extract product elements from HTML using dynamic selector discovery"""
        soup = BeautifulSoup(html, 'html.parser')
        
        print("🔍 Analyzing HTML structure for product containers...")
        
        # Look for common AliExpress patterns in the HTML
        product_containers = []
        
        # Strategy 1: Find elements with price-related content
        print("Strategy 1: Looking for price-related elements...")
        price_elements = soup.find_all(text=lambda t: t and ('
    
    def extract_products_with_ai(self, extracted_data: List[Dict]) -> Dict:
        """Use DeepSeek R1 to extract structured product data"""
        if not extracted_data:
            return {"products": []}
        
        print(f"🤖 Processing {len(extracted_data)} containers with DeepSeek R1...")
        
        # Process in smaller batches to avoid token limits
        all_products = []
        batch_size = 8  # Process 8 containers at a time
        
        for i in range(0, len(extracted_data), batch_size):
            batch = extracted_data[i:i+batch_size]
            print(f"Processing batch {i//batch_size + 1}/{(len(extracted_data)-1)//batch_size + 1} ({len(batch)} items)")
            
            # Prepare a more focused prompt for the batch
            system_prompt = """
You are an expert at extracting AliExpress product information from HTML containers.

Your task: Extract product details and return ONLY a valid JSON object with this structure:
{
  "products": [
    {
      "title": "Clean product name without extra characters",
      "price": "Price with currency (e.g., '$29.99', 'US $15.30')",
      "image": "Full image URL (must start with http/https)",
      "link": "Full product URL (must start with http/https)",
      "rating": "Rating if available (e.g., '4.5', '4.8 stars')",
      "orders": "Order count if available (e.g., '1000+ sold', '50 orders')"
    }
  ]
}

CRITICAL REQUIREMENTS:
1. Only extract products with complete information (title, price, image, link)
2. Clean up titles: remove extra spaces, promotional text, random characters
3. Ensure URLs are complete and valid
4. If price contains multiple currencies, use the main one
5. Return empty array if no valid products found
6. Maximum 15 products per response
7. NO text outside JSON object
8. Make educated guesses for missing URLs by using context clues

Extract from these HTML containers:
"""
            
            # Create condensed data for this batch
            condensed_batch = []
            for idx, item in enumerate(batch):
                condensed_item = {
                    'id': idx,
                    'text': item['text_content'][:400],  # Limit text
                    'links': [link for link in item['links'] if link][:2],
                    'images': [img for img in item['images'] if img and ('http' in img or img.startswith('//'))],
                    'classes': item.get('classes', []),
                    'data_attrs': {k: v for k, v in item.get('data_attributes', {}).items() if k in ['data-item-id', 'data-product-id', 'data-sku']}
                }
                condensed_batch.append(condensed_item)
            
            user_content = json.dumps(condensed_batch, indent=1)
            
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    temperature=0.1,
                    max_tokens=3000
                )
                
                json_content = response.choices[0].message.content.strip()
                
                # Clean up response - extract JSON
                json_match = re.search(r'\{.*\}', json_content, re.DOTALL)
                if json_match:
                    json_content = json_match.group()
                
                # Parse and validate
                batch_result = json.loads(json_content)
                batch_products = batch_result.get("products", [])
                
                # Validate and clean products
                valid_products = []
                for product in batch_products:
                    if self._validate_product(product):
                        # Clean the product data
                        cleaned_product = self._clean_product(product)
                        valid_products.append(cleaned_product)
                
                all_products.extend(valid_products)
                print(f"✅ Extracted {len(valid_products)} valid products from batch")
                
                # Add small delay between batches
                import time
                time.sleep(0.5)
                
            except Exception as e:
                print(f"❌ Error processing batch {i//batch_size + 1}: {e}")
                continue
        
        print(f"🎉 Total products extracted: {len(all_products)}")
        return {"products": all_products}
    
    def _validate_product(self, product: Dict) -> bool:
        """Validate that a product has required fields"""
        required_fields = ['title', 'price', 'image', 'link']
        
        for field in required_fields:
            value = product.get(field, '').strip()
            if not value or value.lower() in ['n/a', 'null', 'none', '']:
                return False
        
        # Additional validation
        title = product.get('title', '').strip()
        price = product.get('price', '').strip()
        image = product.get('image', '').strip()
        link = product.get('link', '').strip()
        
        # Title should be meaningful
        if len(title) < 5 or len(title) > 200:
            return False
        
        # Price should contain currency symbols or numbers
        if not any(char in price for char in ['
    
    async def crawl_with_fallback(self, url: str, browser_config: BrowserConfig) -> str:
        """Crawl with fallback to proxies if needed"""
        print(f"Crawling URL: {url}")
        
        # JavaScript to scroll and wait for content - compatible with crawl4ai v0.7.x
        js_scroll_code = """
        // Scroll down to load more content
        window.scrollTo(0, document.body.scrollHeight/2);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to click "Load More" or similar buttons if they exist
        const loadMoreButtons = document.querySelectorAll('[data-role="load-more"], .load-more, .more-btn');
        if (loadMoreButtons.length > 0) {
            loadMoreButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Additional scroll to trigger lazy loading
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 1000));
        """
        
        # First try without proxy
        print("Attempting to crawl without proxy...")
        run_config = CrawlerRunConfig(
            js_code=js_scroll_code,
            page_timeout=30000,  # 30 seconds timeout
            wait_for="css:div[data-widget-cid]",  # Wait for AliExpress product container
            delay_before_return_html=2.0,  # Wait 2 seconds before capturing HTML
            scan_full_page=True,  # Auto-scroll to load dynamic content
            scroll_delay=0.5,  # Delay between scrolls
            remove_overlay_elements=True,  # Remove popups/modals
            word_count_threshold=10,  # Lower threshold for product data
            excluded_tags=["script", "style", "nav", "footer"],  # Remove unnecessary tags
            verbose=True
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            try:
                result = await crawler.arun(url=url, config=run_config)
                if result.success and len(result.html) > 10000:  # Check if we got substantial content
                    print(f"✅ Successfully crawled without proxy - HTML length: {len(result.html)}")
                    return result.html
                else:
                    print(f"❌ Direct crawl failed - Success: {result.success}, HTML length: {len(result.html) if result.html else 0}")
            except Exception as e:
                print(f"❌ Direct crawl exception: {e}")
        
        # If direct crawl failed, try with a simpler config first
        print("Trying with simplified config...")
        simple_config = CrawlerRunConfig(
            page_timeout=60000,  # Longer timeout
            scan_full_page=True,
            delay_before_return_html=3.0,
            verbose=True
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            try:
                result = await crawler.arun(url=url, config=simple_config)
                if result.success and len(result.html) > 5000:
                    print(f"✅ Successfully crawled with simple config - HTML length: {len(result.html)}")
                    return result.html
            except Exception as e:
                print(f"❌ Simple crawl exception: {e}")
        
        # Try with proxies if available
        print("Trying with proxies...")
        proxy_list = self.fetch_proxies()
        
        if not proxy_list:
            # Last resort: try most basic config
            print("No proxies available. Trying most basic crawl...")
            basic_config = CrawlerRunConfig(verbose=True)
            async with AsyncWebCrawler(config=browser_config) as crawler:
                try:
                    result = await crawler.arun(url=url, config=basic_config)
                    if result.success:
                        print(f"✅ Basic crawl succeeded - HTML length: {len(result.html)}")
                        return result.html
                except Exception as e:
                    print(f"❌ Basic crawl exception: {e}")
            raise RuntimeError("All crawl attempts failed - no proxies available")
        
        # Test proxies in batches
        print("Testing proxies...")
        working_proxies = []
        for i, proxy in enumerate(proxy_list[:15]):  # Test first 15 proxies
            if i % 3 == 0:
                print(f"Tested {i} proxies, found {len(working_proxies)} working")
            
            if self.test_proxy(proxy):
                working_proxies.append(proxy)
                if len(working_proxies) >= 3:  # Stop after finding 3 working proxies
                    break
        
        if not working_proxies:
            print("No working proxies found. Final attempt with basic config...")
            basic_config = CrawlerRunConfig(verbose=True)
            async with AsyncWebCrawler(config=browser_config) as crawler:
                try:
                    result = await crawler.arun(url=url, config=basic_config)
                    if result.success:
                        return result.html
                except Exception as e:
                    print(f"Final crawl attempt failed: {e}")
            raise RuntimeError("All crawl attempts failed - no working proxies found")
        
        print(f"Found {len(working_proxies)} working proxies. Attempting crawl...")
        
        # Try crawling with working proxies
        proxy_configs = [ProxyConfig(server=f"http://{p}") for p in working_proxies]
        proxy_strategy = RoundRobinProxyStrategy(proxy_configs)
        run_config_proxy = CrawlerRunConfig(
            # proxy_rotation_strategy=proxy_strategy,  # Note: This might not be supported in your version
            js_code=js_scroll_code,
            page_timeout=45000,
            scan_full_page=True,
            delay_before_return_html=2.0,
            verbose=True
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            try:
                result = await crawler.arun(url=url, config=run_config_proxy)
                if result.success:
                    print(f"✅ Successfully crawled with proxy - HTML length: {len(result.html)}")
                    return result.html
            except Exception as e:
                print(f"❌ Proxy crawl exception: {e}")
        
        # Final fallback
        raise RuntimeError("All crawl attempts failed including proxy attempts")
    
    def save_results(self, products: List[Dict], query: str):
        """Save results in multiple formats"""
        timestamp = int(time.time())
        
        # Save JSON
        json_file = f"products_{query}_{timestamp}.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump({"products": products, "query": query, "timestamp": timestamp}, f, indent=2)
        print(f"✅ JSON saved to {json_file}")
        
        # Save CSV
        if products:
            csv_file = f"products_{query}_{timestamp}.csv"
            df = pd.DataFrame(products)
            df.to_csv(csv_file, index=False)
            print(f"✅ CSV saved to {csv_file}")
            
            # Save Markdown
            md_file = f"products_{query}_{timestamp}.md"
            with open(md_file, "w", encoding="utf-8") as f:
                f.write(f"# AliExpress Products - {query}\n\n")
                f.write(f"**Search Query:** {query}  \n")
                f.write(f"**Products Found:** {len(products)}  \n")
                f.write(f"**Timestamp:** {timestamp}  \n\n")
                f.write(df.to_markdown(index=False))
            print(f"✅ Markdown saved to {md_file}")
        
        return json_file
    
    async def scrape(self, query: str) -> Dict:
        """Main scraping method"""
        if not query.strip():
            raise ValueError("Query cannot be empty")
        
        # Construct search URL
        url = f"https://www.aliexpress.com/wholesale?SearchText={query.replace(' ', '+')}&page=1"
        
        # Browser configuration for crawl4ai v0.7.x
        browser_config = BrowserConfig(
            headless=True,
            verbose=True,
            browser_type="chromium",
            viewport_width=1920,
            viewport_height=1080,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            java_script_enabled=True,
            ignore_https_errors=True
        )
        
        try:
            # Crawl the page
            html = await self.crawl_with_fallback(url, browser_config)
            
            # Save raw HTML for debugging
            html_file = f"raw_{query}_{int(time.time())}.html"
            with open(html_file, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"📄 Raw HTML saved to {html_file} (Length: {len(html)} chars)")
            
            # Extract product elements
            print("🔍 Extracting product elements...")
            extracted_data = self.extract_product_elements(html)
            print(f"📦 Extracted {len(extracted_data)} product containers")
            
            if not extracted_data:
                print("❌ No product containers found")
                return {"products": [], "error": "No products found", "html_file": html_file}
            
            # Use AI to extract structured data
            print("🤖 Using DeepSeek R1 for data extraction...")
            result = self.extract_products_with_ai(extracted_data)
            products = result.get("products", [])
            
            print(f"✅ Successfully extracted {len(products)} products using AI")
            
            # Save results
            if products:
                self.save_results(products, query)
            else:
                print("⚠️ No valid products extracted by AI")
            
            return {
                "products": products,
                "query": query,
                "total_found": len(products),
                "html_file": html_file,
                "extracted_containers": len(extracted_data)
            }
            
        except Exception as e:
            print(f"❌ Scraping failed: {str(e)}")
            import traceback
            print(f"📋 Full traceback: {traceback.format_exc()}")
            return {"products": [], "error": str(e)}

async def main():
    """Main function to run the scraper"""
    # Check for DeepSeek API key
    if not os.getenv("DEEPSEEK_API_KEY"):
        print("❌ DEEPSEEK_API_KEY environment variable not set")
        print("Please set your DeepSeek API key: export DEEPSEEK_API_KEY='your-api-key'")
        return
    
    # Get search query
    query = input("Enter search query (e.g., 'wireless headphones'): ").strip()
    if not query:
        print("❌ Query is required")
        return
    
    # Initialize and run scraper
    scraper = AliExpressScraper()
    
    print(f"\n🔍 Starting AliExpress scraping for: '{query}'")
    print("=" * 50)
    
    result = await scraper.scrape(query)
    
    print("=" * 50)
    if result.get("error"):
        print(f"❌ Error: {result['error']}")
    else:
        products = result["products"]
        print(f"✅ Scraping completed!")
        print(f"📊 Products found: {len(products)}")
        
        if products:
            print("\n🏷️ Sample products:")
            for i, product in enumerate(products[:3]):  # Show first 3 products
                print(f"\n{i+1}. {product['title'][:60]}...")
                print(f"   💰 Price: {product['price']}")
                print(f"   ⭐ Rating: {product.get('rating', 'N/A')}")
                print(f"   🛒 Orders: {product.get('orders', 'N/A')}")

if __name__ == "__main__":
    asyncio.run(main()) in str(t) or '€' in str(t) or '£' in str(t) or 'US' in str(t)))
        price_containers = []
        for price_text in price_elements[:20]:  # Limit search
            parent = price_text.parent
            for _ in range(3):  # Go up 3 levels to find container
                if parent and parent.name and parent.name != 'html':
                    # Look for container-like elements
                    if any(attr in str(parent.get('class', [])).lower() for attr in ['item', 'product', 'card', 'list']):
                        price_containers.append(parent)
                        break
                    parent = parent.parent
                else:
                    break
        
        if price_containers:
            print(f"Found {len(set(price_containers))} potential price containers")
            product_containers.extend(list(set(price_containers)))
        
        # Strategy 2: Look for structured data or data attributes
        print("Strategy 2: Looking for structured data attributes...")
        data_containers = soup.find_all(attrs=lambda x: x and any(
            key.startswith(('data-item', 'data-product', 'data-spm-anchor')) 
            for key in x.keys() if isinstance(key, str)
        ))
        
        if data_containers:
            print(f"Found {len(data_containers)} elements with data attributes")
            product_containers.extend(data_containers)
        
        # Strategy 3: Look for image-heavy containers (products usually have images)
        print("Strategy 3: Looking for image-rich containers...")
        img_elements = soup.find_all('img')
        img_containers = []
        for img in img_elements[:50]:  # Limit to first 50 images
            parent = img.parent
            for _ in range(2):  # Go up 2 levels
                if parent and parent.name and len(parent.find_all('img')) == 1:  # One image per container
                    # Check if this container also has text that looks like a title
                    text_content = parent.get_text(strip=True)
                    if len(text_content) > 10 and len(text_content) < 200:  # Reasonable title length
                        img_containers.append(parent)
                        break
                parent = parent.parent if parent else None
        
        if img_containers:
            print(f"Found {len(set(img_containers))} image-based containers")
            product_containers.extend(list(set(img_containers)))
        
        # Strategy 4: Look for link-rich areas (product cards usually have clickable areas)
        print("Strategy 4: Looking for link-rich containers...")
        link_containers = []
        all_links = soup.find_all('a', href=True)
        for link in all_links[:30]:  # First 30 links
            href = link.get('href', '')
            if any(pattern in href for pattern in ['/item/', 'product', '.html']):
                parent = link.parent
                for _ in range(2):
                    if parent and parent.name:
                        # Check if parent has good content structure
                        if parent.find('img') and len(parent.get_text(strip=True)) > 20:
                            link_containers.append(parent)
                            break
                    parent = parent.parent if parent else None
        
        if link_containers:
            print(f"Found {len(set(link_containers))} link-based containers")
            product_containers.extend(list(set(link_containers)))
        
        # Remove duplicates while preserving order
        seen = set()
        unique_containers = []
        for container in product_containers:
            container_id = id(container)  # Use object id to identify unique elements
            if container_id not in seen:
                seen.add(container_id)
                unique_containers.append(container)
        
        print(f"📦 Total unique containers found: {len(unique_containers)}")
        
        # If we still have no containers, try a broader search
        if not unique_containers:
            print("Strategy 5: Broad search for any structured elements...")
            # Look for any div with multiple child elements
            broad_containers = soup.find_all('div')
            for div in broad_containers[:100]:  # Check first 100 divs
                children = div.find_all(['div', 'span', 'a', 'img'], recursive=False)
                if len(children) >= 3:  # Has at least 3 direct children
                    text_content = div.get_text(strip=True)
                    if 20 < len(text_content) < 300:  # Reasonable content length
                        unique_containers.append(div)
                        if len(unique_containers) >= 20:  # Limit to 20
                            break
        
        # Extract data from containers
        extracted_products = []
        for i, container in enumerate(unique_containers[:30]):  # Limit to first 30
            try:
                # Get all text content
                text_content = container.get_text(separator=' ', strip=True)
                
                # Get all links
                links = [a.get('href') for a in container.find_all('a', href=True) if a.get('href')]
                
                # Get all images
                images = []
                for img in container.find_all('img'):
                    img_src = img.get('src') or img.get('data-src') or img.get('data-original')
                    if img_src:
                        images.append(img_src)
                
                # Get data attributes
                data_attrs = {k: v for k, v in container.attrs.items() if k.startswith('data-')} if hasattr(container, 'attrs') else {}
                
                # Only include containers with meaningful content
                if text_content and len(text_content) > 15:
                    product_data = {
                        'container_index': i,
                        'html_snippet': str(container)[:1000],  # First 1000 chars of HTML
                        'text_content': text_content[:500],  # First 500 chars of text
                        'links': links[:3],  # First 3 links
                        'images': images[:2],  # First 2 images
                        'data_attributes': data_attrs,
                        'tag_name': container.name,
                        'classes': container.get('class', []) if hasattr(container, 'get') else []
                    }
                    extracted_products.append(product_data)
            except Exception as e:
                print(f"Error processing container {i}: {e}")
                continue
        
        print(f"✅ Successfully processed {len(extracted_products)} containers")
        return extracted_products
    
    def extract_products_with_ai(self, extracted_data: List[Dict]) -> Dict:
        """Use DeepSeek R1 to extract structured product data"""
        if not extracted_data:
            return {"products": []}
        
        # Prepare a more focused prompt with the pre-processed data
        system_prompt = """
You are an expert at extracting product information from AliExpress HTML data.

Extract product details from the provided data and return ONLY a valid JSON object with this exact structure:
{
  "products": [
    {
      "title": "product name",
      "price": "price with currency symbol",
      "image": "full image URL",
      "link": "full product URL (ensure it starts with https://)",
      "rating": "rating if available",
      "orders": "number of orders if available"
    }
  ]
}

Important rules:
1. Extract ONLY products that have all required fields (title, price, image, link)
2. Ensure all URLs are complete and valid
3. Clean up titles (remove extra spaces, special characters)
4. Standardize price format
5. Return empty array if no valid products found
6. DO NOT include any text outside the JSON object
7. Maximum 20 products in response
"""
        
        # Create a condensed representation for the AI
        condensed_data = []
        for item in extracted_data[:20]:  # Limit to first 20 items
            condensed_item = {
                'text': item['text_content'][:500],  # Limit text length
                'data_attrs': item['data_attributes'],
                'images': [img for img in item['images'] if img][:3],  # Max 3 images
                'links': [link for link in item['links'] if link][:2]   # Max 2 links
            }
            condensed_data.append(condensed_item)
        
        user_content = f"Product data to extract:\n{json.dumps(condensed_data, indent=2)}"
        
        try:
            print("Sending data to DeepSeek R1 for extraction...")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.1,
                max_tokens=4000
            )
            
            json_content = response.choices[0].message.content
            # Clean up the response in case there's extra text
            json_match = re.search(r'\{.*\}', json_content, re.DOTALL)
            if json_match:
                json_content = json_match.group()
            
            return json.loads(json_content)
            
        except Exception as e:
            print(f"Error during AI extraction: {e}")
            return {"products": []}
    
    async def crawl_with_fallback(self, url: str, browser_config: BrowserConfig) -> str:
        """Crawl with fallback to proxies if needed"""
        print(f"Crawling URL: {url}")
        
        # JavaScript to scroll and wait for content - compatible with crawl4ai v0.7.x
        js_scroll_code = """
        // Scroll down to load more content
        window.scrollTo(0, document.body.scrollHeight/2);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to click "Load More" or similar buttons if they exist
        const loadMoreButtons = document.querySelectorAll('[data-role="load-more"], .load-more, .more-btn');
        if (loadMoreButtons.length > 0) {
            loadMoreButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Additional scroll to trigger lazy loading
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 1000));
        """
        
        # First try without proxy
        print("Attempting to crawl without proxy...")
        run_config = CrawlerRunConfig(
            js_code=js_scroll_code,
            page_timeout=30000,  # 30 seconds timeout
            wait_for="css:div[data-widget-cid]",  # Wait for AliExpress product container
            delay_before_return_html=2.0,  # Wait 2 seconds before capturing HTML
            scan_full_page=True,  # Auto-scroll to load dynamic content
            scroll_delay=0.5,  # Delay between scrolls
            remove_overlay_elements=True,  # Remove popups/modals
            word_count_threshold=10,  # Lower threshold for product data
            excluded_tags=["script", "style", "nav", "footer"],  # Remove unnecessary tags
            verbose=True
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            try:
                result = await crawler.arun(url=url, config=run_config)
                if result.success and len(result.html) > 10000:  # Check if we got substantial content
                    print(f"✅ Successfully crawled without proxy - HTML length: {len(result.html)}")
                    return result.html
                else:
                    print(f"❌ Direct crawl failed - Success: {result.success}, HTML length: {len(result.html) if result.html else 0}")
            except Exception as e:
                print(f"❌ Direct crawl exception: {e}")
        
        # If direct crawl failed, try with a simpler config first
        print("Trying with simplified config...")
        simple_config = CrawlerRunConfig(
            page_timeout=60000,  # Longer timeout
            scan_full_page=True,
            delay_before_return_html=3.0,
            verbose=True
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            try:
                result = await crawler.arun(url=url, config=simple_config)
                if result.success and len(result.html) > 5000:
                    print(f"✅ Successfully crawled with simple config - HTML length: {len(result.html)}")
                    return result.html
            except Exception as e:
                print(f"❌ Simple crawl exception: {e}")
        
        # Try with proxies if available
        print("Trying with proxies...")
        proxy_list = self.fetch_proxies()
        
        if not proxy_list:
            # Last resort: try most basic config
            print("No proxies available. Trying most basic crawl...")
            basic_config = CrawlerRunConfig(verbose=True)
            async with AsyncWebCrawler(config=browser_config) as crawler:
                try:
                    result = await crawler.arun(url=url, config=basic_config)
                    if result.success:
                        print(f"✅ Basic crawl succeeded - HTML length: {len(result.html)}")
                        return result.html
                except Exception as e:
                    print(f"❌ Basic crawl exception: {e}")
            raise RuntimeError("All crawl attempts failed - no proxies available")
        
        # Test proxies in batches
        print("Testing proxies...")
        working_proxies = []
        for i, proxy in enumerate(proxy_list[:15]):  # Test first 15 proxies
            if i % 3 == 0:
                print(f"Tested {i} proxies, found {len(working_proxies)} working")
            
            if self.test_proxy(proxy):
                working_proxies.append(proxy)
                if len(working_proxies) >= 3:  # Stop after finding 3 working proxies
                    break
        
        if not working_proxies:
            print("No working proxies found. Final attempt with basic config...")
            basic_config = CrawlerRunConfig(verbose=True)
            async with AsyncWebCrawler(config=browser_config) as crawler:
                try:
                    result = await crawler.arun(url=url, config=basic_config)
                    if result.success:
                        return result.html
                except Exception as e:
                    print(f"Final crawl attempt failed: {e}")
            raise RuntimeError("All crawl attempts failed - no working proxies found")
        
        print(f"Found {len(working_proxies)} working proxies. Attempting crawl...")
        
        # Try crawling with working proxies
        proxy_configs = [ProxyConfig(server=f"http://{p}") for p in working_proxies]
        proxy_strategy = RoundRobinProxyStrategy(proxy_configs)
        run_config_proxy = CrawlerRunConfig(
            # proxy_rotation_strategy=proxy_strategy,  # Note: This might not be supported in your version
            js_code=js_scroll_code,
            page_timeout=45000,
            scan_full_page=True,
            delay_before_return_html=2.0,
            verbose=True
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            try:
                result = await crawler.arun(url=url, config=run_config_proxy)
                if result.success:
                    print(f"✅ Successfully crawled with proxy - HTML length: {len(result.html)}")
                    return result.html
            except Exception as e:
                print(f"❌ Proxy crawl exception: {e}")
        
        # Final fallback
        raise RuntimeError("All crawl attempts failed including proxy attempts")
    
    def save_results(self, products: List[Dict], query: str):
        """Save results in multiple formats"""
        timestamp = int(time.time())
        
        # Save JSON
        json_file = f"products_{query}_{timestamp}.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump({"products": products, "query": query, "timestamp": timestamp}, f, indent=2)
        print(f"✅ JSON saved to {json_file}")
        
        # Save CSV
        if products:
            csv_file = f"products_{query}_{timestamp}.csv"
            df = pd.DataFrame(products)
            df.to_csv(csv_file, index=False)
            print(f"✅ CSV saved to {csv_file}")
            
            # Save Markdown
            md_file = f"products_{query}_{timestamp}.md"
            with open(md_file, "w", encoding="utf-8") as f:
                f.write(f"# AliExpress Products - {query}\n\n")
                f.write(f"**Search Query:** {query}  \n")
                f.write(f"**Products Found:** {len(products)}  \n")
                f.write(f"**Timestamp:** {timestamp}  \n\n")
                f.write(df.to_markdown(index=False))
            print(f"✅ Markdown saved to {md_file}")
        
        return json_file
    
    async def scrape(self, query: str) -> Dict:
        """Main scraping method"""
        if not query.strip():
            raise ValueError("Query cannot be empty")
        
        # Construct search URL
        url = f"https://www.aliexpress.com/wholesale?SearchText={query.replace(' ', '+')}&page=1"
        
        # Browser configuration for crawl4ai v0.7.x
        browser_config = BrowserConfig(
            headless=True,
            verbose=True,
            browser_type="chromium",
            viewport_width=1920,
            viewport_height=1080,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            java_script_enabled=True,
            ignore_https_errors=True
        )
        
        try:
            # Crawl the page
            html = await self.crawl_with_fallback(url, browser_config)
            
            # Save raw HTML for debugging
            html_file = f"raw_{query}_{int(time.time())}.html"
            with open(html_file, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"📄 Raw HTML saved to {html_file} (Length: {len(html)} chars)")
            
            # Extract product elements
            print("🔍 Extracting product elements...")
            extracted_data = self.extract_product_elements(html)
            print(f"📦 Extracted {len(extracted_data)} product containers")
            
            if not extracted_data:
                print("❌ No product containers found")
                return {"products": [], "error": "No products found", "html_file": html_file}
            
            # Use AI to extract structured data
            print("🤖 Using DeepSeek R1 for data extraction...")
            result = self.extract_products_with_ai(extracted_data)
            products = result.get("products", [])
            
            print(f"✅ Successfully extracted {len(products)} products using AI")
            
            # Save results
            if products:
                self.save_results(products, query)
            else:
                print("⚠️ No valid products extracted by AI")
            
            return {
                "products": products,
                "query": query,
                "total_found": len(products),
                "html_file": html_file,
                "extracted_containers": len(extracted_data)
            }
            
        except Exception as e:
            print(f"❌ Scraping failed: {str(e)}")
            import traceback
            print(f"📋 Full traceback: {traceback.format_exc()}")
            return {"products": [], "error": str(e)}

async def main():
    """Main function to run the scraper"""
    # Check for DeepSeek API key
    if not os.getenv("DEEPSEEK_API_KEY"):
        print("❌ DEEPSEEK_API_KEY environment variable not set")
        print("Please set your DeepSeek API key: export DEEPSEEK_API_KEY='your-api-key'")
        return
    
    # Get search query
    query = input("Enter search query (e.g., 'wireless headphones'): ").strip()
    if not query:
        print("❌ Query is required")
        return
    
    # Initialize and run scraper
    scraper = AliExpressScraper()
    
    print(f"\n🔍 Starting AliExpress scraping for: '{query}'")
    print("=" * 50)
    
    result = await scraper.scrape(query)
    
    print("=" * 50)
    if result.get("error"):
        print(f"❌ Error: {result['error']}")
    else:
        products = result["products"]
        print(f"✅ Scraping completed!")
        print(f"📊 Products found: {len(products)}")
        
        if products:
            print("\n🏷️ Sample products:")
            for i, product in enumerate(products[:3]):  # Show first 3 products
                print(f"\n{i+1}. {product['title'][:60]}...")
                print(f"   💰 Price: {product['price']}")
                print(f"   ⭐ Rating: {product.get('rating', 'N/A')}")
                print(f"   🛒 Orders: {product.get('orders', 'N/A')}")

if __name__ == "__main__":
    asyncio.run(main()), '€', '£', '¥', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']):
            return False
        
        # Image should be a valid URL
        if not (image.startswith('http') or image.startswith('//')):
            return False
        
        # Link should be valid
        if not (link.startswith('http') or link.startswith('//')):
            return False
        
        return True
    
    def _clean_product(self, product: Dict) -> Dict:
        """Clean and standardize product data"""
        cleaned = {}
        
        # Clean title
        title = product.get('title', '').strip()
        title = re.sub(r'\s+', ' ', title)  # Multiple spaces to single
        title = re.sub(r'[^\w\s\-\.\,\(\)]', '', title)  # Remove special chars except common ones
        cleaned['title'] = title[:100]  # Limit length
        
        # Clean price
        price = product.get('price', '').strip()
        cleaned['price'] = price[:50]  # Limit length
        
        # Clean image URL
        image = product.get('image', '').strip()
        if image.startswith('//'):
            image = 'https:' + image
        cleaned['image'] = image
        
        # Clean link URL
        link = product.get('link', '').strip()
        if link.startswith('//'):
            link = 'https:' + link
        elif link.startswith('/'):
            link = 'https://www.aliexpress.com' + link
        cleaned['link'] = link
        
        # Optional fields
        rating = product.get('rating', '').strip()
        if rating and rating.lower() not in ['n/a', 'null', 'none']:
            cleaned['rating'] = rating[:20]
        
        orders = product.get('orders', '').strip()
        if orders and orders.lower() not in ['n/a', 'null', 'none']:
            cleaned['orders'] = orders[:50]
        
        return cleaned
    
    async def crawl_with_fallback(self, url: str, browser_config: BrowserConfig) -> str:
        """Crawl with fallback to proxies if needed"""
        print(f"Crawling URL: {url}")
        
        # JavaScript to scroll and wait for content - compatible with crawl4ai v0.7.x
        js_scroll_code = """
        // Scroll down to load more content
        window.scrollTo(0, document.body.scrollHeight/2);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to click "Load More" or similar buttons if they exist
        const loadMoreButtons = document.querySelectorAll('[data-role="load-more"], .load-more, .more-btn');
        if (loadMoreButtons.length > 0) {
            loadMoreButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Additional scroll to trigger lazy loading
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 1000));
        """
        
        # First try without proxy
        print("Attempting to crawl without proxy...")
        run_config = CrawlerRunConfig(
            js_code=js_scroll_code,
            page_timeout=30000,  # 30 seconds timeout
            wait_for="css:div[data-widget-cid]",  # Wait for AliExpress product container
            delay_before_return_html=2.0,  # Wait 2 seconds before capturing HTML
            scan_full_page=True,  # Auto-scroll to load dynamic content
            scroll_delay=0.5,  # Delay between scrolls
            remove_overlay_elements=True,  # Remove popups/modals
            word_count_threshold=10,  # Lower threshold for product data
            excluded_tags=["script", "style", "nav", "footer"],  # Remove unnecessary tags
            verbose=True
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            try:
                result = await crawler.arun(url=url, config=run_config)
                if result.success and len(result.html) > 10000:  # Check if we got substantial content
                    print(f"✅ Successfully crawled without proxy - HTML length: {len(result.html)}")
                    return result.html
                else:
                    print(f"❌ Direct crawl failed - Success: {result.success}, HTML length: {len(result.html) if result.html else 0}")
            except Exception as e:
                print(f"❌ Direct crawl exception: {e}")
        
        # If direct crawl failed, try with a simpler config first
        print("Trying with simplified config...")
        simple_config = CrawlerRunConfig(
            page_timeout=60000,  # Longer timeout
            scan_full_page=True,
            delay_before_return_html=3.0,
            verbose=True
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            try:
                result = await crawler.arun(url=url, config=simple_config)
                if result.success and len(result.html) > 5000:
                    print(f"✅ Successfully crawled with simple config - HTML length: {len(result.html)}")
                    return result.html
            except Exception as e:
                print(f"❌ Simple crawl exception: {e}")
        
        # Try with proxies if available
        print("Trying with proxies...")
        proxy_list = self.fetch_proxies()
        
        if not proxy_list:
            # Last resort: try most basic config
            print("No proxies available. Trying most basic crawl...")
            basic_config = CrawlerRunConfig(verbose=True)
            async with AsyncWebCrawler(config=browser_config) as crawler:
                try:
                    result = await crawler.arun(url=url, config=basic_config)
                    if result.success:
                        print(f"✅ Basic crawl succeeded - HTML length: {len(result.html)}")
                        return result.html
                except Exception as e:
                    print(f"❌ Basic crawl exception: {e}")
            raise RuntimeError("All crawl attempts failed - no proxies available")
        
        # Test proxies in batches
        print("Testing proxies...")
        working_proxies = []
        for i, proxy in enumerate(proxy_list[:15]):  # Test first 15 proxies
            if i % 3 == 0:
                print(f"Tested {i} proxies, found {len(working_proxies)} working")
            
            if self.test_proxy(proxy):
                working_proxies.append(proxy)
                if len(working_proxies) >= 3:  # Stop after finding 3 working proxies
                    break
        
        if not working_proxies:
            print("No working proxies found. Final attempt with basic config...")
            basic_config = CrawlerRunConfig(verbose=True)
            async with AsyncWebCrawler(config=browser_config) as crawler:
                try:
                    result = await crawler.arun(url=url, config=basic_config)
                    if result.success:
                        return result.html
                except Exception as e:
                    print(f"Final crawl attempt failed: {e}")
            raise RuntimeError("All crawl attempts failed - no working proxies found")
        
        print(f"Found {len(working_proxies)} working proxies. Attempting crawl...")
        
        # Try crawling with working proxies
        proxy_configs = [ProxyConfig(server=f"http://{p}") for p in working_proxies]
        proxy_strategy = RoundRobinProxyStrategy(proxy_configs)
        run_config_proxy = CrawlerRunConfig(
            # proxy_rotation_strategy=proxy_strategy,  # Note: This might not be supported in your version
            js_code=js_scroll_code,
            page_timeout=45000,
            scan_full_page=True,
            delay_before_return_html=2.0,
            verbose=True
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            try:
                result = await crawler.arun(url=url, config=run_config_proxy)
                if result.success:
                    print(f"✅ Successfully crawled with proxy - HTML length: {len(result.html)}")
                    return result.html
            except Exception as e:
                print(f"❌ Proxy crawl exception: {e}")
        
        # Final fallback
        raise RuntimeError("All crawl attempts failed including proxy attempts")
    
    def save_results(self, products: List[Dict], query: str):
        """Save results in multiple formats"""
        timestamp = int(time.time())
        
        # Save JSON
        json_file = f"products_{query}_{timestamp}.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump({"products": products, "query": query, "timestamp": timestamp}, f, indent=2)
        print(f"✅ JSON saved to {json_file}")
        
        # Save CSV
        if products:
            csv_file = f"products_{query}_{timestamp}.csv"
            df = pd.DataFrame(products)
            df.to_csv(csv_file, index=False)
            print(f"✅ CSV saved to {csv_file}")
            
            # Save Markdown
            md_file = f"products_{query}_{timestamp}.md"
            with open(md_file, "w", encoding="utf-8") as f:
                f.write(f"# AliExpress Products - {query}\n\n")
                f.write(f"**Search Query:** {query}  \n")
                f.write(f"**Products Found:** {len(products)}  \n")
                f.write(f"**Timestamp:** {timestamp}  \n\n")
                f.write(df.to_markdown(index=False))
            print(f"✅ Markdown saved to {md_file}")
        
        return json_file
    
    async def scrape(self, query: str) -> Dict:
        """Main scraping method"""
        if not query.strip():
            raise ValueError("Query cannot be empty")
        
        # Construct search URL
        url = f"https://www.aliexpress.com/wholesale?SearchText={query.replace(' ', '+')}&page=1"
        
        # Browser configuration for crawl4ai v0.7.x
        browser_config = BrowserConfig(
            headless=True,
            verbose=True,
            browser_type="chromium",
            viewport_width=1920,
            viewport_height=1080,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            java_script_enabled=True,
            ignore_https_errors=True
        )
        
        try:
            # Crawl the page
            html = await self.crawl_with_fallback(url, browser_config)
            
            # Save raw HTML for debugging
            html_file = f"raw_{query}_{int(time.time())}.html"
            with open(html_file, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"📄 Raw HTML saved to {html_file} (Length: {len(html)} chars)")
            
            # Extract product elements
            print("🔍 Extracting product elements...")
            extracted_data = self.extract_product_elements(html)
            print(f"📦 Extracted {len(extracted_data)} product containers")
            
            if not extracted_data:
                print("❌ No product containers found")
                return {"products": [], "error": "No products found", "html_file": html_file}
            
            # Use AI to extract structured data
            print("🤖 Using DeepSeek R1 for data extraction...")
            result = self.extract_products_with_ai(extracted_data)
            products = result.get("products", [])
            
            print(f"✅ Successfully extracted {len(products)} products using AI")
            
            # Save results
            if products:
                self.save_results(products, query)
            else:
                print("⚠️ No valid products extracted by AI")
            
            return {
                "products": products,
                "query": query,
                "total_found": len(products),
                "html_file": html_file,
                "extracted_containers": len(extracted_data)
            }
            
        except Exception as e:
            print(f"❌ Scraping failed: {str(e)}")
            import traceback
            print(f"📋 Full traceback: {traceback.format_exc()}")
            return {"products": [], "error": str(e)}

async def main():
    """Main function to run the scraper"""
    # Check for DeepSeek API key
    if not os.getenv("DEEPSEEK_API_KEY"):
        print("❌ DEEPSEEK_API_KEY environment variable not set")
        print("Please set your DeepSeek API key: export DEEPSEEK_API_KEY='your-api-key'")
        return
    
    # Get search query
    query = input("Enter search query (e.g., 'wireless headphones'): ").strip()
    if not query:
        print("❌ Query is required")
        return
    
    # Initialize and run scraper
    scraper = AliExpressScraper()
    
    print(f"\n🔍 Starting AliExpress scraping for: '{query}'")
    print("=" * 50)
    
    result = await scraper.scrape(query)
    
    print("=" * 50)
    if result.get("error"):
        print(f"❌ Error: {result['error']}")
    else:
        products = result["products"]
        print(f"✅ Scraping completed!")
        print(f"📊 Products found: {len(products)}")
        
        if products:
            print("\n🏷️ Sample products:")
            for i, product in enumerate(products[:3]):  # Show first 3 products
                print(f"\n{i+1}. {product['title'][:60]}...")
                print(f"   💰 Price: {product['price']}")
                print(f"   ⭐ Rating: {product.get('rating', 'N/A')}")
                print(f"   🛒 Orders: {product.get('orders', 'N/A')}")

if __name__ == "__main__":
    asyncio.run(main()) in str(t) or '€' in str(t) or '£' in str(t) or 'US' in str(t)))
        price_containers = []
        for price_text in price_elements[:20]:  # Limit search
            parent = price_text.parent
            for _ in range(3):  # Go up 3 levels to find container
                if parent and parent.name and parent.name != 'html':
                    # Look for container-like elements
                    if any(attr in str(parent.get('class', [])).lower() for attr in ['item', 'product', 'card', 'list']):
                        price_containers.append(parent)
                        break
                    parent = parent.parent
                else:
                    break
        
        if price_containers:
            print(f"Found {len(set(price_containers))} potential price containers")
            product_containers.extend(list(set(price_containers)))
        
        # Strategy 2: Look for structured data or data attributes
        print("Strategy 2: Looking for structured data attributes...")
        data_containers = soup.find_all(attrs=lambda x: x and any(
            key.startswith(('data-item', 'data-product', 'data-spm-anchor')) 
            for key in x.keys() if isinstance(key, str)
        ))
        
        if data_containers:
            print(f"Found {len(data_containers)} elements with data attributes")
            product_containers.extend(data_containers)
        
        # Strategy 3: Look for image-heavy containers (products usually have images)
        print("Strategy 3: Looking for image-rich containers...")
        img_elements = soup.find_all('img')
        img_containers = []
        for img in img_elements[:50]:  # Limit to first 50 images
            parent = img.parent
            for _ in range(2):  # Go up 2 levels
                if parent and parent.name and len(parent.find_all('img')) == 1:  # One image per container
                    # Check if this container also has text that looks like a title
                    text_content = parent.get_text(strip=True)
                    if len(text_content) > 10 and len(text_content) < 200:  # Reasonable title length
                        img_containers.append(parent)
                        break
                parent = parent.parent if parent else None
        
        if img_containers:
            print(f"Found {len(set(img_containers))} image-based containers")
            product_containers.extend(list(set(img_containers)))
        
        # Strategy 4: Look for link-rich areas (product cards usually have clickable areas)
        print("Strategy 4: Looking for link-rich containers...")
        link_containers = []
        all_links = soup.find_all('a', href=True)
        for link in all_links[:30]:  # First 30 links
            href = link.get('href', '')
            if any(pattern in href for pattern in ['/item/', 'product', '.html']):
                parent = link.parent
                for _ in range(2):
                    if parent and parent.name:
                        # Check if parent has good content structure
                        if parent.find('img') and len(parent.get_text(strip=True)) > 20:
                            link_containers.append(parent)
                            break
                    parent = parent.parent if parent else None
        
        if link_containers:
            print(f"Found {len(set(link_containers))} link-based containers")
            product_containers.extend(list(set(link_containers)))
        
        # Remove duplicates while preserving order
        seen = set()
        unique_containers = []
        for container in product_containers:
            container_id = id(container)  # Use object id to identify unique elements
            if container_id not in seen:
                seen.add(container_id)
                unique_containers.append(container)
        
        print(f"📦 Total unique containers found: {len(unique_containers)}")
        
        # If we still have no containers, try a broader search
        if not unique_containers:
            print("Strategy 5: Broad search for any structured elements...")
            # Look for any div with multiple child elements
            broad_containers = soup.find_all('div')
            for div in broad_containers[:100]:  # Check first 100 divs
                children = div.find_all(['div', 'span', 'a', 'img'], recursive=False)
                if len(children) >= 3:  # Has at least 3 direct children
                    text_content = div.get_text(strip=True)
                    if 20 < len(text_content) < 300:  # Reasonable content length
                        unique_containers.append(div)
                        if len(unique_containers) >= 20:  # Limit to 20
                            break
        
        # Extract data from containers
        extracted_products = []
        for i, container in enumerate(unique_containers[:30]):  # Limit to first 30
            try:
                # Get all text content
                text_content = container.get_text(separator=' ', strip=True)
                
                # Get all links
                links = [a.get('href') for a in container.find_all('a', href=True) if a.get('href')]
                
                # Get all images
                images = []
                for img in container.find_all('img'):
                    img_src = img.get('src') or img.get('data-src') or img.get('data-original')
                    if img_src:
                        images.append(img_src)
                
                # Get data attributes
                data_attrs = {k: v for k, v in container.attrs.items() if k.startswith('data-')} if hasattr(container, 'attrs') else {}
                
                # Only include containers with meaningful content
                if text_content and len(text_content) > 15:
                    product_data = {
                        'container_index': i,
                        'html_snippet': str(container)[:1000],  # First 1000 chars of HTML
                        'text_content': text_content[:500],  # First 500 chars of text
                        'links': links[:3],  # First 3 links
                        'images': images[:2],  # First 2 images
                        'data_attributes': data_attrs,
                        'tag_name': container.name,
                        'classes': container.get('class', []) if hasattr(container, 'get') else []
                    }
                    extracted_products.append(product_data)
            except Exception as e:
                print(f"Error processing container {i}: {e}")
                continue
        
        print(f"✅ Successfully processed {len(extracted_products)} containers")
        return extracted_products
    
    def extract_products_with_ai(self, extracted_data: List[Dict]) -> Dict:
        """Use DeepSeek R1 to extract structured product data"""
        if not extracted_data:
            return {"products": []}
        
        # Prepare a more focused prompt with the pre-processed data
        system_prompt = """
You are an expert at extracting product information from AliExpress HTML data.

Extract product details from the provided data and return ONLY a valid JSON object with this exact structure:
{
  "products": [
    {
      "title": "product name",
      "price": "price with currency symbol",
      "image": "full image URL",
      "link": "full product URL (ensure it starts with https://)",
      "rating": "rating if available",
      "orders": "number of orders if available"
    }
  ]
}

Important rules:
1. Extract ONLY products that have all required fields (title, price, image, link)
2. Ensure all URLs are complete and valid
3. Clean up titles (remove extra spaces, special characters)
4. Standardize price format
5. Return empty array if no valid products found
6. DO NOT include any text outside the JSON object
7. Maximum 20 products in response
"""
        
        # Create a condensed representation for the AI
        condensed_data = []
        for item in extracted_data[:20]:  # Limit to first 20 items
            condensed_item = {
                'text': item['text_content'][:500],  # Limit text length
                'data_attrs': item['data_attributes'],
                'images': [img for img in item['images'] if img][:3],  # Max 3 images
                'links': [link for link in item['links'] if link][:2]   # Max 2 links
            }
            condensed_data.append(condensed_item)
        
        user_content = f"Product data to extract:\n{json.dumps(condensed_data, indent=2)}"
        
        try:
            print("Sending data to DeepSeek R1 for extraction...")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.1,
                max_tokens=4000
            )
            
            json_content = response.choices[0].message.content
            # Clean up the response in case there's extra text
            json_match = re.search(r'\{.*\}', json_content, re.DOTALL)
            if json_match:
                json_content = json_match.group()
            
            return json.loads(json_content)
            
        except Exception as e:
            print(f"Error during AI extraction: {e}")
            return {"products": []}
    
    async def crawl_with_fallback(self, url: str, browser_config: BrowserConfig) -> str:
        """Crawl with fallback to proxies if needed"""
        print(f"Crawling URL: {url}")
        
        # JavaScript to scroll and wait for content - compatible with crawl4ai v0.7.x
        js_scroll_code = """
        // Scroll down to load more content
        window.scrollTo(0, document.body.scrollHeight/2);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to click "Load More" or similar buttons if they exist
        const loadMoreButtons = document.querySelectorAll('[data-role="load-more"], .load-more, .more-btn');
        if (loadMoreButtons.length > 0) {
            loadMoreButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Additional scroll to trigger lazy loading
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 1000));
        """
        
        # First try without proxy
        print("Attempting to crawl without proxy...")
        run_config = CrawlerRunConfig(
            js_code=js_scroll_code,
            page_timeout=30000,  # 30 seconds timeout
            wait_for="css:div[data-widget-cid]",  # Wait for AliExpress product container
            delay_before_return_html=2.0,  # Wait 2 seconds before capturing HTML
            scan_full_page=True,  # Auto-scroll to load dynamic content
            scroll_delay=0.5,  # Delay between scrolls
            remove_overlay_elements=True,  # Remove popups/modals
            word_count_threshold=10,  # Lower threshold for product data
            excluded_tags=["script", "style", "nav", "footer"],  # Remove unnecessary tags
            verbose=True
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            try:
                result = await crawler.arun(url=url, config=run_config)
                if result.success and len(result.html) > 10000:  # Check if we got substantial content
                    print(f"✅ Successfully crawled without proxy - HTML length: {len(result.html)}")
                    return result.html
                else:
                    print(f"❌ Direct crawl failed - Success: {result.success}, HTML length: {len(result.html) if result.html else 0}")
            except Exception as e:
                print(f"❌ Direct crawl exception: {e}")
        
        # If direct crawl failed, try with a simpler config first
        print("Trying with simplified config...")
        simple_config = CrawlerRunConfig(
            page_timeout=60000,  # Longer timeout
            scan_full_page=True,
            delay_before_return_html=3.0,
            verbose=True
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            try:
                result = await crawler.arun(url=url, config=simple_config)
                if result.success and len(result.html) > 5000:
                    print(f"✅ Successfully crawled with simple config - HTML length: {len(result.html)}")
                    return result.html
            except Exception as e:
                print(f"❌ Simple crawl exception: {e}")
        
        # Try with proxies if available
        print("Trying with proxies...")
        proxy_list = self.fetch_proxies()
        
        if not proxy_list:
            # Last resort: try most basic config
            print("No proxies available. Trying most basic crawl...")
            basic_config = CrawlerRunConfig(verbose=True)
            async with AsyncWebCrawler(config=browser_config) as crawler:
                try:
                    result = await crawler.arun(url=url, config=basic_config)
                    if result.success:
                        print(f"✅ Basic crawl succeeded - HTML length: {len(result.html)}")
                        return result.html
                except Exception as e:
                    print(f"❌ Basic crawl exception: {e}")
            raise RuntimeError("All crawl attempts failed - no proxies available")
        
        # Test proxies in batches
        print("Testing proxies...")
        working_proxies = []
        for i, proxy in enumerate(proxy_list[:15]):  # Test first 15 proxies
            if i % 3 == 0:
                print(f"Tested {i} proxies, found {len(working_proxies)} working")
            
            if self.test_proxy(proxy):
                working_proxies.append(proxy)
                if len(working_proxies) >= 3:  # Stop after finding 3 working proxies
                    break
        
        if not working_proxies:
            print("No working proxies found. Final attempt with basic config...")
            basic_config = CrawlerRunConfig(verbose=True)
            async with AsyncWebCrawler(config=browser_config) as crawler:
                try:
                    result = await crawler.arun(url=url, config=basic_config)
                    if result.success:
                        return result.html
                except Exception as e:
                    print(f"Final crawl attempt failed: {e}")
            raise RuntimeError("All crawl attempts failed - no working proxies found")
        
        print(f"Found {len(working_proxies)} working proxies. Attempting crawl...")
        
        # Try crawling with working proxies
        proxy_configs = [ProxyConfig(server=f"http://{p}") for p in working_proxies]
        proxy_strategy = RoundRobinProxyStrategy(proxy_configs)
        run_config_proxy = CrawlerRunConfig(
            # proxy_rotation_strategy=proxy_strategy,  # Note: This might not be supported in your version
            js_code=js_scroll_code,
            page_timeout=45000,
            scan_full_page=True,
            delay_before_return_html=2.0,
            verbose=True
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            try:
                result = await crawler.arun(url=url, config=run_config_proxy)
                if result.success:
                    print(f"✅ Successfully crawled with proxy - HTML length: {len(result.html)}")
                    return result.html
            except Exception as e:
                print(f"❌ Proxy crawl exception: {e}")
        
        # Final fallback
        raise RuntimeError("All crawl attempts failed including proxy attempts")
    
    def save_results(self, products: List[Dict], query: str):
        """Save results in multiple formats"""
        timestamp = int(time.time())
        
        # Save JSON
        json_file = f"products_{query}_{timestamp}.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump({"products": products, "query": query, "timestamp": timestamp}, f, indent=2)
        print(f"✅ JSON saved to {json_file}")
        
        # Save CSV
        if products:
            csv_file = f"products_{query}_{timestamp}.csv"
            df = pd.DataFrame(products)
            df.to_csv(csv_file, index=False)
            print(f"✅ CSV saved to {csv_file}")
            
            # Save Markdown
            md_file = f"products_{query}_{timestamp}.md"
            with open(md_file, "w", encoding="utf-8") as f:
                f.write(f"# AliExpress Products - {query}\n\n")
                f.write(f"**Search Query:** {query}  \n")
                f.write(f"**Products Found:** {len(products)}  \n")
                f.write(f"**Timestamp:** {timestamp}  \n\n")
                f.write(df.to_markdown(index=False))
            print(f"✅ Markdown saved to {md_file}")
        
        return json_file
    
    async def scrape(self, query: str) -> Dict:
        """Main scraping method"""
        if not query.strip():
            raise ValueError("Query cannot be empty")
        
        # Construct search URL
        url = f"https://www.aliexpress.com/wholesale?SearchText={query.replace(' ', '+')}&page=1"
        
        # Browser configuration for crawl4ai v0.7.x
        browser_config = BrowserConfig(
            headless=True,
            verbose=True,
            browser_type="chromium",
            viewport_width=1920,
            viewport_height=1080,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            java_script_enabled=True,
            ignore_https_errors=True
        )
        
        try:
            # Crawl the page
            html = await self.crawl_with_fallback(url, browser_config)
            
            # Save raw HTML for debugging
            html_file = f"raw_{query}_{int(time.time())}.html"
            with open(html_file, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"📄 Raw HTML saved to {html_file} (Length: {len(html)} chars)")
            
            # Extract product elements
            print("🔍 Extracting product elements...")
            extracted_data = self.extract_product_elements(html)
            print(f"📦 Extracted {len(extracted_data)} product containers")
            
            if not extracted_data:
                print("❌ No product containers found")
                return {"products": [], "error": "No products found", "html_file": html_file}
            
            # Use AI to extract structured data
            print("🤖 Using DeepSeek R1 for data extraction...")
            result = self.extract_products_with_ai(extracted_data)
            products = result.get("products", [])
            
            print(f"✅ Successfully extracted {len(products)} products using AI")
            
            # Save results
            if products:
                self.save_results(products, query)
            else:
                print("⚠️ No valid products extracted by AI")
            
            return {
                "products": products,
                "query": query,
                "total_found": len(products),
                "html_file": html_file,
                "extracted_containers": len(extracted_data)
            }
            
        except Exception as e:
            print(f"❌ Scraping failed: {str(e)}")
            import traceback
            print(f"📋 Full traceback: {traceback.format_exc()}")
            return {"products": [], "error": str(e)}

async def main():
    """Main function to run the scraper"""
    # Check for DeepSeek API key
    if not os.getenv("DEEPSEEK_API_KEY"):
        print("❌ DEEPSEEK_API_KEY environment variable not set")
        print("Please set your DeepSeek API key: export DEEPSEEK_API_KEY='your-api-key'")
        return
    
    # Get search query
    query = input("Enter search query (e.g., 'wireless headphones'): ").strip()
    if not query:
        print("❌ Query is required")
        return
    
    # Initialize and run scraper
    scraper = AliExpressScraper()
    
    print(f"\n🔍 Starting AliExpress scraping for: '{query}'")
    print("=" * 50)
    
    result = await scraper.scrape(query)
    
    print("=" * 50)
    if result.get("error"):
        print(f"❌ Error: {result['error']}")
    else:
        products = result["products"]
        print(f"✅ Scraping completed!")
        print(f"📊 Products found: {len(products)}")
        
        if products:
            print("\n🏷️ Sample products:")
            for i, product in enumerate(products[:3]):  # Show first 3 products
                print(f"\n{i+1}. {product['title'][:60]}...")
                print(f"   💰 Price: {product['price']}")
                print(f"   ⭐ Rating: {product.get('rating', 'N/A')}")
                print(f"   🛒 Orders: {product.get('orders', 'N/A')}")

if __name__ == "__main__":
    asyncio.run(main())