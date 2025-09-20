import priceOyeScraper from './priceoye_api_scraper.js';

const results = await priceOyeScraper('HP core i7 laptop');
console.log(results);
