// Connectivity test script
import axios from 'axios';
import { chromium } from 'playwright';
import dns from 'dns';

async function testDarazConnectivity() {
  console.log('🔍 Testing Daraz connectivity...\n');

  // Test 1: DNS Resolution
  console.log('📡 Testing DNS resolution...');
  try {
    const addresses = await new Promise((resolve, reject) => {
      dns.resolve4('www.daraz.pk', (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    console.log(`✅ DNS resolution successful: ${addresses}`);
  } catch (error) {
    console.log(`❌ DNS resolution failed: ${error.message}`);
    return false;
  }

  // Test 2: Direct HTTP request
  console.log('🌐 Testing direct HTTP request...');
  try {
    const response = await axios.get('https://www.daraz.pk', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    console.log(`✅ HTTP request successful: Status ${response.status}`);
  } catch (error) {
    console.log(`❌ HTTP request failed: ${error.message}`);
    return false;
  }

  // Test 3: Specific API endpoint
  console.log('🔗 Testing API endpoint...');
  try {
    const response = await axios.get('https://www.daraz.pk/catalog/?_keyori=ss&ajax=true&q=iphone', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    console.log(`✅ API endpoint reachable: Status ${response.status}`);
  } catch (error) {
    console.log(`❌ API endpoint failed: ${error.message}`);
    return false;
  }

  return true;
}

async function testPriceOyeConnectivity() {
  console.log('\n🔍 Testing PriceOye connectivity...\n');

  // Test 1: DNS Resolution
  console.log('📡 Testing DNS resolution...');
  try {
    const addresses = await new Promise((resolve, reject) => {
      dns.resolve4('www.priceoye.pk', (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    console.log(`✅ DNS resolution successful: ${addresses}`);
  } catch (error) {
    console.log(`❌ DNS resolution failed: ${error.message}`);
    return false;
  }

  // Test 2: Browser navigation test
  console.log('🌐 Testing browser navigation...');
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://priceoye.pk', { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log(`✅ Browser navigation successful: ${page.url()}`);

    await browser.close();
  } catch (error) {
    console.log(`❌ Browser navigation failed: ${error.message}`);
    return false;
  }

  return true;
}

async function testLocalNetwork() {
  console.log('\n🔍 Testing local network connectivity...\n');

  // Test 1: Google DNS
  try {
    const response = await axios.get('https://google.com', { timeout: 5000 });
    console.log('✅ Google connectivity: OK');
  } catch (error) {
    console.log('❌ Google connectivity failed - likely network issues');
    return false;
  }

  // Test 2: HTTP Bin (test external connectivity)
  try {
    const response = await axios.get('https://httpbin.org/get', { timeout: 5000 });
    console.log('✅ External API connectivity: OK');
  } catch (error) {
    console.log('❌ External API connectivity failed');
    return false;
  }

  return true;
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive connectivity test...\n');

  const results = [];

  // Test local network first
  const localNetwork = await testLocalNetwork();
  results.push({ test: 'Local Network', success: localNetwork });

  if (localNetwork) {
    // Only test targets if local network is working
    const daraz = await testDarazConnectivity();
    results.push({ test: 'Daraz Connectivity', success: daraz });

    const priceoye = await testPriceOyeConnectivity();
    results.push({ test: 'PriceOye Connectivity', success: priceoye });
  }

  // Summary
  console.log('\n📊 Test Results:');
  console.log('='.repeat(50));
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${result.test}: ${status}`);
  });

  const allPassed = results.every(r => r.success);
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (!allPassed) {
    console.log('\n💡 Troubleshooting Recommendations:');
    console.log('1. Check your internet connection');
    console.log('2. Try changing DNS servers (8.8.8.8, 1.1.1.1)');
    console.log('3. Disable VPN/proxy if using one');
    console.log('4. Try accessing the websites manually in a browser');
    console.log('5. Check if firewall/antivirus is blocking the connections');
    console.log('6. Verify the websites are accessible in your region');
  }

  return allPassed;
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});

export { testDarazConnectivity, testPriceOyeConnectivity, testLocalNetwork };
