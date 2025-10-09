const serverless = require("serverless-http");

// Create the handler with proper error handling
exports.handler = async (event, context) => {
  try {
    // Dynamically import the createServer function with proper error handling
    let createServer;
    try {
      // Use dynamic import for ES modules from CommonJS
      const serverModule = await import("../../server/index.js");
      
      // Handle both ES module and CommonJS exports
      createServer = serverModule.createServer || serverModule.default?.createServer || serverModule.default;
      
      if (!createServer) {
        console.error('Available exports:', Object.keys(serverModule));
        throw new Error('createServer function not found in server module');
      }
      
      console.log('Successfully imported createServer function');
    } catch (importError) {
      console.error('Failed to import server module:', importError);
      console.error('Import error details:', {
        message: importError.message,
        stack: importError.stack,
        code: importError.code
      });
      throw new Error(`Module import failed: ${importError.message}`);
    }
    
    // Create the Express app
    console.log('Creating Express app...');
    const app = createServer();
    
    if (!app) {
      throw new Error('Failed to create Express app - createServer returned null/undefined');
    }
    
    console.log('Express app created successfully');
    
    // Create the serverless handler
    const serverlessHandler = serverless(app, {
      binary: false,
      request(req, event, context) {
        req.netlifyContext = context;
        req.netlifyEvent = event;
      },
    });
    
    console.log('Executing serverless handler...');
    return await serverlessHandler(event, context);
  } catch (error) {
    console.error('=== Netlify Function Error Debug Info ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Event path:', event?.path);
    console.error('HTTP method:', event?.httpMethod);
    console.error('Environment NODE_ENV:', process.env.NODE_ENV);
    console.error('Function directory:', __dirname);
    console.error('Process versions:', process.versions);
    
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
