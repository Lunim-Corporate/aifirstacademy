import { RequestHandler, Router } from "express";

const router = Router();

export const runPrompt: RequestHandler = (req, res) => {
  const { prompt, temperature = 0.7, maxTokens = 512, system } = req.body as any;
  if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "prompt is required" });
  const start = Date.now();
  // Simulate token count and cost
  const inputTokens = Math.max(10, Math.round(prompt.length / 4));
  const outputTokens = Math.round((Math.random() * 0.5 + 0.5) * (maxTokens / 4));
  const totalTokens = inputTokens + outputTokens;
  const cost = Number(((totalTokens / 1000) * 0.002).toFixed(6));
  const latencyMs = Math.round(Math.random() * 500) + 200;
  const end = start + latencyMs;
  const content = `Simulated response for: ${prompt.slice(0, 80)}...`;
  const feedback = {
    clarity: Math.round(Math.random() * 4) + 1,
    specificity: Math.round(Math.random() * 4) + 1,
    constraints: Math.round(Math.random() * 4) + 1,
    score: Math.round(Math.random() * 50) + 50,
    notes: "This is a heuristic score for demo purposes.",
  };
  res.json({
    id: `exec_${start}`,
    prompt,
    system: system || "",
    settings: { temperature, maxTokens },
    timings: { start, end, latencyMs },
    tokens: { input: inputTokens, output: outputTokens, total: totalTokens },
    cost,
    content,
    feedback,
  });
};

router.post("/run", runPrompt);

export default router;
