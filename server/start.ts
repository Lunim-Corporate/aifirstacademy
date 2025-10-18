import { createServer } from "./index";
import path from "path";
import fs from "fs";

const PORT = process.env.PORT || 3000;
const app = createServer();

// Optional: attach Vite dev middleware to serve the SPA on the same port
// Enable with DEV_FRONTEND=true
(async () => {
  if (process.env.DEV_FRONTEND === 'true') {
    try {
      const vite = await (await import('vite')).createServer({
        root: path.join(__dirname, ".."), // project root
        server: { middlewareMode: true },
        appType: 'custom'
      });

      // Use Vite's connect instance as middleware
      (app as any).use(vite.middlewares);

      // Fallback to index.html for SPA routes
      (app as any).use(async (req: any, res: any, next: any) => {
        const url = req.originalUrl;
        if (url.startsWith('/api/')) return next();
        try {
          const indexHtmlPath = path.join(path.join(__dirname, ".."), 'index.html');
          let template = fs.readFileSync(indexHtmlPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          next(e);
        }
      });

      console.log("Vite middleware attached: frontend served from the same port");
    } catch (err) {
      console.error("Failed to attach Vite middleware:", err);
    }
  }
})();

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});