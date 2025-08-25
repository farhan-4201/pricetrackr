import requests

proxies = {
    "http": "http://210.16.85.42:8080",
    "http": "http://142.93.185.89:3128",
}

try:
    response = requests.get("http://httpbin.org/ip", proxies=proxies, timeout=10)
    print("Proxy is working:", response.text)
except Exception as e:
    print("Proxy failed:", e)
