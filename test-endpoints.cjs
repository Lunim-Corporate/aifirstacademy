// Comprehensive test for AI First Academy API endpoints
const http = require('http');
const https = require('https');
const querystring = require('querystring');

const BASE_URL = 'http://localhost:8081';

// Helper function to make HTTP requests
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Connection failed: ${err.message} (${err.code})`));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testEndpoint(method, endpoint, body = null, headers = {}, expectedStatus = null) {
  try {
    console.log(`\n🔄 Testing: ${method} ${endpoint}`);
    const response = await makeRequest(method, endpoint, body, headers);
    
    const statusEmoji = response.status < 400 ? '✅' : '❌';
    console.log(`${statusEmoji} Status: ${response.status}`);
    
    if (expectedStatus && response.status !== expectedStatus) {
      console.log(`⚠️  Expected ${expectedStatus}, got ${response.status}`);
    }
    
    if (response.data && typeof response.data === 'object') {
      if (response.data.error) {
        console.log(`   Error: ${response.data.error}`);
      } else if (response.data.message) {
        console.log(`   Message: ${response.data.message}`);
      } else {
        const keys = Object.keys(response.data).slice(0, 3);
        console.log(`   Response keys: ${keys.join(', ')}${keys.length < Object.keys(response.data).length ? '...' : ''}`);
      }
    }
    
    return response;
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}: ${error.message}`);
    return { status: 0, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting AI First Academy API Tests');
  console.log('=====================================');
  
  let authToken = null;
  
  // Test 1: Health check
  console.log('\n📋 HEALTH CHECKS');
  await testEndpoint('GET', '/api/ping');
  
  // Test 2: OAuth providers (should work)
  await testEndpoint('GET', '/api/auth/oauth/providers');
  
  // Test 3: Auth/me without token (should fail with 401)
  await testEndpoint('GET', '/api/auth/me', null, {}, 401);
  
  // Test 4: Create test user
  console.log('\n👤 USER CREATION');
  const signupResult = await testEndpoint('POST', '/api/auth/signup', {
    name: 'Test User',
    email: 'test@example.com',
    password: 'testpass123'
  });
  
  if (signupResult.status === 201 || signupResult.status === 409) {
    console.log('   ✅ User creation successful or user already exists');
    
    if (signupResult.status === 201 && signupResult.data?.token) {
      authToken = signupResult.data.token;
      console.log('   🎫 Auth token obtained from signup');
    }
  }
  
  // Test 5: Login if we don't have token from signup
  if (!authToken) {
    console.log('\n🔑 LOGIN TESTS');
    const loginResult = await testEndpoint('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'testpass123'
    });
    
    if (loginResult.status === 200 && loginResult.data?.token) {
      authToken = loginResult.data.token;
      console.log('   🎫 Auth token obtained from login');
    }
  }
  
  // Test 6: Test authenticated endpoints
  if (authToken) {
    console.log('\n🔒 AUTHENTICATED ENDPOINTS');
    const authHeaders = { 'Authorization': `Bearer ${authToken}` };
    
    await testEndpoint('GET', '/api/auth/me', null, authHeaders);
    await testEndpoint('GET', '/api/settings/profile', null, authHeaders);
    await testEndpoint('GET', '/api/settings/notifications', null, authHeaders);
    await testEndpoint('GET', '/api/settings/security', null, authHeaders);
    await testEndpoint('GET', '/api/settings/billing', null, authHeaders);
    await testEndpoint('GET', '/api/settings/preferences', null, authHeaders);
    
    // Test profile update
    await testEndpoint('PUT', '/api/settings/profile', {
      personaRole: 'engineer',
      displayName: 'Test User Updated',
      bio: 'This is a test bio'
    }, authHeaders);
    
  } else {
    console.log('\n❌ No auth token available - skipping authenticated tests');
  }
  
  // Test 7: Public endpoints
  console.log('\n🌍 PUBLIC ENDPOINTS');
  await testEndpoint('GET', '/api/learning/tracks');
  await testEndpoint('GET', '/api/marketing/product');
  await testEndpoint('GET', '/api/community/prompts');
  await testEndpoint('GET', '/api/community/discussions');
  
  // Test 8: Logout
  if (authToken) {
    console.log('\n👋 LOGOUT TEST');
    await testEndpoint('POST', '/api/auth/logout', null, { 'Authorization': `Bearer ${authToken}` });
  }
  
  console.log('\n🎉 Tests completed!');
  console.log('\n📊 SUMMARY:');
  console.log('- If you see mostly ✅ green checkmarks, the API is working correctly');
  console.log('- ❌ Red X marks indicate issues that need attention');
  console.log('- 401/404 errors on /api/auth/me without token are expected and normal');
  
  if (authToken) {
    console.log('\n🎫 Authentication is working correctly!');
    console.log('You can now use the main application without issues.');
  } else {
    console.log('\n⚠️  Authentication issues detected.');
    console.log('Check server logs and user creation process.');
  }
}

// Run the tests
runTests().catch(console.error);
