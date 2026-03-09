# Implementation Checklist

## Phase 1 (In Scope)

- [x] Create architecture/planning docs for full operational build.
- [x] Add Drizzle database setup (`schema`, `index`, `migrate`, `drizzle.config.ts`).
- [x] Define persistent schema for auth, orgs, bots, docs, sessions, chat, and widget tokens.
- [x] Add real auth endpoints: register, login, me, my-organizations.
- [x] Add organization-scoped API endpoints:
  - [x] bots CRUD
  - [x] widget token list/create
  - [x] documents list/upload/delete/reprocess
  - [x] chat send
  - [x] analytics overview
- [x] Add environment validation (`src/lib/env.ts`, `src/lib/env-client.ts`).
- [x] Replace mock frontend API client with real fetch-based API client.
- [x] Remove demo auto-login in auth store.
- [ ] Generate and commit migration SQL artifacts.
- [ ] Run typecheck + lint and fix all remaining issues.

## Phase 2 (Next)

- [ ] Implement complete ChatGPT OAuth authorize/callback/link/unlink flow.
- [ ] Add OAuth token refresh and expiry handling.
- [ ] Add connected provider UI and status in dashboard settings.
- [ ] Enforce provider-only chat mode (no non-OAuth fallback).

## Phase 3 (Next)

- [ ] Build ingestion pipeline with parsing/chunking/embeddings.
- [ ] Add retrieval-based answer generation with grounded citations.
- [ ] Add background job orchestration and retry behavior.
- [ ] Expand analytics (top questions, unresolved tracking, latency).
