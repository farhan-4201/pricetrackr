import axios from 'axios';
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testEbayCredentials(retries = 3) {
  try {
    const appId = process.env.EBAY_APP_ID;
    const oauthToken = process.env.EBAY_OAUTH_TOKEN;

    console.log('🔍 Testing eBay API Credentials');
    console.log('='.repeat(40));
    console.log('App ID:', appId ? '✅ Configured' : '❌ Missing');
    console.log('OAuth Token:', oauthToken ? '✅ Configured' : '❌ Missing');
    console.log('');

    if (!appId || !oauthToken) {
      console.log('❌ Missing required credentials');
      return;
    }

    const url = 'https://svcs.ebay.com/services/search/FindingService/v1';
    const params = {
      'OPERATION-NAME': 'findItemsByKeywords',
      'SERVICE-VERSION': '1.0.0',
      'SECURITY-APPNAME': appId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      'keywords': 'iPhone 15',
      'paginationInput.entriesPerPage': '5',
      'sortOrder': 'BestMatch',
      'GLOBAL-ID': 'EBAY-US'
    };

    console.log('📡 Making API request to eBay...');
    const startTime = Date.now();

    const response = await axios.get(url, {
      params,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const endTime = Date.now();
    console.log(`⏱️  Response time: ${endTime - startTime}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    // Handle successful API response
    const searchResult = response.data?.findItemsByKeywordsResponse?.[0];
    const items = searchResult?.searchResult?.[0]?.item;

    if (items?.length > 0) {
      console.log(`✅ Success! Found ${items.length} items`);
      console.log('\n📋 Sample item:');
      const firstItem = items[0];
      console.log(`Title: ${firstItem.title?.[0] ?? 'N/A'}`);
      const price = firstItem.sellingStatus?.[0]?.currentPrice?.[0]?.__value__;
      console.log(`Price: $${price ?? 'N/A'} USD`);
    } else {
      console.log('⚠️  API responded but no items found');
    }

    console.log('\n🎉 eBay API credentials test completed!');
  } catch (error) {
    // Retry logic for rate-limits
    if (error.response && (error.response.status === 500 || error.response.status === 429)) {
      const retryAfter = error.response.headers['retry-after']
        ? parseInt(error.response.headers['retry-after'], 10) * 1000
        : 2000; // default 2s wait
      if (retries > 0) {
        console.warn(`⚠️ Rate limit hit. Retrying in ${retryAfter}ms... (${retries} retries left)`);
        await sleep(retryAfter);
        return testEbayCredentials(retries - 1);
      }
    }

    console.error('❌ API Test Failed:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status} - ${error.response.statusText}`);
      if (error.response.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
    } else if (error.code === 'ENOTFOUND') {
      console.error('Network error: Cannot reach eBay API');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('Timeout: eBay API took too long to respond');
    }
  }
}

testEbayCredentials();
