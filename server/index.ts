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

export function createServer() {
  const app = express();

  // Middleware
  app.set("trust proxy", true);
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  // Aliases
  app.post("/api/generate-certificate", issueCertificateHandler);
  app.get("/api/verify/:credentialId", verifyCertificateHandler);

  return app;
}
