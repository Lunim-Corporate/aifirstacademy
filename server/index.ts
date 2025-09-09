import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import authRouter from "./routes/auth";
import sandboxRouter from "./routes/sandbox";
import communityRouter from "./routes/community";
import learningRouter from "./routes/learning";
import libraryRouter from "./routes/library";
import searchRouter from "./routes/search";
import notificationsRouter from "./routes/notifications";
import marketingRouter from "./routes/marketing";
import dashboardRouter from "./routes/dashboard";
import certificatesRouter, { verifyCertificate as verifyCertificateHandler, issueCertificate as issueCertificateHandler } from "./routes/certificates";
import settingsRouter from "./routes/settings";
import adminRouter from "./routes/admin";

// Export the server creation function
export function createServer() {
  const app = express();

  // Global error handler for unhandled errors
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });

  // Middleware
  app.set("trust proxy", true);
  
  // CORS with more specific configuration
  app.use(cors({
    origin: true, // Allow all origins in development, configure properly in production
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
  }));
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  // Auth provider status (informational)
  const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const hasMs = !!((process.env.MS_CLIENT_ID || process.env.AZURE_AD_CLIENT_ID) && (process.env.MS_CLIENT_SECRET || process.env.AZURE_AD_CLIENT_SECRET));
  const enabled = [hasGoogle ? "google" : null, hasMs ? "microsoft" : null].filter(Boolean).join(", ") || "none";
  console.info(`[auth] OAuth providers enabled: ${enabled}`);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Placeholder endpoint for avatars and images
  app.get("/api/placeholder/:width/:height", (req, res) => {
    const { width, height } = req.params;
    const w = parseInt(width) || 32;
    const h = parseInt(height) || 32;
    
    // Generate a simple SVG placeholder
    const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" fill="#e2e8f0"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="${Math.min(w, h) / 4}" fill="#64748b">${w}×${h}</text>
    </svg>`;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);
  });

  // Application routes
  app.use("/api/auth", authRouter);
  app.use("/api/sandbox", sandboxRouter);
  app.use("/api/community", communityRouter);
  app.use("/api/learning", learningRouter);
  app.use("/api/library", libraryRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/marketing", marketingRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/certificates", (certificatesRouter as any));
  app.use("/api/settings", (settingsRouter as any));
  app.use("/api/admin", adminRouter);

  // Aliases
  app.post("/api/generate-certificate", issueCertificateHandler);
  app.get("/api/verify/:credentialId", verifyCertificateHandler);

  // Global error handling middleware (must be last)
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Global error handler caught:', err);
    console.error('Error stack:', err.stack);
    
    if (res.headersSent) {
      return next(err);
    }
    
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(status).json({ 
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  // 404 handler for API routes only (don't interfere with Vite dev assets)
  app.use('/api/*path', (req, res) => {
    console.log(`404 - API route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'API endpoint not found' });
  });

  return app;
}
