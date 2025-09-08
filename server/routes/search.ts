import { Router, type RequestHandler } from "express";
import { readDB } from "../storage";

const router = Router();

const searchHandler: RequestHandler = (req, res) => {
  const q = (req.query.q as string || "").toString().trim().toLowerCase();
  const db = readDB();
  if (!q) return res.json({ query: "", items: [] });
  const items: any[] = [];

  // Prompts
  for (const p of db.prompts) {
    const hay = `${p.title} ${p.content} ${(p.tags || []).join(" ")}`.toLowerCase();
    if (hay.includes(q)) {
      items.push({ id: p.id, kind: "prompt", title: p.title, snippet: p.content.slice(0, 140), href: `/community#gallery`, meta: { likes: p.likes, saves: p.saves } });
    }
  }
  // Discussions
  for (const d of db.discussions) {
    const hay = `${d.title} ${(d.tags || []).join(" ")}`.toLowerCase();
    if (hay.includes(q)) {
      items.push({ id: d.id, kind: "discussion", title: d.title, snippet: `${d.category}`, href: `/community#discussions`, meta: { views: d.views, replies: d.replies } });
    }
  }
  // Library (academy and user are separate collections)
  for (const r of db.libraryAcademy) {
    const hay = `${r.title} ${(r as any).content || ""} ${(r.tags || []).join(" ")}`.toLowerCase();
    if (hay.includes(q)) {
      items.push({ id: r.id, kind: "library", title: r.title, snippet: (r as any).content?.slice?.(0, 140), href: `/library`, meta: { type: r.type } });
    }
  }
  for (const row of db.libraryByUser) {
    for (const r of row.resources) {
      const hay = `${r.title} ${(r as any).content || ""} ${(r.tags || []).join(" ")}`.toLowerCase();
      if (hay.includes(q)) {
        items.push({ id: r.id, kind: "library", title: r.title, snippet: (r as any).content?.slice?.(0, 140), href: `/library`, meta: { type: r.type } });
      }
    }
  }
  // Tracks and modules
  for (const t of db.tracks) {
    if (t.title.toLowerCase().includes(q)) {
      items.push({ id: t.id, kind: "track", title: t.title, snippet: `${t.level} track`, href: `/learning`, meta: { level: t.level } });
    }
    for (const m of t.modules) {
      if (m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)) {
        items.push({ id: `${t.id}:${m.id}`, kind: "track", title: `${t.title} · ${m.title}`, snippet: m.description.slice(0, 140), href: `/learning`, meta: { lessons: m.lessons.length } });
      }
      for (const l of m.lessons) {
        if (l.title.toLowerCase().includes(q)) items.push({ id: `${t.id}:${m.id}:${l.id}`, kind: "track", title: `${t.title} · ${m.title} · ${l.title}`, snippet: `${l.durationMin} min lesson`, href: `/learning` });
      }
    }
  }
  // Challenges and entries
  for (const c of db.challenges) {
    if (c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) {
      items.push({ id: c.id, kind: "challenge", title: c.title, snippet: c.description.slice(0, 140), href: `/community#challenges` });
    }
  }

  // Basic ranking: by length of match and recency fallback isn't available for all; keep simple
  res.json({ query: q, items: items.slice(0, 50) });
};

router.get("/", searchHandler);
export default router;
