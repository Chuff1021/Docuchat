# Active Context: DocuBot SaaS Platform

## Current State

**Project Status**: ✅ Fully functional demo preview (rebranded to DocuBot)

DocuBot is an AI-powered business chatbot platform. Upload your docs, get an AI expert that answers questions for your team and customers — with citations, on the first try. The frontend is fully built with mock data, so the entire app works in the browser without a backend API.

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
| `src/lib/mock-data.ts` | Demo data (users, bots, docs, analytics) | ✅ Rebranded |
| `src/store/auth.ts` | Zustand auth store (auto-login) | ✅ Rebranded |
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

- [ ] Wire up real backend (FastAPI in manualbot/apps/api/)
- [ ] Implement OAuth flow (per plans/chatgpt-oauth-auth.md)
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
