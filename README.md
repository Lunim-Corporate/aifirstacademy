# AI-First Academy – Monorepo

This repository contains a React (Vite) frontend under `client/` and an Express API under `server/` with shared TypeScript types in `shared/`.

- Dev mode: Vite serves the frontend and mounts the Express API as middleware (single process, single URL)
- Prod mode: SPA is built to `dist/spa` and served by the compiled Express server from `dist/server`

## Prerequisites
- Node.js 20+ (recommended) – matches the server build target
- pnpm (package manager)
  - If not installed: enable via Corepack
    - macOS/Linux/Windows (PowerShell): `corepack enable pnpm`

## Quick Start (Development)
1) Install dependencies
   - `pnpm install`
2) (Optional) Create a `.env` in the repo root to customize behavior (see .env section below)
3) Start the dev server
   - `pnpm dev`
4) Open the app
   - Frontend + API: http://localhost:8080
   - All API routes are available under the same origin at `/api/*`

Notes
- First run seeds a local database at `server/data/db.json`
- OTP/Emails are written to `server/data/outbox.json` and also printed to the console unless SMTP is configured
- To “factory reset” data, stop the server and delete `server/data/db.json`

## Project Structure
- `client/` – React app (Vite + Tailwind + Radix UI)
- `server/` – Express app with routes (auth, community, library, marketing, etc.)
- `shared/` – Shared TypeScript interfaces used by both client and server
- `dist/` – Build output (created after `pnpm build`)

## Scripts
- `pnpm dev` – Run Vite dev server (serves client + mounts API)
- `pnpm build` – Build client and server for production
- `pnpm start` – Start the compiled server (serves built SPA + API)
- `pnpm test` – Run unit tests (Vitest)
- `pnpm typecheck` – TypeScript type check

## Environment Variables (.env)
Create a `.env` file at the repo root to configure optional features. Reasonable defaults exist for local development.

Recommended local `.env` template:

PORT=3000
PING_MESSAGE=ping
JWT_SECRET=dev-secret
OAUTH_REDIRECT_BASE=http://localhost:3000

# SMTP (optional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_FROM=AI-First Academy <no-reply@example.com>

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/oauth/google/callback
MS_CLIENT_ID=
MS_CLIENT_SECRET=
MS_REDIRECT_URI=http://localhost:3000/api/auth/oauth/microsoft/callback

# Notifications/marketing (optional)
SALES_EMAIL=
NEWSLETTER_EMAIL=

How env is used
- Server reads `process.env.*` for auth, marketing, mailer, and diagnostics.
- In dev, Vite runs the server in the same process. If you need custom env values in dev, export them in your shell before `pnpm dev` (or use a `.env` loader in your shell). Defaults cover local usage.

## Running in Production (Locally)
1) Build
   - `pnpm build`
2) Start
   - `pnpm start`
3) Access
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

## Frontend (client) Details
- Tech: React 18, Vite 7, TailwindCSS, Radix UI
- Aliases:
  - `@` -> `./client`
  - `@shared` -> `./shared`
- Dev URL: http://localhost:8080
- Build output: `dist/spa`

## Backend (server) Details
- Tech: Express 5, TypeScript
- Routes mounted under `/api/*` (auth, community, dashboard, learning, library, marketing, notifications, search, sandbox)
- Local DB: JSON file at `server/data/db.json` (auto-created and migrated on start)
- Outbox mail: `server/data/outbox.json`
- Build output: `dist/server/node-build.mjs`

## Authentication & Email
- **OTP Authentication**: Users receive 6-digit codes for secure login/signup
- **Multiple Email Services**: Supports Resend, Gmail, SMTP, and Ethereal
- **Development Mode**: OTP codes display in console automatically (no setup required)
- **Production Ready**: Configure any email service for production use
- **Fallback System**: If email services fail, codes still appear in console

### Email Setup (Optional)
For **immediate testing**, no setup needed! OTP codes appear in the server console.

For **production**, configure one of these in your `.env` file:
- **Resend API** (recommended): `RESEND_API_KEY=re_xxxxxxxxxx`
- **Gmail**: `GMAIL_USER=email@gmail.com` + `GMAIL_APP_PASSWORD=xxxxxxxx`
- **Custom SMTP**: Standard SMTP configuration
- **Ethereal**: Automatic test accounts (development only)

See `EMAIL_SETUP.md` for detailed setup instructions.

## Troubleshooting
- Port 8080 busy (dev): change Vite port in `vite.config.ts` or stop the other process
- Port 3000 busy (prod): set `PORT` in `.env` before `pnpm start`
- Reset DB: delete `server/data/db.json` (with server stopped)
- OAuth not showing: missing Google/Microsoft client IDs; see `.env` template

## Deployment (Optional)
- **Netlify**: Connect your repository to Netlify and it will build from source automatically. Ensure `pnpm build` works locally first.
- **Vercel**: Connect your repository to Vercel for automatic deployments. The platform will handle the build process.
- **Manual Deployment**: Run `pnpm build` and serve the contents of `dist/` directory with any static hosting service.
- **Self-hosted**: After running `pnpm build`, use `pnpm start` to run the production server on your own infrastructure.
