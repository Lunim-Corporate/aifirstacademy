// Simple test script to verify API endpoints work correctly
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8081';

async function testEndpoint(method, endpoint, body = null, headers = {}) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`${method} ${endpoint}: ${response.status}`);
    if (!response.ok) {
      console.log('  Error:', data.error || data.message);
    } else {
      console.log('  Success:', Object.keys(data).join(', '));
    }
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`${method} ${endpoint}: ERROR -`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('Testing AI First Academy API Endpoints\n');
  
  // Test 1: Check /api/auth/me without authentication (should fail)
  console.log('=== Authentication Tests ===');
  await testEndpoint('GET', '/api/auth/me');
  
  // Test 2: Try to create a test user
  const signupResult = await testEndpoint('POST', '/api/auth/signup', {
    name: 'Test User',
    email: 'test@example.com',
    password: 'testpassword123'
  });
  
  let authToken = null;
  if (signupResult.success) {
    authToken = signupResult.data.token;
    console.log('  Auth Token obtained:', authToken ? 'Yes' : 'No');
  }
  
  // Test 3: Test /api/auth/me with authentication
  if (authToken) {
    await testEndpoint('GET', '/api/auth/me', null, {
      'Authorization': `Bearer ${authToken}`
    });
  }
  
  // Test 4: Test settings endpoints
  console.log('\n=== Settings Tests ===');
  if (authToken) {
    await testEndpoint('GET', '/api/settings/profile', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    await testEndpoint('PUT', '/api/settings/profile', {
      personaRole: 'engineer',
      displayName: 'Test User Updated',
      bio: 'This is a test bio'
    }, {
      'Authorization': `Bearer ${authToken}`
    });
  }
  
  // Test 5: Test other API endpoints
  console.log('\n=== Other API Tests ===');
  await testEndpoint('GET', '/api/learning/tracks');
  await testEndpoint('GET', '/api/marketing/product');
  
  console.log('\n=== Test Complete ===');
}

runTests().catch(console.error);
