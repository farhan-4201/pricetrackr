import requests
from bs4 import BeautifulSoup

def scrape_daraz(product_name):
    url = f"https://www.daraz.pk/catalog/?q={product_name}"
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "html.parser")
    results = []

    for item in soup.select(".info--ifj7U"):
        name = item.select_one(".title--wFj93")
        price = item.select_one(".price--NVB62")
        link = item.select_one("a")["href"]

        if name and price:
            results.append({
                "name": name.text.strip(),
                "price": price.text.strip(),
                "url": "https:" + link,
                "marketplace": "Daraz"
            })
    return results
