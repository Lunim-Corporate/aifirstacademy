import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  console.log('[HEALTH CHECK] Request received:', {
    path: event.path,
    httpMethod: event.httpMethod,
    headers: event.headers
  });

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      function: 'health-check',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      path: event.path,
      message: 'Netlify function is working correctly'
    })
  };
};
