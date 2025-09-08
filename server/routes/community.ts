import { RequestHandler, Router } from "express";
import { Challenge, ChallengeEntry, Prompt, PromptComment, createId, readDB, writeDB } from "../storage";
import { verifyToken } from "../utils/jwt";

const router = Router();

function getUser(req: any): { id: string | null; role: string | null } {
  const auth = req.headers.authorization as string | undefined;
  if (!auth) return { id: null, role: null };
  const token = auth.split(" ")[1];
  const payload = verifyToken(token || "");
  return { id: payload?.sub || null, role: (payload as any)?.role || null };
}
function getUserId(req: any): string | null { return getUser(req).id }

// Prompts
export const listPrompts: RequestHandler = (_req, res) => {
  const db = readDB();
  const prompts = db.prompts.map((p) => {
    const u = db.users.find((x) => x.id === p.authorId);
    return { ...p, authorName: u?.name || "Unknown" } as any;
  });
  res.json({ prompts });
};

export const createPrompt: RequestHandler = (req, res) => {
  const { title, content, tags = [], difficulty = "beginner" } = req.body as Partial<Prompt>;
  const { id: authorId } = getUser(req);
  if (!authorId) return res.status(401).json({ error: "Unauthorized" });
  if (!title || !content) return res.status(400).json({ error: "Missing required fields" });
  const prompt: Prompt = {
    id: createId("p"),
    title,
    content,
    authorId,
    tags,
    difficulty: difficulty as any,
    likes: 0,
    saves: 0,
    views: 0,
    runs: 0,
    createdAt: new Date().toISOString(),
  };
  const db = readDB();
  db.prompts.unshift(prompt);
  writeDB(db);
  const u = db.users.find((x) => x.id === authorId);
  res.status(201).json({ prompt: { ...prompt, authorName: u?.name || "Unknown" } });
};

export const updatePrompt: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const { title, content, tags, difficulty } = req.body as Partial<Prompt>;
  const { id: userId, role } = getUser(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const db = readDB();
  const prompt = db.prompts.find((p) => p.id === id);
  if (!prompt) return res.status(404).json({ error: "Not found" });
  if (prompt.authorId !== userId && role !== "admin") return res.status(403).json({ error: "Forbidden" });
  if (title !== undefined) prompt.title = title;
  if (content !== undefined) prompt.content = content as any;
  if (tags !== undefined) prompt.tags = tags as any;
  if (difficulty !== undefined) prompt.difficulty = difficulty as any;
  writeDB(db);
  const u = db.users.find((x) => x.id === prompt.authorId);
  res.json({ prompt: { ...prompt, authorName: u?.name || "Unknown" } });
};

export const deletePrompt: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const { id: userId, role } = getUser(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const db = readDB() as any;
  const prompt = db.prompts.find((p: any) => p.id === id);
  if (!prompt) return res.status(404).json({ error: "Not found" });
  if (prompt.authorId !== userId && role !== "admin") return res.status(403).json({ error: "Forbidden" });
  db.prompts = db.prompts.filter((p: any) => p.id !== id);
  db.promptLikes = (db.promptLikes || []).filter((l: any) => l.promptId !== id);
  db.promptSaves = (db.promptSaves || []).filter((l: any) => l.promptId !== id);
  db.promptComments = (db.promptComments || []).filter((c: any) => c.promptId !== id);
  writeDB(db);
  res.json({ success: true });
};

export const likePrompt: RequestHandler = (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.params as { id: string };
  const db = readDB() as any;
  db.promptLikes = db.promptLikes || [];
  const prompt = db.prompts.find((p: any) => p.id === id);
  if (!prompt) return res.status(404).json({ error: "Not found" });
  
  prompt.likes = prompt.likes || 0;
  const alreadyLiked = db.promptLikes.some((l: any) => l.promptId === id && l.userId === userId);
  
  if (alreadyLiked) {
    // User already liked this prompt, return current state without changes
    return res.json({ 
      likes: prompt.likes, 
      alreadyLiked: true,
      message: "You have already liked this prompt" 
    });
  }
  
  // Add like since user hasn't liked it yet
  db.promptLikes.push({ promptId: id, userId });
  prompt.likes += 1;
  writeDB(db);
  
  res.json({ 
    likes: prompt.likes, 
    alreadyLiked: false,
    message: "Prompt liked successfully" 
  });
};

export const savePrompt: RequestHandler = (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.params as { id: string };
  const db = readDB() as any;
  db.promptSaves = db.promptSaves || [];
  const prompt = db.prompts.find((p: any) => p.id === id);
  if (!prompt) return res.status(404).json({ error: "Not found" });
  
  prompt.saves = prompt.saves || 0;
  const alreadySaved = db.promptSaves.some((l: any) => l.promptId === id && l.userId === userId);
  
  if (alreadySaved) {
    // User already saved this prompt, return current state without changes
    return res.json({ 
      saves: prompt.saves, 
      alreadySaved: true,
      message: "You have already saved this prompt" 
    });
  }
  
  // Add save since user hasn't saved it yet
  db.promptSaves.push({ promptId: id, userId });
  prompt.saves += 1;
  writeDB(db);
  
  res.json({ 
    saves: prompt.saves, 
    alreadySaved: false,
    message: "Prompt saved successfully" 
  });
};

export const viewPrompt: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const db = readDB() as any;
  const prompt = db.prompts.find((p: any) => p.id === id);
  if (!prompt) return res.status(404).json({ error: "Not found" });
  prompt.views = (prompt.views || 0) + 1;
  writeDB(db);
  res.json({ views: prompt.views });
};

export const commentList: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const db = readDB() as any;
  db.promptComments = db.promptComments || [];
  const comments = db.promptComments.filter((c: any) => c.promptId === id);
  res.json({ comments });
};

export const commentCreate: RequestHandler = (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.params as { id: string };
  const { content } = req.body as { content?: string };
  if (!content) return res.status(400).json({ error: "Content required" });
  const db = readDB() as any;
  db.promptComments = db.promptComments || [];
  const prompt = db.prompts.find((p: any) => p.id === id);
  if (!prompt) return res.status(404).json({ error: "Not found" });
  const comment: PromptComment = { id: createId("c"), promptId: id, userId, content, createdAt: new Date().toISOString() };
  db.promptComments.push(comment);
  writeDB(db);
  res.status(201).json({ comment });
};

export const listSavedPrompts: RequestHandler = (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const db = readDB() as any;
  db.promptSaves = db.promptSaves || [];
  const savedIds = new Set((db.promptSaves as any[]).filter((s: any) => s.userId === userId).map((s: any) => s.promptId));
  const prompts = (db.prompts as any[])
    .filter((p: any) => savedIds.has(p.id))
    .map((p: any) => {
      const u = db.users.find((x: any) => x.id === p.authorId);
      return { ...p, authorName: u?.name || "Unknown" };
    });
  res.json({ prompts });
};

// Discussions
export const listDiscussions: RequestHandler = (_req, res) => {
  const db = readDB() as any;
  db.discussions = db.discussions || [];
  const discussions = db.discussions.map((d: any) => {
    const u = db.users.find((x: any) => x.id === d.authorId);
    return { ...d, authorName: u?.name || "Unknown" };
  });
  res.json({ discussions });
};

export const createDiscussion: RequestHandler = (req, res) => {
  const { id: userId } = getUser(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { title, category = "General", tags = [] as string[], content } = req.body as {
    title?: string;
    category?: string;
    tags?: string[];
    content?: string;
  };
  if (!title) return res.status(400).json({ error: "Title required" });
  const now = new Date().toISOString();
  const discussion = {
    id: createId("d"),
    title,
    authorId: userId,
    category,
    tags,
    views: 0,
    replies: 0,
    createdAt: now,
    lastActivityAt: now,
  };
  const db = readDB();
  db.discussions.unshift(discussion);
  if (content) {
    db.discussionReplies.push({ id: createId("r"), discussionId: discussion.id, authorId: userId, content, createdAt: now });
    discussion.replies += 1;
  }
  writeDB(db);
  const u = db.users.find((x) => x.id === userId);
  res.status(201).json({ discussion: { ...discussion, authorName: u?.name || "Unknown" } });
};

export const updateDiscussion: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const { title, category, tags, isPinned } = req.body as any;
  const { id: userId, role } = getUser(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const db = readDB() as any;
  const d = db.discussions.find((x: any) => x.id === id);
  if (!d) return res.status(404).json({ error: "Not found" });
  if (d.authorId !== userId && role !== "admin") return res.status(403).json({ error: "Forbidden" });
  if (title !== undefined) d.title = title;
  if (category !== undefined) d.category = category;
  if (tags !== undefined) d.tags = tags;
  if (typeof isPinned === "boolean") d.isPinned = isPinned;
  writeDB(db);
  const u = db.users.find((x: any) => x.id === d.authorId);
  res.json({ discussion: { ...d, authorName: u?.name || "Unknown" } });
};

export const deleteDiscussion: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const { id: userId, role } = getUser(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const db = readDB() as any;
  const d = db.discussions.find((x: any) => x.id === id);
  if (!d) return res.status(404).json({ error: "Not found" });
  if (d.authorId !== userId && role !== "admin") return res.status(403).json({ error: "Forbidden" });
  db.discussions = db.discussions.filter((x: any) => x.id !== id);
  db.discussionReplies = (db.discussionReplies || []).filter((r: any) => r.discussionId !== id);
  writeDB(db);
  res.json({ success: true });
};

export const listDiscussionReplies: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const db = readDB() as any;
  db.discussionReplies = db.discussionReplies || [];
  const replies = db.discussionReplies.filter((r: any) => r.discussionId === id);
  res.json({ replies });
};

export const createDiscussionReply: RequestHandler = (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.params as { id: string };
  const { content } = req.body as { content?: string };
  if (!content) return res.status(400).json({ error: "Content required" });
  const db = readDB();
  const d = db.discussions.find((x) => x.id === id);
  if (!d) return res.status(404).json({ error: "Not found" });
  const reply = { id: createId("r"), discussionId: id, authorId: userId, content, createdAt: new Date().toISOString() };
  db.discussionReplies.push(reply);
  d.replies += 1;
  d.lastActivityAt = reply.createdAt;
  writeDB(db);
  res.status(201).json({ reply });
};

export const viewDiscussion: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const db = readDB() as any;
  db.discussions = db.discussions || [];
  const d = db.discussions.find((x: any) => x.id === id);
  if (!d) return res.status(404).json({ error: "Not found" });
  d.views = (d.views || 0) + 1;
  writeDB(db);
  res.json({ views: d.views });
};

// Challenges
export const listChallenges: RequestHandler = (_req, res) => {
  const db = readDB() as any;
  db.challenges = db.challenges || [];
  res.json({ challenges: db.challenges });
};

export const getChallenge: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const db = readDB() as any;
  db.challenges = db.challenges || [];
  db.challengeEntries = db.challengeEntries || [];
  const challenge = db.challenges.find((c: any) => c.id === id);
  if (!challenge) return res.status(404).json({ error: "Not found" });
  const entries = db.challengeEntries.filter((e: any) => e.challengeId === id);
  const now = Date.now();
  let winner: { entryId: string; score: number } | undefined;
  if (new Date(challenge.endAt).getTime() <= now && entries.length) {
    let best = { entryId: entries[0].id, score: -Infinity };
    for (const e of entries) {
      const s = e.metrics.likes * challenge.criteria.likesWeight +
        e.metrics.saves * challenge.criteria.savesWeight +
        e.metrics.runs * challenge.criteria.runsWeight +
        e.metrics.views * challenge.criteria.viewsWeight;
      if (s > best.score) best = { entryId: e.id, score: s };
    }
    winner = best;
  }
  res.json({ challenge: { ...challenge, entries }, winner });
};

export const submitEntry: RequestHandler = (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.params as { id: string };
  const { title, content } = req.body as { title?: string; content?: string };
  if (!title || !content) return res.status(400).json({ error: "Missing fields" });
  const db = readDB() as any;
  db.challenges = db.challenges || [];
  db.challengeEntries = db.challengeEntries || [];
  const challenge = db.challenges.find((c: any) => c.id === id);
  if (!challenge) return res.status(404).json({ error: "Not found" });
  const entry: ChallengeEntry = {
    id: createId("ce"),
    challengeId: id,
    authorId: userId,
    title,
    content,
    metrics: { likes: 0, saves: 0, runs: 0, views: 0 },
    createdAt: new Date().toISOString(),
  };
  db.challengeEntries.unshift(entry);
  writeDB(db);
  res.status(201).json({ entry });
};

function bumpMetric(entryId: string, metric: keyof ChallengeEntry["metrics"], userId: string) {
  const db = readDB() as any;
  db.challengeEntries = db.challengeEntries || [];
  db.challengeEntryLikes = db.challengeEntryLikes || [];
  db.challengeEntrySaves = db.challengeEntrySaves || [];
  
  const e = db.challengeEntries.find((x: any) => x.id === entryId);
  if (!e) return null;
  
  // Check if user already performed this action
  let alreadyActioned = false;
  if (metric === "likes") {
    alreadyActioned = db.challengeEntryLikes.some((l: any) => l.entryId === entryId && l.userId === userId);
    if (!alreadyActioned) {
      db.challengeEntryLikes.push({ entryId, userId });
      e.metrics[metric] += 1 as any;
    }
  } else if (metric === "saves") {
    alreadyActioned = db.challengeEntrySaves.some((s: any) => s.entryId === entryId && s.userId === userId);
    if (!alreadyActioned) {
      db.challengeEntrySaves.push({ entryId, userId });
      e.metrics[metric] += 1 as any;
    }
  } else {
    // For runs and views, allow multiple actions
    e.metrics[metric] += 1 as any;
  }
  
  writeDB(db);
  return { metrics: e.metrics, alreadyActioned };
}

export const likeEntry: RequestHandler = (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { entryId } = req.params as { id: string; entryId: string };
  const result = bumpMetric(entryId, "likes", userId);
  if (!result) return res.status(404).json({ error: "Not found" });
  
  if (result.alreadyActioned) {
    return res.json({ 
      metrics: result.metrics, 
      alreadyLiked: true,
      message: "You have already liked this entry" 
    });
  }
  
  res.json({ 
    metrics: result.metrics, 
    alreadyLiked: false,
    message: "Entry liked successfully" 
  });
};
export const saveEntry: RequestHandler = (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { entryId } = req.params as { id: string; entryId: string };
  const result = bumpMetric(entryId, "saves", userId);
  if (!result) return res.status(404).json({ error: "Not found" });
  
  if (result.alreadyActioned) {
    return res.json({ 
      metrics: result.metrics, 
      alreadySaved: true,
      message: "You have already saved this entry" 
    });
  }
  
  res.json({ 
    metrics: result.metrics, 
    alreadySaved: false,
    message: "Entry saved successfully" 
  });
};
export const runEntry: RequestHandler = (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { entryId } = req.params as { id: string; entryId: string };
  const result = bumpMetric(entryId, "runs", userId);
  if (!result) return res.status(404).json({ error: "Not found" });
  
  res.json({ 
    metrics: result.metrics,
    message: "Entry run recorded" 
  });
};
export const viewEntry: RequestHandler = (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { entryId } = req.params as { id: string; entryId: string };
  const result = bumpMetric(entryId, "views", userId);
  if (!result) return res.status(404).json({ error: "Not found" });
  
  res.json({ 
    metrics: result.metrics,
    message: "Entry view recorded" 
  });
};

router.get("/prompts", listPrompts);
router.get("/prompts/saved", listSavedPrompts);
router.post("/prompts", createPrompt);
router.put("/prompts/:id", updatePrompt);
router.delete("/prompts/:id", deletePrompt);
router.post("/prompts/:id/like", likePrompt);
router.post("/prompts/:id/save", savePrompt);
router.post("/prompts/:id/view", viewPrompt);
router.get("/prompts/:id/comments", commentList);
router.post("/prompts/:id/comments", commentCreate);

router.get("/discussions", listDiscussions);
router.post("/discussions", createDiscussion);
router.put("/discussions/:id", updateDiscussion);
router.delete("/discussions/:id", deleteDiscussion);
router.get("/discussions/:id/replies", listDiscussionReplies);
router.post("/discussions/:id/replies", createDiscussionReply);
router.post("/discussions/:id/view", viewDiscussion);

router.get("/challenges", listChallenges);
router.get("/challenges/:id", getChallenge);
router.post("/challenges/:id/entries", submitEntry);
router.post("/challenges/:id/entries/:entryId/like", likeEntry);
router.post("/challenges/:id/entries/:entryId/save", saveEntry);
router.post("/challenges/:id/entries/:entryId/run", runEntry);
router.post("/challenges/:id/entries/:entryId/view", viewEntry);

export default router;
