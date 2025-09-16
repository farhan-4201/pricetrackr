import os
from typing import Dict, List

class Config:
    """Configuration class for the scraper"""
    
    # MongoDB Configuration
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'aliexpress_data')
    
    # Scraping Configuration
    DEFAULT_MAX_PAGES = int(os.getenv('DEFAULT_MAX_PAGES', '3'))
    REQUEST_TIMEOUT = int(os.getenv('REQUEST_TIMEOUT', '30'))
    MAX_CONCURRENT_REQUESTS = int(os.getenv('MAX_CONCURRENT_REQUESTS', '10'))
    
    # Delay Configuration (in seconds)
    MIN_REQUEST_DELAY = float(os.getenv('MIN_REQUEST_DELAY', '1.0'))
    MAX_REQUEST_DELAY = float(os.getenv('MAX_REQUEST_DELAY', '3.0'))
    PAGE_DELAY_MIN = float(os.getenv('PAGE_DELAY_MIN', '2.0'))
    PAGE_DELAY_MAX = float(os.getenv('PAGE_DELAY_MAX', '4.0'))
    
    # User Agent Configuration
    ROTATE_USER_AGENTS = os.getenv('ROTATE_USER_AGENTS', 'true').lower() == 'true'
    
    # Proxy Configuration (Optional)
    USE_PROXIES = os.getenv('USE_PROXIES', 'false').lower() == 'true'
    PROXY_LIST = os.getenv('PROXY_LIST', '').split(',') if os.getenv('PROXY_LIST') else []
    
    # Export Configuration
    EXPORT_JSON_BY_DEFAULT = os.getenv('EXPORT_JSON_BY_DEFAULT', 'true').lower() == 'true'
    JSON_EXPORT_DIR = os.getenv('JSON_EXPORT_DIR', './exports/')
    
    # Logging Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'aliexpress_scraper.log')
    
    # Anti-Bot Measures
    ENABLE_CAPTCHA_DETECTION = os.getenv('ENABLE_CAPTCHA_DETECTION', 'true').lower() == 'true'
    MAX_RETRIES = int(os.getenv('MAX_RETRIES', '3'))
    
    # AliExpress Specific
    DEFAULT_SHIP_TO_COUNTRY = os.getenv('DEFAULT_SHIP_TO_COUNTRY', 'US')
    DEFAULT_CURRENCY = os.getenv('DEFAULT_CURRENCY', 'USD')
    
    @classmethod
    def get_headers_template(cls) -> Dict[str, str]:
        """Get default headers template"""
        return {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        }

# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: aliexpress_mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: aliexpress_data
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - scraper_network

  scraper:
    build: .
    container_name: aliexpress_scraper
    restart: unless-stopped
    depends_on:
      - mongodb
    environment:
      - MONGODB_URI=mongodb://admin:password123@mongodb:27017/aliexpress_data?authSource=admin
      - DATABASE_NAME=aliexpress_data
      - DEFAULT_MAX_PAGES=5
      - LOG_LEVEL=INFO
    volumes:
      - ./exports:/app/exports
      - ./logs:/app/logs
    networks:
      - scraper_network
    command: tail -f /dev/null  # Keep container running

volumes:
  mongodb_data:

networks:
  scraper_network:
    driver: bridge

# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/exports /app/logs

# Make the script executable
RUN chmod +x aliexpress_scraper.py

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose port (if needed for future web interface)
EXPOSE 8000

CMD ["python", "aliexpress_scraper.py"]