import { Router, type RequestHandler } from "express";
import { readDB, writeDB, NotificationItem } from "../storage";
import { verifyToken } from "../utils/jwt";

const router = Router();

function getUserId(req: any): string | null {
  const auth = req.headers.authorization as string | undefined;
  const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.sub || null;
}

const list: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const db = readDB();
  const notifications = db.notifications
    .filter(n => n.userId === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = notifications.filter(n => !n.readAt).length;
  res.json({ notifications, unread });
};

const markRead: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const id = req.params.id as string;
  const db = readDB();
  const n = db.notifications.find(n => n.id === id && n.userId === uid);
  if (!n) return res.status(404).json({ error: "Not found" });
  if (!n.readAt) n.readAt = new Date().toISOString();
  writeDB(db);
  const unread = db.notifications.filter(x => x.userId === uid && !x.readAt).length;
  res.json({ success: true, unread });
};

const markAllRead: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const db = readDB();
  for (const n of db.notifications) if (n.userId === uid && !n.readAt) n.readAt = new Date().toISOString();
  writeDB(db);
  res.json({ success: true, unread: 0 });
};

router.get("/", list);
router.post("/:id/read", markRead);
router.post("/read-all", markAllRead);

export default router;
