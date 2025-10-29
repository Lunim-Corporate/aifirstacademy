import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { handleDemo } from "./routes/demo";
import authRouter from "./routes/auth";
import authEnhancedRouter from "./routes/auth-enhanced";
import sandboxRouter from "./routes/sandbox-ai";
import communityRouter from "./routes/community-supabase";
import learningRouter from "./routes/learning-supabase";
import libraryRouter from "./routes/library-supabase";
import searchRouter from "./routes/search";
import notificationsRouter from "./routes/notifications";
import marketingRouter from "./routes/marketing";
import dashboardRouter from "./routes/dashboard";
import certificatesRouter, { verifyCertificate as verifyCertificateHandler, issueCertificate as issueCertificateHandler } from "./routes/certificates";
import settingsRouter from "./routes/settings-supabase";
import adminRouter from "./routes/admin";
import analyticsRouter from "./routes/analytics";
import { checkSupabaseConnection } from "./supabase";
import { cleanupExpiredSessions } from "./middleware/auth-enhanced";

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

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  
  // Middleware - Configure trust proxy properly for development vs production
  if (process.env.NODE_ENV === 'production') {
    // In production, trust the first proxy (like Netlify, Vercel, etc.)
    app.set("trust proxy", 1);
  } else {
    // In development, don't trust proxies to avoid rate limiting bypass warnings
    app.set("trust proxy", false);
  }
  
  // General rate limiting with proper trust proxy configuration
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMITED',
      retryAfter: 900 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in development if needed
    skip: process.env.NODE_ENV === 'development' ? () => false : undefined,
    // Use default IP-based key generation to avoid IPv6 issues
    // The library handles IPv6 normalization automatically
  });
  app.use(generalLimiter);
  
  // CORS with dynamic allowlist (supports Netlify env URLs)
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowlist = [
        process.env.FRONTEND_URL,
        process.env.CORS_ORIGIN,
        process.env.URL, // Netlify primary URL
        process.env.DEPLOY_PRIME_URL, // Netlify preview URL
        'http://localhost:3000'
      ].filter(Boolean) as string[];
      const ok = allowlist.some((u) => origin === u || origin.startsWith(`${u}/`));
      return callback(null, ok);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
  }));
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser()); // Add cookie parser for handling cookies
  
  // Enhanced request logging middleware
  app.use((req, res, next) => {
    console.log(`[SERVER] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    console.log(`[SERVER] Path: ${req.path}, BaseURL: ${req.baseUrl}, URL: ${req.url}`);
    console.log(`[SERVER] Headers:`, {
      host: req.get('host'),
      origin: req.get('origin'),
      'user-agent': req.get('user-agent')?.substring(0, 50)
    });
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

  // Health check endpoints
  app.get("/api/health", async (_req, res) => {
    try {
      const supabaseHealth = await checkSupabaseConnection();
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          supabase: supabaseHealth,
        },
        environment: {
          node_env: process.env.NODE_ENV,
          has_supabase_url: !!process.env.SUPABASE_URL,
          has_supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        }
      };
      
      const statusCode = supabaseHealth.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });

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
  app.use("/api/auth", authRouter); // Legacy auth routes (for backward compatibility)
  app.use("/api/auth-v2", authEnhancedRouter); // Enhanced auth routes
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
  app.use("/api/analytics", analyticsRouter);

  // Aliases
  app.post("/api/generate-certificate", issueCertificateHandler);
  app.get("/api/verify/:credentialId", verifyCertificateHandler);

  // Start session cleanup interval (run every hour)
  setInterval(async () => {
    try {
      const cleanedCount = await cleanupExpiredSessions();
      if (cleanedCount > 0) {
        console.log(`Cleanup completed: ${cleanedCount} expired sessions removed`);
      }
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }, 60 * 60 * 1000); // 1 hour

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
      code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  // 404 handler for API routes only
  app.use('/api', (req, res, next) => {
    // Only handle API routes that weren't matched
    if (!res.headersSent) {
      res.status(404).json({
        error: 'API endpoint not found',
        code: 'API_NOT_FOUND',
        path: req.originalUrl
      });
    } else {
      next();
    }
  });

  return app;
}

// Also export as default for compatibility
export default { createServer };
