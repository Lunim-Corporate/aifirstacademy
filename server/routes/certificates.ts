import { Router, type RequestHandler } from "express";
import { readDB, writeDB, createId } from "../storage";
import { verifyToken } from "../utils/jwt";

const router = Router();

function getUserId(req: any): string | null {
  const auth = req.headers.authorization as string | undefined;
  const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.sub || null;
}

export const issueCertificate: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const { trackId, title, score } = req.body as { trackId?: string; title?: string; score?: number };
  if (!trackId || !title) return res.status(400).json({ error: "Missing fields" });
  const db = readDB() as any;
  const id = createId("cert");
  const credentialId = `${trackId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`.toUpperCase();
  const cert = { id, userId: uid, trackId, title, issuedAt: new Date().toISOString(), score: typeof score === "number" ? score : 100, credentialId };
  db.certificates = db.certificates || [];
  db.certificates.push(cert);
  writeDB(db);
  res.status(201).json({ certificate: cert });
};

export const getCertificate: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const db = readDB() as any;
  const cert = (db.certificates || []).find((c: any) => c.id === id);
  if (!cert) return res.status(404).json({ error: "Not found" });
  res.json({ certificate: cert });
};

export const verifyCertificate: RequestHandler = (req, res) => {
  const { credentialId } = req.params as { credentialId: string };
  const db = readDB() as any;
  const cert = (db.certificates || []).find((c: any) => String(c.credentialId).toUpperCase() === String(credentialId).toUpperCase());
  if (!cert) return res.status(404).json({ valid: false });
  res.json({ valid: true, certificate: cert, verifyUrl: `${req.protocol}://${req.get("host")}/verify/${encodeURIComponent(credentialId)}` });
};

router.post("/issue", issueCertificate);
router.post("/generate-certificate", issueCertificate);
router.get("/:id", getCertificate);
router.get("/verify/:credentialId", verifyCertificate);

export default router;
