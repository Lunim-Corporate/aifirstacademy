import serverless from "serverless-http";
import { createServer } from "../../server";

// Build the Express app once at init time so Netlify bundles it
const app = createServer();

// Export serverless handler
export const handler = serverless(app, {
  binary: false,
  request(req: any, event: any, context: any) {
    (req as any).netlifyContext = context;
    (req as any).netlifyEvent = event;
  },
});
