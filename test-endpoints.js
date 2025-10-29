// Quick test script to verify API endpoints
// Run with: node test-endpoints.js

const BASE_URL = process.argv[2] || 'http://localhost:8888';

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, options);
    const status = response.status;
    const statusText = response.statusText;
    
    let body;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }
    
    const emoji = status < 400 || status === 401 ? '✅' : '❌';
    console.log(`   ${emoji} Status: ${status} ${statusText}`);
    
    if (status === 502) {
      console.log(`   ❌ 502 ERROR DETECTED - Function failed to respond`);
    }
    
    console.log(`   Response:`, JSON.stringify(body, null, 2).substring(0, 200));
    
    return { name, status, success: status < 400 || status === 401 };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { name, status: 'ERROR', success: false, error: error.message };
  }
}

async function runTests() {
  console.log(`\n🚀 Testing endpoints at: ${BASE_URL}\n`);
  console.log('=' .repeat(60));
  
  const results = [];
  
  // Test health check
  results.push(await testEndpoint(
    'Health Check',
    `${BASE_URL}/health`
  ));
  
  // Test auth test endpoints
  results.push(await testEndpoint(
    'Test Auth Me',
    `${BASE_URL}/test-auth/me`
  ));
  
  results.push(await testEndpoint(
    'Test OAuth Providers',
    `${BASE_URL}/test-auth/providers`
  ));
  
  // Test real API endpoints
  results.push(await testEndpoint(
    'API Ping',
    `${BASE_URL}/api/ping`
  ));
  
  results.push(await testEndpoint(
    'API Health',
    `${BASE_URL}/api/health`
  ));
  
  results.push(await testEndpoint(
    'API Auth Me (expect 401)',
    `${BASE_URL}/api/auth/me`
  ));
  
  results.push(await testEndpoint(
    'API OAuth Providers',
    `${BASE_URL}/api/auth/oauth/providers`
  ));
  
  results.push(await testEndpoint(
    'API Auth-V2 Login Start',
    `${BASE_URL}/api/auth-v2/login/start`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'test' })
    }
  ));
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY:\n');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const has502 = results.filter(r => r.status === 502).length;
  
  console.log(`   Total Tests: ${results.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (has502 > 0) {
    console.log(`   \n   ⚠️  WARNING: ${has502} endpoint(s) returned 502 errors!`);
    console.log('   This indicates the Netlify function is failing to initialize or respond.');
    console.log('   Check Netlify function logs for details.\n');
  } else {
    console.log(`   \n   🎉 No 502 errors detected! Functions are responding.\n`);
  }
  
  if (failed > 0) {
    console.log('\nFailed endpoints:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: ${r.status} ${r.error || ''}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

runTests().catch(console.error);
