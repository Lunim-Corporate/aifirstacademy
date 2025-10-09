import serverless from "serverless-http";

// Create the handler with proper error handling
export const handler = async (event: any, context: any) => {
  try {
    // Dynamically import the createServer function with proper error handling
    let createServer;
    try {
      const serverModule = await import("../../server/index");
      // Handle both ES module and CommonJS exports
      createServer = serverModule.createServer || serverModule.default?.createServer || serverModule.default;
      
      if (!createServer) {
        throw new Error('createServer function not found in server module');
      }
    } catch (importError: any) {
      console.error('Failed to import server module:', importError);
      throw new Error(`Module import failed: ${importError.message}`);
    }
    
    // Create the Express app
    const app = createServer();
    
    if (!app) {
      throw new Error('Failed to create Express app - createServer returned null/undefined');
    }
    
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
    console.error('=== Netlify Function Error Debug Info ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Event:', JSON.stringify(event, null, 2));
    console.error('Context:', JSON.stringify(context, null, 2));
    console.error('Environment NODE_ENV:', process.env.NODE_ENV);
    console.error('Function directory:', __dirname);
    
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
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV !== 'production' && { 
          stack: error.stack,
          eventPath: event?.path,
          httpMethod: event?.httpMethod
        })
      })
    };
  }
};
