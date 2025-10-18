import { Router, type RequestHandler } from "express";
import { readDB, writeDB, createId } from "../storage";
import { verifyToken } from "../utils/jwt";
import { ethers } from "ethers";
import CertificateABI from "../../blockchain/artifacts/contracts/Certificate.sol/Certificate.json";
import dotenv from "dotenv";
import PDFDocument from "pdfkit";
import { Response } from "express";
import path from "path";
import pdfGenerator from '../../certificate-system/backend/src/utils/pdfGenerator';

import { renderTemplate, htmlToPdfBuffer, getBase64Logo } from '../../certificate-system/backend/src/utils/pdfGenerator';






dotenv.config();

const router = Router();

function getUserId(req: any): string | null {
  const auth = req.headers.authorization as string | undefined;
  const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.sub || null;
}

// Connect to local Hardhat blockchain
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const contractAddress = process.env.CONTRACT_ADDRESS || "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const privateKey = process.env.PRIVATE_KEY || "0xYOUR_TEST_PRIVATE_KEY";
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const certificateContract = new ethers.Contract(process.env.CONTRACT_ADDRESS!, CertificateABI.abi, wallet);

// Issue Certificate (with blockchain)
export const issueCertificate: RequestHandler = async (req, res) => {
  const uid = "u_admin"; // Temporary for testing
  const { trackId, title, score } = req.body as { trackId?: string; title?: string; score?: number };
  if (!trackId || !title) return res.status(400).json({ error: "Missing fields" });

  const db = readDB() as any;
  const id = createId("cert");
  const credentialId = `${trackId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`.toUpperCase();
  const cert = { id, userId: uid, trackId, title, issuedAt: new Date().toISOString(), score: typeof score === "number" ? score : 100, credentialId };

  try {
    const tx = await certificateContract.issueCertificate(
      credentialId,
      title,
      trackId,
      wallet.address // owner
    );
    await tx.wait();
    console.log("✅ Certificate issued on blockchain:", tx.hash);
  } catch (err) {
    console.error("❌ Blockchain error:", err);
    return res.status(500).json({ error: "Blockchain transaction failed", details: err });
  }

  db.certificates = db.certificates || [];
  db.certificates.push(cert);
  writeDB(db);

  res.status(201).json({ certificate: cert });

    // ---------------- Generate PDF ----------------
  try {
    const templatePath = path.join(__dirname, "../../certificate-system/backend/src/templates/certificate.html");
    const logoPath = path.join(__dirname, "../../certificate-system/backend/src/assets/risidio-logo.png");

    const html = await renderTemplate(templatePath, {
      certificate: cert,
      logoBase64: getBase64Logo(logoPath),
      verifiedBadgeBase64: getBase64Logo(path.join(__dirname, "../../certificate-system/backend/src/assets/verified-badge.png")),
      academyDirector: "Dr Sarah Chen",
      academyName: "AI First Academy"
    });

    const pdfBuffer = await htmlToPdfBuffer(html);

    // Return PDF as response
    res.status(201).contentType("application/pdf").send(pdfBuffer);
  } catch (err) {
    console.error("❌ PDF generation error:", err);
    res.status(500).json({ error: "PDF generation failed", details: err });
  }
};


// Get certificate from local DB
export const getCertificate: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const db = readDB() as any;
  const cert = (db.certificates || []).find((c: any) => c.id === id);
  if (!cert) return res.status(404).json({ error: "Not found" });
  res.json({ certificate: cert });
};

// Verify certificate (DB + blockchain)
export const verifyCertificate: RequestHandler = async (req, res) => {
  const { credentialId } = req.params as { credentialId: string };
  const db = readDB() as any;
  const cert = (db.certificates || []).find((c: any) => String(c.credentialId).toUpperCase() === String(credentialId).toUpperCase());
  if (!cert) return res.status(404).json({ valid: false });

  try {
    const onChain = await certificateContract.certificates(credentialId);
    if (!onChain.credentialId) {
      return res.json({ valid: false, certificate: cert, blockchain: null });
    }
    res.json({ valid: true, certificate: cert, blockchain: onChain });
  } catch (err) {
    console.error("❌ Blockchain verification error:", err);
    res.status(500).json({ error: "Blockchain verification failed", details: err });
  }
};

// Revoke certificate
router.post("/revoke", (req, res) => {
  const { credentialId } = req.body as { credentialId?: string };
  if (!credentialId) return res.status(400).json({ error: "credentialId is required" });

  const db = readDB() as any;
  const cert = (db.certificates || []).find((c: any) => c.credentialId === credentialId);
  if (!cert) return res.status(404).json({ error: "Certificate not found" });

  cert.status = "revoked";
  writeDB(db);

  res.json({ success: true, certificate: cert });
});

// Reissue certificate (with blockchain)
router.post("/reissue", async (req, res) => {
  const { oldCredentialId, reason, updatedDetails } = req.body as {
    oldCredentialId?: string;
    reason?: string;
    updatedDetails?: { title?: string; trackId?: string; score?: number };
  };

  if (!oldCredentialId) return res.status(400).json({ error: "oldCredentialId is required" });

  const db = readDB() as any;
  db.certificates = db.certificates || [];

  const oldCert = db.certificates.find((c: any) => c.credentialId === oldCredentialId);
  if (!oldCert) return res.status(404).json({ error: "Original certificate not found" });

  oldCert.status = "revoked";

  const newId = createId("cert");
  const newCredentialId = `${oldCert.trackId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`.toUpperCase();
  const newCert = {
    id: newId,
    userId: oldCert.userId,
    trackId: updatedDetails?.trackId || oldCert.trackId,
    title: updatedDetails?.title || oldCert.title,
    issuedAt: new Date().toISOString(),
    score: typeof updatedDetails?.score === "number" ? updatedDetails.score : oldCert.score,
    credentialId: newCredentialId,
    reissuedFrom: oldCert.credentialId,
    reason: reason || "Reissued certificate",
    status: "reissued"
  };

  try {
    const tx = await certificateContract.issueCertificate(
      newCert.credentialId,
      newCert.title,
      newCert.trackId,
      wallet.address
    );
    await tx.wait();
    console.log("✅ Reissued certificate stored on blockchain:", tx.hash);
  } catch (err) {
    console.error("❌ Blockchain error:", err);
    return res.status(500).json({ error: "Blockchain transaction failed", details: err });
  }

  db.certificates.push(newCert);
  writeDB(db);

  res.json({
    success: true,
    message: "Certificate reissued successfully",
    oldCertificate: oldCert,
    newCertificate: newCert
  });
});



// Generate & download certificate PDF
export const downloadCertificate: RequestHandler = async (req, res) => {
  const { id } = req.params as { id: string };
  const db = readDB() as any;
  const cert = (db.certificates || []).find((c: any) => c.id === id);

  if (!cert) return res.status(404).json({ error: "Certificate not found" });

  const pdfBuffer = await pdfGenerator(cert);

  res.setHeader("Content-Disposition", `attachment; filename=certificate_${cert.credentialId}.pdf`);
  res.setHeader("Content-Type", "application/pdf");
  res.send(pdfBuffer);
};


router.post("/issue", issueCertificate);
router.post("/generate-certificate", issueCertificate);
router.get("/:id", getCertificate);
router.get("/verify/:credentialId", verifyCertificate);

export default router;
