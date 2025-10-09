# 🎓 AI-First Academy
Professional AI prompting education for working professionals.

---

## Overview
AI-First Academy is a learning platform that teaches practical, role‑specific AI workflows. Learners practice with real models, track progress, and earn certificates. The codebase is a full‑stack TypeScript app: React 19 + Vite on the client and Express on the server, with optional Supabase for persistence and Netlify for deployment.

---

## Features
- Role‑specific learning tracks (Engineer, Marketer, Designer, Manager, Researcher)
- OTP email verification and JWT sessions; optional OAuth (Google/Microsoft)
- Interactive AI sandbox (in progress) with multi‑model support
- Community features (prompts, discussions) and progress dashboards
- Production‑ready middleware: security headers, CORS, rate limiting, health checks

---

## Tech stack
```
Frontend:  React 19 + TypeScript + Vite + Tailwind CSS + Radix UI
Backend:   Express.js + TypeScript
Database:  Supabase (PostgreSQL) — optional, with SQL scripts and helpers
Auth:      OTP via email + JWT sessions; optional OAuth (Google/Microsoft)
Email:     Resend API (recommended) with SMTP fallback via Nodemailer
Hosting:   Netlify (SPA + serverless function proxy)
```

Notes
- The AI sandbox API and Supabase routes are present under server/routes but may be uncommitted yet (see working tree). They are wired in server/index.ts.
- Vite dev server proxies API requests by mounting the Express app only for /api/* paths.

---

## Quick start
Prerequisites
- Node.js 20+
- pnpm
- Git

Clone and run
```bash
git clone <your-repo-url>
cd aifirstacademy
pnpm install

# Configure env (see Environment)
# Create .env and set required variables

# Start dev (Vite + Express middleware)
pnpm dev
# Default: http://localhost:3000 (uses PORT env var if set)
```

Build and serve
```bash
# Build SPA
yarn build # or: pnpm build
# Build server bundle only
pnpm build:server
# Run production server
pnpm start
```

---

## Project structure
```
aifirstacademy/
├─ client/                 # React SPA (Vite)
│  ├─ components/          # Reusable UI (shadcn/radix based)
│  │  └─ ui/               # Generated UI primitives
│  ├─ pages/               # Route components
│  ├─ lib/                 # Client utilities (API, helpers)
│  └─ App.tsx              # Router and app providers
├─ server/                 # Express API
│  ├─ routes/              # API endpoints
│  │  ├─ auth.ts           # OTP + JWT (legacy/dev-friendly)
│  │  ├─ auth-enhanced.ts  # Enhanced auth (sessions + OAuth helpers)
│  │  ├─ sandbox-ai.ts     # AI sandbox endpoints (in progress)
│  │  ├─ *-supabase.ts     # Supabase-backed routes
│  ├─ utils/               # jwt, mailer, etc.
│  ├─ middleware/          # auth-enhanced middleware
│  ├─ storage.ts           # Local/dev storage helpers
│  └─ storage-supabase.ts  # Supabase storage helpers
├─ shared/                 # Shared types/interfaces
├─ database/               # SQL schema, RLS, seeders
├─ netlify/                # Serverless function entry (proxy)
├─ scripts/                # Migrate/verify Supabase helpers
├─ vite.config.ts          # Dev server with Express mount for /api
├─ vite.config.server.ts   # Server build config (SSR library build)
└─ tailwind.config.ts      # Tailwind theme and tokens
```

---

## Environment
Create a .env file at the repo root. Variables used across the app include:
```env
# Frontend/Server
PORT=3000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# Auth (JWT)
JWT_SECRET=your-secure-jwt-secret

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MS_CLIENT_ID=
MS_CLIENT_SECRET=
# Optional explicit redirect base
OAUTH_REDIRECT_BASE=http://localhost:3000

# Email
RESEND_API_KEY=
# SMTP fallback (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Supabase (optional)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Dev tips
- OTP codes print to the server console in development.
- CORS is open in dev; in production, FRONTEND_URL governs allowed origins.
- Health check: GET /api/health returns service status (includes Supabase connectivity check).

---

## Scripts (package.json)
```bash
pnpm dev             # Start Vite dev server (Express mounted at /api)
pnpm build           # Build client + server
pnpm build:client    # Build SPA only
pnpm build:server    # Build server bundle (dist/server)
pnpm build:netlify   # Build for Netlify (SPA + functions)
pnpm start           # Run production server (node dist/server/node-build.mjs)
pnpm test            # Run unit tests (vitest --run)
pnpm typecheck       # tsc type check
pnpm format.fix      # prettier --write .
```

---

## API overview
Mounted in server/index.ts
- GET /api/ping — ping message
- GET /api/health — service health and environment flags
- GET /api/placeholder/:width/:height — SVG placeholder
- Auth (legacy): /api/auth (signup, login, otp flows, me, logout)
- Auth (enhanced): /api/auth-v2 (session managed, optional OAuth)
- Additional routers: /api/sandbox, /api/community, /api/learning, /api/library,
  /api/search, /api/notifications, /api/marketing, /api/dashboard, /api/certificates,
  /api/settings, /api/admin

Note: Some “*-supabase” and “sandbox-ai” routes are currently present as untracked files in your working tree.

---

## Deployment (Netlify)
- Netlify config is in netlify.toml (redirect /api/* → /.netlify/functions/api/*; SPA fallback to /index.html)
- The server is compiled and served via a single Netlify function (see netlify/functions/api.ts)
- Set required environment variables in Netlify dashboard

Manual steps
```bash
pnpm build:netlify
netlify deploy --prod --dir=dist/spa
```

---

## Troubleshooting
Dev server won’t start
```bash
# Windows PowerShell example
rm -r -fo node_modules; Remove-Item pnpm-lock.yaml
pnpm install
pnpm dev
```

Wrong port
- Vite dev server reads PORT (default 3000). Update PORT or open http://localhost:3000

Auth issues
- Ensure JWT_SECRET is set; clear browser cookies/localStorage; verify email config

Supabase errors
- Check SUPABASE_URL and keys; run scripts in database/*.sql; review RLS policies

---

## Documentation
- EMAIL_SETUP.md — Email/OTP setup
- NETLIFY_DEPLOYMENT.md — Netlify deployment guide
- DOCUMENTATION.md — Additional docs (present but uncommitted yet)
- MIGRATION_GUIDE.md — Supabase migration notes
- PROJECT_STATUS.md — Current scope and progress
- AI-First-Academy-PRD.md — Product requirements (high‑level)

---

## Contributing
```bash
# Standard flow
1. Fork
2. git checkout -b feature/my-change
3. pnpm typecheck && pnpm test
4. git commit -m "feat(scope): concise message"
5. git push origin feature/my-change
6. Open PR
```

Coding standards
- TypeScript throughout; keep typings in shared/ when useful
- Prettier formatting; prefer small, focused PRs
- Tests with vitest (where applicable)

---

## License
MIT — see LICENSE.

