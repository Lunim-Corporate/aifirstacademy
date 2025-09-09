import serverless from "serverless-http";

// Create the handler with proper error handling
export const handler = async (event: any, context: any) => {
  try {
    // Dynamically import the createServer function
    const { createServer } = await import("../../server/index");
    
    // Create the Express app
    const app = createServer();
    
    // Create the serverless handler
    const serverlessHandler = serverless(app, {
      binary: false,
      request(req: any, event: any, context: any) {
        req.netlifyContext = context;
        req.netlifyEvent = event;
      },
    });
    
    return await serverlessHandler(event, context);
  } catch (error: any) {
    console.error('Netlify function error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      })
    };
  }
};
