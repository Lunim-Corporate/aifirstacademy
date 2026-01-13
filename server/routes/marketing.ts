import { Router, type RequestHandler } from "express";
import { readDB } from "../storage";
import { sendMail } from "../utils/mailer";
import { createId } from "../storage";

const router = Router();

// Product marketing content
export const getProduct: RequestHandler = (_req, res) => {
  res.json({
    hero: {
      title: "AI Workflow Training that Delivers",
      subtitle: "Learn, practice, and certify practical AI skills with live feedback and enterprise-ready features.",
      ctas: [
        { label: "Start Free", href: "/signup" },
        { label: "See Demo", href: "/?demo=1", variant: "outline" }
      ]
    },
    features: [
      { id: "sandbox", title: "Interactive Sandbox", description: "Practice with real LLMs and get instant scoring.", icon: "Code" },
      { id: "tracks", title: "Structured Tracks", description: "Tailored learning paths for marketing professionals.", icon: "BookOpen" },
      { id: "teams", title: "Team Management", description: "Cohorts, analytics, certificates, and SSO.", icon: "Users" },
      { id: "community", title: "Community Gallery", description: "Share prompts and learn from peers.", icon: "Target" }
    ],
    testimonials: [
      { id: "t1", name: "Sarah Martinez", role: "Senior Developer", quote: "Our team consistently ships better prompts in 2 weeks." },
      { id: "t2", name: "Emily Parker", role: "Marketing Director", quote: "I create campaign briefs in hours, not days." }
    ],
    logos: ["TechCorp", "ScaleUp", "GrowthCo", "DevWorks", "PixelLabs", "DataForge"],
    integrations: ["OpenAI", "Anthropic", "Google AI", "Azure OpenAI", "Hugging Face", "LangChain"],
    caseStudies: [
      { id: "cs1", title: "Ship AI features faster", company: "TechCorp", metric: "+43% velocity", summary: "Engineers adopted repeatable prompting patterns and shipped AI-assisted features 43% faster." },
      { id: "cs2", title: "Reduce content turnarounds", company: "GrowthCo", metric: "-58% cycle time", summary: "Marketing team cut campaign brief creation time by 58% with structured templates." }
    ],
    faqs: [
      { q: "Which models are supported?", a: "We support leading LLM providers and regularly add more, with safe fallbacks." },
      { q: "Do you issue certificates?", a: "Yes, complete assessments to earn verifiable certificates you can share." }
    ]
  });
};

// Pricing
export const getPricing: RequestHandler = (_req, res) => {
  res.json({
    currency: "USD",
    plans: [
      {
        id: "free",
        name: "Free",
        price: 0,
        interval: "month",
        features: ["5 sandbox runs/day", "Public courses", "Community access", "Basic certificates"],
        cta: { label: "Get Started", action: "signup" }
      },
      {
        id: "pro",
        name: "Pro",
        price: 29,
        interval: "month",
        features: ["Unlimited sandbox runs", "All courses & tracks", "Private library", "Priority support", "Advanced analytics"],
        cta: { label: "Start Trial", action: "checkout" }
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: null,
        interval: "custom",
        features: ["Everything in Pro", "SSO & SCIM", "Custom courses", "Admin dashboard", "Dedicated support"],
        cta: { label: "Contact Sales", action: "contact" }
      }
    ],
    comparison: [
      { key: "runs", label: "Sandbox runs", availability: { free: "limited", pro: true, enterprise: true } },
      { key: "tracks", label: "All learning tracks", availability: { free: false, pro: true, enterprise: true } },
      { key: "library", label: "Private library", availability: { free: false, pro: true, enterprise: true } },
      { key: "sso", label: "SSO & SCIM", availability: { free: false, pro: false, enterprise: true } },
      { key: "support", label: "Priority support", availability: { free: false, pro: true, enterprise: true } }
    ],
    faqs: [
      { q: "Can I cancel anytime?", a: "Yes, subscriptions can be canceled at any time from settings." },
      { q: "Do you offer annual plans?", a: "Yes, contact sales for annual pricing and volume discounts." }
    ]
  });
};

// Start checkout (mock) - replace with Stripe when connected
export const startCheckout: RequestHandler = async (req, res) => {
  const { planId, email } = req.body as { planId?: string; email?: string };
  if (!planId || !email) return res.status(400).json({ error: "Missing fields" });
  // In production, integrate Stripe. Here we generate a mock URL and send an email confirmation
  const checkoutId = createId("chk");
  const url = `/signup?plan=${encodeURIComponent(planId)}&email=${encodeURIComponent(email)}`;
  await sendMail({ id: createId("mail"), to: email, subject: `Your ${planId} trial is starting`, text: `Visit ${url} to continue`, html: `<p>Visit <a href="${url}">${url}</a> to continue</p>`, createdAt: new Date().toISOString() });
  res.json({ id: checkoutId, url });
};

// Team inquiry / contact sales
export const teamInquiry: RequestHandler = async (req, res) => {
  const { name, email, company, teamSize, message } = req.body as { name?: string; email?: string; company?: string; teamSize?: string | number; message?: string };
  if (!name || !email) return res.status(400).json({ error: "Missing fields" });
  const details = `Name: ${name}\nEmail: ${email}\nCompany: ${company || "-"}\nTeam Size: ${teamSize || "-"}\nMessage: ${message || "-"}`;
  await sendMail({ id: createId("mail"), to: process.env.SALES_EMAIL || email, subject: "New Team Inquiry", text: details, html: `<pre>${details}</pre>`, createdAt: new Date().toISOString() });
  res.json({ success: true });
};

// Resources (first‑party guides & in‑app videos)
export const marketingResources: RequestHandler = (_req, res) => {
  const now = new Date().toISOString();
  const guides = [
    {
      id: "g_prompt_patterns",
      type: "guide",
      title: "Prompt Patterns That Consistently Work",
      url: "/resources/guides/prompt-patterns",
      description: "Core prompting structures: role, goal, inputs, constraints, examples, steps, verification.",
      tags: ["prompting","patterns","best-practices"],
      createdAt: now,
      category: "Prompting",
      author: "AI-First Academy",
      content: `Overview\n\nGreat prompts share a repeatable structure: Role, Goal, Inputs, Constraints, Examples, Steps, and Verification.\n\nPattern: R-G-I-C-E-S-V\n- Role: Who is the assistant?\n- Goal: What outcome is required?\n- Inputs: What context or data is provided?\n- Constraints: Tone, length, format, tools.\n- Examples: 1–2 high-quality exemplars.\n- Steps: Explicit process to follow.\n- Verification: Acceptance checks and tests.\n\nTemplate\n\nYou are a {role}. Your goal is to {goal}. Use the inputs below and follow the constraints.\nInputs: {inputs}\nConstraints: {constraints}\nExamples: {examples}\nProcess: {steps}\nVerification: {checks}\n\nTips\n\nStart small, add constraints gradually, and verify with concrete checks.`
    },
    {
      id: "g_eval_playbook",
      type: "guide",
      title: "LLM Evaluation, Simply",
      url: "/resources/guides/llm-evaluation",
      description: "Quick, practical evaluation loops for prompts and RAG systems.",
      tags: ["evaluation","quality"],
      createdAt: now,
      category: "Evaluation",
      author: "AI-First Academy",
      content: `Why evaluate?\n\nEvaluation prevents regressions and guides iteration.\n\nMinimal loop\n1) Define task and acceptance criteria.\n2) Create 10–20 diverse test cases.\n3) Run and score (pass/fail + notes).\n4) Inspect failures, iterate prompt or data.\n5) Repeat until stable.\n\nMetrics\n- Accuracy/Pass rate\n- Consistency across seeds\n- Latency and cost\n\nAutomate later with scripts; start manual to learn failure modes.`
    },
    {
      id: "g_rag_basics",
      type: "guide",
      title: "RAG That Doesn’t Break",
      url: "/resources/guides/rag-basics",
      description: "Practical retrieval tips: chunking, metadata, query rewriting, and guardrails.",
      tags: ["rag","retrieval"],
      createdAt: now,
      category: "RAG",
      author: "AI-First Academy",
      content: `Retrieval basics\n\n1) Chunk documents by semantic units (sections, headings).\n2) Store rich metadata (title, section, tags).\n3) Rewrite user queries to improve recall.\n4) Post-filter by metadata before ranking.\n5) Cite sources and highlight uncertainty.\n\nGuardrails\n- Refuse when retrieval returns nothing.\n- Ask for clarification on ambiguous queries.\n- Log queries and misses for continuous improvement.`
    }
  ];

  const videos = [
    {
      id: "v_prompt_live",
      type: "video",
      title: "Live Prompting: From Vague to Specific",
      url: "/resources/videos/prompting-live",
      duration: "12m",
      tags: ["prompting"],
      createdAt: now,
      category: "Prompting",
      author: "AI-First Academy",
      platform: "YouTube",
      embedUrl: "https://www.youtube.com/embed/Z2-4eJ4V9aI"
    },
    {
      id: "v_eval_demo",
      type: "video",
      title: "Build a Tiny Eval Harness",
      url: "/resources/videos/eval-demo",
      duration: "9m",
      tags: ["evaluation"],
      createdAt: now,
      category: "Evaluation",
      author: "AI-First Academy",
      platform: "YouTube",
      embedUrl: "https://www.youtube.com/embed/0rZ5KkQ7Zt0"
    }
  ];

  res.json({ guides, videos });
};

// Newsletter signup (email capture)
export const newsletter: RequestHandler = async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ error: "Email required" });
  await sendMail({ id: createId("mail"), to: process.env.NEWSLETTER_EMAIL || email, subject: "Newsletter signup", text: `New signup: ${email}`, html: `<p>New signup: <b>${email}</b></p>`, createdAt: new Date().toISOString() });
  res.json({ success: true });
};

router.get("/product", getProduct);
router.get("/pricing", getPricing);
router.post("/checkout/start", startCheckout);
router.post("/inquiry", teamInquiry);
router.get("/resources", marketingResources);
router.post("/newsletter", newsletter);

export default router;
