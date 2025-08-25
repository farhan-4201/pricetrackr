import requests
from bs4 import BeautifulSoup

def scrape_ebay(product_name):
    url = f"https://www.ebay.com/sch/i.html?_nkw={product_name}"
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "html.parser")
    results = []

    for item in soup.select(".s-item"):
        name = item.select_one(".s-item__title")
        price = item.select_one(".s-item__price")
        link = item.select_one(".s-item__link")["href"]

        if name and price:
            results.append({
                "name": name.text.strip(),
                "price": price.text.strip(),
                "url": link,
                "marketplace": "eBay"
            })
    return results
