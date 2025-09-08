import { RequestHandler, Router } from "express";
import { Challenge, ChallengeEntry, readDB, writeDB, createId } from "../storage";
import { verifyToken } from "../utils/jwt";

const router = Router();

function getUser(req: any): { id: string | null; role: string | null } {
  const auth = req.headers.authorization as string | undefined;
  if (!auth) return { id: null, role: null };
  const token = auth.split(" ")[1];
  const payload = verifyToken(token || "");
  return { id: payload?.sub || null, role: (payload as any)?.role || null };
}

function requireAdmin(req: any, res: any, next: any) {
  const { id, role } = getUser(req);
  if (!id) return res.status(401).json({ error: "Unauthorized" });
  if (role !== "admin") return res.status(403).json({ error: "Admin access required" });
  next();
}

// Challenge Management Endpoints

export const listChallengesAdmin: RequestHandler = (req, res) => {
  const db = readDB();
  
  // Calculate statistics for each challenge
  const challengesWithStats = db.challenges.map((challenge) => {
    const entries = db.challengeEntries.filter((e) => e.challengeId === challenge.id);
    const participants = new Set(entries.map((e) => e.authorId)).size;
    const totalLikes = entries.reduce((sum, e) => sum + (e.metrics?.likes || 0), 0);
    const totalViews = entries.reduce((sum, e) => sum + (e.metrics?.views || 0), 0);
    
    return {
      ...challenge,
      stats: {
        totalEntries: entries.length,
        totalParticipants: participants,
        totalLikes,
        totalViews,
        isActive: new Date() >= new Date(challenge.startAt) && new Date() <= new Date(challenge.endAt),
        isUpcoming: new Date() < new Date(challenge.startAt),
        isEnded: new Date() > new Date(challenge.endAt)
      }
    };
  });
  
  res.json({ challenges: challengesWithStats });
};

export const createChallenge: RequestHandler = (req, res) => {
  const { title, description, startAt, endAt, criteria } = req.body;
  
  if (!title || !description || !startAt || !endAt) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  if (new Date(startAt) >= new Date(endAt)) {
    return res.status(400).json({ error: "End date must be after start date" });
  }
  
  const challenge: Challenge = {
    id: createId("ch"),
    title,
    description,
    startAt,
    endAt,
    criteria: criteria || {
      likesWeight: 3,
      savesWeight: 2,
      runsWeight: 1,
      viewsWeight: 0.1
    }
  };
  
  const db = readDB();
  db.challenges.unshift(challenge);
  writeDB(db);
  
  res.status(201).json({ challenge });
};

export const updateChallenge: RequestHandler = (req, res) => {
  const { id } = req.params;
  const { title, description, startAt, endAt, criteria } = req.body;
  
  const db = readDB();
  const challenge = db.challenges.find((c) => c.id === id);
  
  if (!challenge) {
    return res.status(404).json({ error: "Challenge not found" });
  }
  
  // Validate dates if provided
  const newStartAt = startAt || challenge.startAt;
  const newEndAt = endAt || challenge.endAt;
  
  if (new Date(newStartAt) >= new Date(newEndAt)) {
    return res.status(400).json({ error: "End date must be after start date" });
  }
  
  // Update fields
  if (title !== undefined) challenge.title = title;
  if (description !== undefined) challenge.description = description;
  if (startAt !== undefined) challenge.startAt = startAt;
  if (endAt !== undefined) challenge.endAt = endAt;
  if (criteria !== undefined) challenge.criteria = criteria;
  
  writeDB(db);
  
  // Calculate stats for response
  const entries = db.challengeEntries.filter((e) => e.challengeId === challenge.id);
  const participants = new Set(entries.map((e) => e.authorId)).size;
  const totalLikes = entries.reduce((sum, e) => sum + (e.metrics?.likes || 0), 0);
  const totalViews = entries.reduce((sum, e) => sum + (e.metrics?.views || 0), 0);
  
  const challengeWithStats = {
    ...challenge,
    stats: {
      totalEntries: entries.length,
      totalParticipants: participants,
      totalLikes,
      totalViews,
      isActive: new Date() >= new Date(challenge.startAt) && new Date() <= new Date(challenge.endAt),
      isUpcoming: new Date() < new Date(challenge.startAt),
      isEnded: new Date() > new Date(challenge.endAt)
    }
  };
  
  res.json({ challenge: challengeWithStats });
};

export const deleteChallenge: RequestHandler = (req, res) => {
  const { id } = req.params;
  
  const db = readDB() as any;
  const challengeIndex = db.challenges.findIndex((c: any) => c.id === id);
  
  if (challengeIndex === -1) {
    return res.status(404).json({ error: "Challenge not found" });
  }
  
  // Remove the challenge
  db.challenges.splice(challengeIndex, 1);
  
  // Remove associated entries and metrics
  db.challengeEntries = db.challengeEntries.filter((e: any) => e.challengeId !== id);
  db.challengeLikes = (db.challengeLikes || []).filter((l: any) => l.challengeId !== id);
  db.challengeSaves = (db.challengeSaves || []).filter((s: any) => s.challengeId !== id);
  db.challengeRuns = (db.challengeRuns || []).filter((r: any) => r.challengeId !== id);
  db.challengeViews = (db.challengeViews || []).filter((v: any) => v.challengeId !== id);
  
  writeDB(db);
  
  res.json({ success: true });
};

export const getChallengeDetails: RequestHandler = (req, res) => {
  const { id } = req.params;
  
  const db = readDB();
  const challenge = db.challenges.find((c) => c.id === id);
  
  if (!challenge) {
    return res.status(404).json({ error: "Challenge not found" });
  }
  
  // Get entries with author names
  const entries = db.challengeEntries
    .filter((e) => e.challengeId === id)
    .map((entry) => {
      const author = db.users.find((u) => u.id === entry.authorId);
      return {
        ...entry,
        authorName: author?.name || "Unknown"
      };
    });
  
  // Calculate detailed stats
  const participants = new Set(entries.map((e) => e.authorId)).size;
  const totalLikes = entries.reduce((sum, e) => sum + (e.metrics?.likes || 0), 0);
  const totalSaves = entries.reduce((sum, e) => sum + (e.metrics?.saves || 0), 0);
  const totalViews = entries.reduce((sum, e) => sum + (e.metrics?.views || 0), 0);
  const totalRuns = entries.reduce((sum, e) => sum + (e.metrics?.runs || 0), 0);
  
  const challengeWithDetails = {
    ...challenge,
    entries,
    stats: {
      totalEntries: entries.length,
      totalParticipants: participants,
      totalLikes,
      totalSaves,
      totalViews,
      totalRuns,
      isActive: new Date() >= new Date(challenge.startAt) && new Date() <= new Date(challenge.endAt),
      isUpcoming: new Date() < new Date(challenge.startAt),
      isEnded: new Date() > new Date(challenge.endAt)
    }
  };
  
  res.json({ challenge: challengeWithDetails });
};

// Apply admin middleware to all routes
router.use(requireAdmin);

// Routes
router.get("/challenges", listChallengesAdmin);
router.post("/challenges", createChallenge);
router.get("/challenges/:id", getChallengeDetails);
router.put("/challenges/:id", updateChallenge);
router.delete("/challenges/:id", deleteChallenge);

export default router;
