import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  console.log('[AUTH TEST] Request received:', {
    path: event.path,
    httpMethod: event.httpMethod,
    rawPath: event.rawPath
  });

  const path = event.path || '';

  // Simulate /api/auth/me endpoint
  if (path.includes('/auth/me') || path.includes('auth-test/me')) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        test: true,
        endpoint: '/api/auth/me',
        user: null,
        message: 'Test endpoint - simulating auth/me response',
        actualPath: path
      })
    };
  }

  // Simulate /api/auth/oauth/providers endpoint
  if (path.includes('/oauth/providers') || path.includes('auth-test/providers')) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        test: true,
        endpoint: '/api/auth/oauth/providers',
        providers: ['google', 'microsoft'],
        message: 'Test endpoint - simulating oauth/providers response',
        actualPath: path
      })
    };
  }

  // Simulate /api/auth-v2/login/start endpoint
  if (path.includes('/login/start') || path.includes('auth-test/login')) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        test: true,
        endpoint: '/api/auth-v2/login/start',
        message: 'Test endpoint - simulating login/start response',
        actualPath: path
      })
    };
  }

  // Default response
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      test: true,
      message: 'Auth test function is working',
      receivedPath: path,
      availableTests: [
        '/.netlify/functions/auth-test/me',
        '/.netlify/functions/auth-test/providers',
        '/.netlify/functions/auth-test/login'
      ]
    })
  };
};
