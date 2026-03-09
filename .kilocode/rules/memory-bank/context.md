# Active Context: DocuBot SaaS Platform

## Current State

**Project Status**: ✅ Phase 1 backend operational (real API + persistence)

DocuBot is an AI-powered business chatbot platform. The frontend now talks to real Next.js API routes backed by a persistent Drizzle schema (SQLite dialect) instead of in-memory mock APIs. Authentication/session, organization-scoped bot/document/chat APIs, widget tokens, and dashboard overview are now persisted.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] Built ManualBot full-stack SaaS in manualbot/ directory
- [x] Ported frontend to root app (src/) for preview on port 3000
- [x] Installed zustand, lucide-react, react-dropzone, date-fns
- [x] All pages: dashboard, bots, bot detail, documents, chat, embed, settings, analytics, auth
- [x] Added mock data layer with demo user, bots, documents, analytics
- [x] Replaced API client with mock implementations — all pages work without backend
- [x] Auto-login with demo user (Alex Chen @ Acme Corp, Pro plan)
- [x] Chat page returns intelligent mock responses with citations
- [x] Bot creation, deletion, document upload all work with in-memory state
- [x] Added backend architecture plan (plans/backend-architecture.md)
- [x] Added ChatGPT OAuth + API key auth plan (plans/chatgpt-oauth-auth.md)
- [x] **REBRAND: ManualBot → DocuBot** across entire frontend
- [x] **Created comprehensive brain/engine architecture plan** (plans/brain-engine-architecture.md)
- [x] **Redesigned landing page** — cleaner layout, proper feature grid, engine diagram section, fixed graphics
- [x] Updated all branding: nav, footer, auth pages, dashboard sidebar, embed snippets, mock data, auth store
- [x] **Updated all OpenAI model references**: gpt-4o → gpt-4.1, gpt-4o-mini → gpt-4.1-mini (10 files, 25 references)
- [x] Updated landing page banner text
- [x] Created operational planning docs for ChatGPT OAuth stack (`plans/full-operational-build-plan.md`, `plans/knowledge-engine-spec.md`, `plans/implementation-checklist.md`)
- [x] Added Drizzle database setup (`drizzle.config.ts`, `src/db/schema.ts`, `src/db/index.ts`, `src/db/migrate.ts`)
- [x] Generated initial DB migration (`src/db/migrations/0000_cold_hellcat.sql`)
- [x] Implemented real auth/session API (`/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/organizations`)
- [x] Implemented organization-scoped APIs for bots/documents/chats/widget tokens/analytics under `/api/v1/organizations/*`
- [x] Added env validation (`src/lib/env.ts`, `src/lib/env-client.ts`)
- [x] Replaced mock frontend API client with real fetch client (`src/lib/api.ts`)
- [x] Disabled demo auto-login in auth store (`src/store/auth.ts`)
- [x] Implemented ChatGPT OAuth flow end-to-end: initiate (`/api/v1/auth/oauth/openai`), callback (`/api/v1/auth/oauth/openai/callback`), status (`/api/v1/auth/oauth/openai/status`), unlink (`/api/v1/auth/oauth/openai/unlink`)
- [x] Added OAuth server utility module for authorize URL, state encoding/decoding, token exchange, and OpenAI profile fetch (`src/server/oauth.ts`)
- [x] Added frontend OAuth UX: "Sign in with ChatGPT" on login, OAuth session finalizer route/page (`/auth/oauth/callback`), and OpenAI connect/disconnect controls in bot AI settings
- [x] Implemented Phase A New Bot Wizard shell (5-step guided flow) replacing simple create modal
- [x] Added batch manual URL import API endpoint (`/api/v1/organizations/[orgId]/bots/[botId]/documents/import-urls`) and frontend client wiring
- [x] Extended Documents into initial Manual Library behavior: upload + URL import actions and source-type labeling
- [x] Added architecture plan for full V1 wizard + manual library + approved-source crawling (`plans/new-bot-wizard-manual-library-v1.md`)
- [x] Added deploy-safe environment fallback for missing DB config and restored demo login auto-provisioning in auth login route

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Marketing landing page (DocuBot branded) | ✅ Redesigned |
| `src/app/layout.tsx` | Root layout (dark theme, Inter font, DocuBot metadata) | ✅ Updated |
| `src/app/globals.css` | Global styles + animations | ✅ Ready |
| `src/app/dashboard/` | Dashboard pages (overview, bots, analytics) | ✅ Rebranded |
| `src/app/dashboard/bots/[botId]/` | Bot detail, documents, chat, embed, settings | ✅ Rebranded |
| `src/app/auth/` | Login and register pages | ✅ Rebranded |
| `src/app/error.tsx` | Error boundary | ✅ Rebranded |
| `src/app/not-found.tsx` | 404 page | ✅ Rebranded |
| `src/lib/api.ts` | Mock API client (no backend needed) | ✅ Rebranded |
| `src/lib/api.ts` | Real API client (fetch to `/api/v1`) | ✅ Updated |
| `src/lib/mock-data.ts` | Demo data (users, bots, docs, analytics) | ✅ Rebranded |
| `src/store/auth.ts` | Zustand auth store (real session tokens) | ✅ Updated |
| `src/app/api/v1/` | Backend API routes for auth/org/bots/docs/chat | ✅ NEW |
| `src/db/` | Drizzle schema + migrations | ✅ NEW |
| `src/server/` | Server auth/serialization helpers | ✅ NEW |
| `src/types/index.ts` | TypeScript interfaces | ✅ Ready |
| `plans/brain-engine-architecture.md` | Full brain/engine architecture plan | ✅ NEW |
| `plans/backend-architecture.md` | Backend architecture plan | ✅ Ready |
| `plans/chatgpt-oauth-auth.md` | OAuth + API key auth plan | ✅ Ready |
| `manualbot/` | Full-stack backend (FastAPI, not running) | ✅ Scaffolded |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Current Focus

The app has been rebranded from "ManualBot" to "DocuBot" with the tagline "Your business knowledge, instantly accessible." The landing page has been completely redesigned with:

- Clean hero section with clear value proposition
- Dashboard preview with proper stat cards and bot cards
- "How It Works" section (3 steps: Upload → AI Learns → Embed)
- "The Engine" section showing the 3-layer brain architecture visually
- 9-feature grid covering all capabilities
- Updated pricing (Starter $0, Pro $29, Business $79)
- Clean CTA and footer

A comprehensive brain/engine architecture plan has been created covering:
- 3-layer architecture: Knowledge Ingestion → Semantic Search → Answer Engine
- Vision AI for diagram/table extraction from PDFs
- AI-powered web search fallback via Tavily API
- OAuth integration for zero AI costs (users bring their own OpenAI account)
- Feedback loop and analytics-driven improvement
- Complete end-to-end flow documentation

## Demo Data

- **User**: Alex Chen (demo@docubot.ai)
- **Organization**: Acme Corp (Pro plan)
- **Bots**: Support Bot (active), Sales Assistant (active), Onboarding Guide (inactive)
- **Documents**: 5 PDFs for Support Bot, 2 for Sales, 1 for Onboarding
- **Analytics**: 23 docs, 4,826 chunks, 47 chats today, 1,284 total, 12 unresolved

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Pending Improvements

- [x] Wire up real backend APIs in Next.js App Router (`/api/v1`)
- [x] Implement full ChatGPT OAuth initiation/callback/linking flow (currently schema + token fields are ready)
- [ ] Build the brain/engine (per plans/brain-engine-architecture.md)
- [ ] Add authentication flow with real API
- [ ] Add more recipes (auth, email, etc.)
- [ ] Add testing setup
- [ ] Add responsive mobile navigation

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-03-08 | Built out ManualBot full-stack SaaS application in `manualbot/` directory |
| 2026-03-08 | Ported ManualBot frontend to root app for port 3000 preview |
| 2026-03-08 | Added mock data layer, landing page, auto-login — full demo works without backend |
| 2026-03-08 | Added backend architecture plan and ChatGPT OAuth auth plan |
| 2026-03-08 | **REBRAND: ManualBot → DocuBot** — updated all branding, redesigned landing page, created comprehensive brain/engine architecture plan |
| 2026-03-08 | **Updated all OpenAI model references** — gpt-4o → gpt-4.1, gpt-4o-mini → gpt-4.1-mini across 10 files (plans, frontend, backend config) |
| 2026-03-09 | Updated landing page banner text to reflect Kilo Agent generation |
| 2026-03-09 | Added planning docs for full operational ChatGPT OAuth stack and implemented Phase 1: real auth/session, persistent DB + migrations, org-scoped bots/documents/chat APIs, env validation, and frontend API wiring |
| 2026-03-09 | Implemented full OpenAI OAuth linking/auth flow in Next.js APIs + frontend login/settings UX, including callback session finalization and connection status/unlink endpoints |
| 2026-03-09 | Implemented Phase A onboarding upgrades: New Bot Wizard shell, batch manual URL import endpoint/client wiring, and initial Manual Library URL+upload workflow |
