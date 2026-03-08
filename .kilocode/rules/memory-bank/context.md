# Active Context: ManualBot SaaS Platform

## Current State

**Project Status**: ✅ Fully functional demo preview

ManualBot is an AI-powered documentation chatbot platform. The frontend is fully built with mock data, so the entire app works in the browser without a backend API.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] Built ManualBot full-stack SaaS in manualbot/ directory
- [x] Ported ManualBot frontend to root app (src/) for preview on port 3000
- [x] Installed zustand, lucide-react, react-dropzone, date-fns
- [x] All pages: dashboard, bots, bot detail, documents, chat, embed, settings, analytics, auth
- [x] Added mock data layer (src/lib/mock-data.ts) with demo user, bots, documents, analytics
- [x] Replaced API client with mock implementations — all pages work without backend
- [x] Auto-login with demo user (Alex Chen @ Acme Corp, Pro plan)
- [x] Built marketing landing page at / with hero, features, how-it-works, pricing, CTA
- [x] Chat page returns intelligent mock responses with citations
- [x] Bot creation, deletion, document upload all work with in-memory state

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Marketing landing page | ✅ Ready |
| `src/app/layout.tsx` | Root layout (dark theme, Inter font) | ✅ Ready |
| `src/app/globals.css` | Global styles + animations | ✅ Ready |
| `src/app/dashboard/` | Dashboard pages (overview, bots, analytics) | ✅ Ready |
| `src/app/dashboard/bots/[botId]/` | Bot detail, documents, chat, embed, settings | ✅ Ready |
| `src/app/auth/` | Login and register pages | ✅ Ready |
| `src/lib/api.ts` | Mock API client (no backend needed) | ✅ Ready |
| `src/lib/mock-data.ts` | Demo data (users, bots, docs, analytics) | ✅ Ready |
| `src/store/auth.ts` | Zustand auth store (auto-login) | ✅ Ready |
| `src/types/index.ts` | TypeScript interfaces | ✅ Ready |
| `manualbot/` | Full-stack backend (FastAPI, not running) | ✅ Scaffolded |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Current Focus

The app is fully functional as a demo. All pages render with realistic mock data. Users can:
- Browse the landing page and navigate to the dashboard
- View dashboard with animated stat cards and bot list
- Create and delete bots (in-memory)
- View bot details, documents, settings
- Upload documents (simulated)
- Chat with the AI bot (mock responses with citations)
- View analytics with charts and resolution rates
- Navigate between all pages seamlessly

## Demo Data

- **User**: Alex Chen (demo@manualbot.ai)
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
