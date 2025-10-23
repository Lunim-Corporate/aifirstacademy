import { Router, type RequestHandler } from "express";
import { readDB, writeDB, createId } from "../storage";
import { verifyToken } from "../utils/jwt";
import crypto from "crypto";

const router = Router();

// Certificate requirements configuration
const CERTIFICATE_REQUIREMENTS = {
  completion: {
    weight: 40,
    description: 'Complete 100% of all lessons in the track'
  },
  assessment: {
    weight: 25,
    description: 'Score 80% or higher on the comprehensive track assessment'
  },
  projects: {
    weight: 20,
    description: 'Complete and submit the final capstone project'
  },
  timeCommitment: {
    weight: 10,
    description: 'Demonstrate at least 20 hours of active learning time'
  },
  engagement: {
    weight: 5,
    description: 'Participate in community discussions (optional)'
  }
};

function getUserId(req: any): string | null {
  const auth = req.headers.authorization as string | undefined;
  let token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;
  
  // Fallback to cookie token
  if (!token && req.cookies?.auth_token) {
    token = req.cookies.auth_token;
  }
  
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.sub || null;
}

// GET /certificates/requirements/:trackId
export const getCertificateRequirements: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const { trackId } = req.params as { trackId: string };
  const db = readDB() as any;
  
  // Get track information
  const track = (db.learningTracks || []).find((t: any) => t.id === trackId);
  if (!track) {
    return res.status(404).json({ error: 'Track not found' });
  }
  
  // Get user progress
  const userProgress = (db.userProgress || []).filter((p: any) => 
    p.userId === uid && p.trackId === trackId
  );
  
  // Calculate total lessons in track
  const totalLessons = track.modules?.reduce((total: number, module: any) => 
    total + (module.lessons?.length || 0), 0) || 0;
  
  // Calculate completed lessons
  const completedLessons = userProgress.filter((p: any) => p.status === 'completed').length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  // Get assessments and projects (placeholder for future implementation)
  const assessments = (db.assessments || []).filter((a: any) => 
    a.userId === uid && a.trackId === trackId && a.passed
  );
  const projects = (db.projects || []).filter((p: any) => 
    p.userId === uid && p.trackId === trackId && p.status === 'submitted'
  );
  
  // Calculate requirements
  const requirements = {
    completion: {
      progress: completedLessons,
      total: totalLessons,
      percentage: completionPercentage,
      ...CERTIFICATE_REQUIREMENTS.completion
    },
    assessment: {
      progress: assessments.length,
      total: 1,
      percentage: assessments.length > 0 ? 100 : 0,
      ...CERTIFICATE_REQUIREMENTS.assessment
    },
    projects: {
      progress: projects.length,
      total: 1,
      percentage: projects.length > 0 ? 100 : 0,
      ...CERTIFICATE_REQUIREMENTS.projects
    },
    timeCommitment: {
      progress: Math.min(track.estimatedHours || 0, 20),
      total: 20,
      percentage: Math.min(100, Math.round(((track.estimatedHours || 0) / 20) * 100)),
      ...CERTIFICATE_REQUIREMENTS.timeCommitment
    },
    engagement: {
      progress: 0, // TODO: Implement community system
      total: 5,
      percentage: 0,
      ...CERTIFICATE_REQUIREMENTS.engagement
    }
  };
  
  // Calculate overall progress
  const overallProgress = Object.values(requirements).reduce((acc: number, req: any) => 
    acc + (req.percentage * req.weight / 100), 0);
  
  const isEligible = overallProgress >= 80;
  
  res.json({
    track,
    requirements,
    overallProgress: Math.round(overallProgress),
    isEligible,
    completedRequirements: Object.values(requirements).filter((req: any) => req.percentage === 100).length
  });
};

export const issueCertificate: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const { trackId } = req.body as { trackId?: string };
  if (!trackId) return res.status(400).json({ error: "Track ID is required" });
  
  const db = readDB() as any;
  
  // Get track info
  const track = (db.learningTracks || []).find((t: any) => t.id === trackId);
  if (!track) {
    return res.status(404).json({ error: 'Track not found' });
  }
  
  // Check certificate eligibility by calling requirements endpoint logic
  const userProgress = (db.userProgress || []).filter((p: any) => 
    p.userId === uid && p.trackId === trackId
  );
  
  const totalLessons = track.modules?.reduce((total: number, module: any) => 
    total + (module.lessons?.length || 0), 0) || 0;
  const completedLessons = userProgress.filter((p: any) => p.status === 'completed').length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  // For now, require 80% completion for certificate
  if (completionPercentage < 80) {
    return res.status(400).json({ 
      error: 'Not eligible for certificate',
      reason: `Only ${completionPercentage}% completed. Minimum 80% required.`,
      progress: { completedLessons, totalLessons, completionPercentage }
    });
  }
  
  // Check if certificate already exists (and is not revoked)
  const existingCert = (db.certificates || []).find((c: any) => 
    c.userId === uid && c.trackId === trackId && c.status !== 'revoked'
  );
  
  if (existingCert) {
    return res.json({
      certificate: existingCert,
      message: 'Certificate already exists'
    });
  }
  
  // Generate certificate
  const id = createId("cert");
  const certificateId = `AFA-${track.role?.toUpperCase() || 'GEN'}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
  const verificationHash = generateVerificationHash(uid, trackId, certificateId);
  
  const cert = {
    id,
    certificateId,
    userId: uid,
    trackId,
    trackTitle: track.title,
    userRole: track.role,
    completionDate: new Date().toISOString(),
    verificationHash,
    isVerified: true,
    status: 'active', // active, revoked
    metadata: {
      completedLessons,
      totalLessons,
      completionPercentage,
      generatedAt: new Date().toISOString(),
      version: 1
    }
  };
  
  db.certificates = db.certificates || [];
  db.certificates.push(cert);
  writeDB(db);
  
  res.status(201).json({
    certificate: cert,
    message: 'Certificate generated successfully'
  });
};

// Revoke certificate
export const revokeCertificate: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const { certificateId } = req.params as { certificateId: string };
  const { reason } = req.body as { reason?: string };
  
  const db = readDB() as any;
  
  // Find certificate
  const certIndex = (db.certificates || []).findIndex((c: any) => 
    c.id === certificateId || c.certificateId === certificateId
  );
  
  if (certIndex === -1) {
    return res.status(404).json({ error: 'Certificate not found' });
  }
  
  const cert = db.certificates[certIndex];
  
  // Check ownership
  if (cert.userId !== uid) {
    return res.status(403).json({ error: 'Not authorized to revoke this certificate' });
  }
  
  // Check if already revoked
  if (cert.status === 'revoked') {
    return res.status(400).json({ error: 'Certificate is already revoked' });
  }
  
  // Revoke certificate
  db.certificates[certIndex] = {
    ...cert,
    status: 'revoked',
    isVerified: false,
    revokedAt: new Date().toISOString(),
    revocationReason: reason || 'Revoked by user',
    metadata: {
      ...cert.metadata,
      revokedBy: uid
    }
  };
  
  writeDB(db);
  
  res.json({
    message: 'Certificate revoked successfully',
    certificate: db.certificates[certIndex]
  });
};

// Reissue certificate
export const reissueCertificate: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const { certificateId } = req.params as { certificateId: string };
  
  const db = readDB() as any;
  
  // Find the revoked certificate
  const oldCertIndex = (db.certificates || []).findIndex((c: any) => 
    (c.id === certificateId || c.certificateId === certificateId) && 
    c.userId === uid
  );
  
  if (oldCertIndex === -1) {
    return res.status(404).json({ error: 'Certificate not found' });
  }
  
  const oldCert = db.certificates[oldCertIndex];
  
  // Check ownership
  if (oldCert.userId !== uid) {
    return res.status(403).json({ error: 'Not authorized to reissue this certificate' });
  }
  
  // Check if it's revoked
  if (oldCert.status !== 'revoked') {
    return res.status(400).json({ error: 'Can only reissue revoked certificates' });
  }
  
  // Get track info
  const track = (db.learningTracks || []).find((t: any) => t.id === oldCert.trackId);
  if (!track) {
    return res.status(404).json({ error: 'Track not found' });
  }
  
  // Verify user still meets requirements
  const userProgress = (db.userProgress || []).filter((p: any) => 
    p.userId === uid && p.trackId === oldCert.trackId
  );
  
  const totalLessons = track.modules?.reduce((total: number, module: any) => 
    total + (module.lessons?.length || 0), 0) || 0;
  const completedLessons = userProgress.filter((p: any) => p.status === 'completed').length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  if (completionPercentage < 80) {
    return res.status(400).json({ 
      error: 'Not eligible for certificate reissuance',
      reason: `Only ${completionPercentage}% completed. Minimum 80% required.`,
      progress: { completedLessons, totalLessons, completionPercentage }
    });
  }
  
  // Generate new certificate
  const id = createId("cert");
  const newCertificateId = `AFA-${track.role?.toUpperCase() || 'GEN'}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
  const verificationHash = generateVerificationHash(uid, oldCert.trackId, newCertificateId);
  
  const newCert = {
    id,
    certificateId: newCertificateId,
    userId: uid,
    trackId: oldCert.trackId,
    trackTitle: oldCert.trackTitle,
    userRole: oldCert.userRole,
    completionDate: new Date().toISOString(),
    verificationHash,
    isVerified: true,
    status: 'active',
    metadata: {
      completedLessons,
      totalLessons,
      completionPercentage,
      generatedAt: new Date().toISOString(),
      version: (oldCert.metadata?.version || 1) + 1,
      reissuedFrom: oldCert.certificateId,
      originalIssueDate: oldCert.completionDate
    }
  };
  
  db.certificates.push(newCert);
  writeDB(db);
  
  res.status(201).json({
    message: 'Certificate reissued successfully',
    certificate: newCert,
    previousCertificate: oldCert
  });
};

// Helper function to generate verification hash
function generateVerificationHash(userId: string, trackId: string, certificateId: string): string {
  const data = `${userId}-${trackId}-${certificateId}-${process.env.CERTIFICATE_SECRET_KEY || 'default-secret'}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export const getCertificate: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const db = readDB() as any;
  const cert = (db.certificates || []).find((c: any) => c.id === id);
  if (!cert) return res.status(404).json({ error: "Not found" });
  res.json({ certificate: cert });
};

export const verifyCertificate: RequestHandler = (req, res) => {
  const { certificateId } = req.params as { certificateId: string };
  const db = readDB() as any;
  
  const cert = (db.certificates || []).find((c: any) => 
    c.certificateId === certificateId || c.credentialId === certificateId
  );
  
  if (!cert) {
    return res.status(404).json({ 
      valid: false, 
      error: 'Certificate not found' 
    });
  }
  
  // Check if certificate is revoked
  if (cert.status === 'revoked') {
    return res.json({
      valid: false,
      certificate: cert,
      verificationInfo: {
        certificateId: cert.certificateId || cert.credentialId,
        trackTitle: cert.trackTitle || cert.title,
        completionDate: cert.completionDate || cert.issuedAt,
        verificationStatus: 'REVOKED',
        revokedAt: cert.revokedAt,
        revocationReason: cert.revocationReason
      }
    });
  }
  
  // Verify hash if present
  let isValid = true;
  if (cert.verificationHash) {
    const expectedHash = generateVerificationHash(
      cert.userId, 
      cert.trackId, 
      cert.certificateId || cert.credentialId
    );
    isValid = cert.verificationHash === expectedHash && cert.isVerified !== false;
  }
  
  res.json({ 
    valid: isValid,
    certificate: cert,
    verificationInfo: {
      certificateId: cert.certificateId || cert.credentialId,
      trackTitle: cert.trackTitle || cert.title,
      completionDate: cert.completionDate || cert.issuedAt,
      verificationStatus: isValid ? 'VERIFIED' : 'INVALID',
      version: cert.metadata?.version
    },
    verifyUrl: `${req.protocol}://${req.get("host")}/verify/${encodeURIComponent(cert.certificateId || cert.credentialId)}`
  });
};

// Get user's certificates
export const getUserCertificates: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const db = readDB() as any;
  const certificates = (db.certificates || []).filter((c: any) => c.userId === uid);
  
  res.json({ certificates });
};

// Certificate requirements and generation routes
router.get("/requirements/:trackId", getCertificateRequirements);
router.post("/generate", issueCertificate);
router.post("/issue", issueCertificate); // Legacy compatibility
router.post("/revoke/:certificateId", revokeCertificate);
router.post("/reissue/:certificateId", reissueCertificate);
router.get("/user", getUserCertificates);
router.get("/:id", getCertificate);
router.get("/verify/:certificateId", verifyCertificate);

export default router;