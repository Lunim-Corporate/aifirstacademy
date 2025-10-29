import serverless from "serverless-http";
import express from "express";
import { createServer } from "../../server";

// Build the Express app once at init time so Netlify bundles it
const app = createServer();

// Wrap the app to restore the "/api" prefix stripped by Netlify redirects
const adapter = express();
adapter.use((req, _res, next) => {
  if (req.url && !req.url.startsWith("/api/")) {
    req.url = `/api${req.url}`;
  }
  next();
});
adapter.use(app);

// Export serverless handler
export const handler = serverless(adapter, {
  binary: false,
  request(req: any, event: any, context: any) {
    (req as any).netlifyContext = context;
    (req as any).netlifyEvent = event;
  },
});
