import serverless from "serverless-http";
import express from "express";
import { createServer } from "../../server/index.ts";

// Build the Express app once at init time so Netlify bundles it
const app = createServer();

// Wrap the app to normalize paths Netlify passes to the function
const adapter = express();

// Enhanced logging and path transformation middleware
adapter.use((req, _res, next) => {
  const originalUrl = req.url || "";
  let url = originalUrl;
  
  console.log(`[NETLIFY FUNCTION] Incoming request:`, {
    method: req.method,
    originalUrl,
    headers: req.headers,
    path: req.path
  });
  
  // Strip Netlify function mount prefix if present
  // When redirects pass /api/auth/me -> /.netlify/functions/api/auth/me
  url = url.replace(/^\/\.netlify\/functions\/api/, "");
  
  // The redirect uses :splat which passes the remaining path
  // If url is empty or just "/", something's wrong
  if (!url || url === "/") {
    console.error(`[PATH ERROR] Empty URL after stripping function prefix. Original: ${originalUrl}`);
    url = originalUrl; // Fallback to original
  }
  
  // Ensure API prefix for our Express routes
  // But check if it already has /api to prevent double prefixing
  if (!url.startsWith("/api/") && !url.startsWith("/api")) {
    url = "/api" + (url.startsWith("/") ? url : "/" + url);
  }
  
  console.log(`[PATH TRANSFORM] ${req.method} ${originalUrl} -> ${url}`);
  req.url = url;
  next();
});

adapter.use(app);

// Export serverless handler with enhanced error handling
export const handler = serverless(adapter, {
  binary: false,
  request(req, event, context) {
    console.log(`[SERVERLESS] Event path: ${event.path}, Raw path: ${event.rawPath}`);
    req.netlifyContext = context;
    req.netlifyEvent = event;
  },
});