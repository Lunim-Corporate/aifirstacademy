// Simple test to check if API endpoints are working
async function testAPI() {
  const baseURL = 'http://localhost:8080';
  
  console.log('Testing API endpoints...');
  
  try {
    // Test /api/auth/me endpoint (should return 401 without token)
    const meResponse = await fetch(`${baseURL}/api/auth/me`);
    console.log(`GET /api/auth/me: ${meResponse.status} ${meResponse.statusText}`);
    
    // Test /api/dashboard endpoint (should return 401 without token)
    const dashboardResponse = await fetch(`${baseURL}/api/dashboard`);
    console.log(`GET /api/dashboard: ${dashboardResponse.status} ${dashboardResponse.statusText}`);
    
    // Test /api/learning/tracks endpoint
    const tracksResponse = await fetch(`${baseURL}/api/learning/tracks`);
    console.log(`GET /api/learning/tracks: ${tracksResponse.status} ${tracksResponse.statusText}`);
    
    if (tracksResponse.ok) {
      const data = await tracksResponse.json();
      console.log(`Tracks data:`, data);
    }
    
  } catch (error) {
    console.error('API test failed:', error);
  }
}

// Run test if server is running
testAPI();
