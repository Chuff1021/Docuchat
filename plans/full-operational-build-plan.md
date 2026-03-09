# Full Operational Build Plan: ChatGPT OAuth Stack

## Objective
Move DocuBot from mock-mode to production-capable Phase 1 with a single provider strategy: ChatGPT OAuth for model execution.

## Architecture Direction
- Keep a unified Next.js App Router monolith (UI + API routes).
- Use Drizzle + SQLite-compatible backend (via `@kilocode/app-builder-db`) for persistent entities and migrations.
- Maintain bearer session auth for dashboard/API access.
- Store ChatGPT OAuth linkage on user records; do not add alternate AI providers.

## Phase Breakdown

### Phase 1 (implementation target in this request)
- Replace mock auth with real register/login/session endpoints.
- Add persistent schema + generated SQL migrations.
- Implement organization-scoped APIs for bots, documents, widget tokens, chat, and analytics overview.
- Add strict env validation for DB/auth/OAuth/OpenAI base URLs.
- Rewire frontend API client/store to hit real backend endpoints.

### Phase 2
- Implement full ChatGPT OAuth initiation + callback + token refresh lifecycle.
- Use OAuth access tokens in chat generation path by default.
- Add connected-account UI in settings.

### Phase 3
- Complete ingestion pipeline (PDF parse/chunk/embed), vector retrieval, and citation-grounded answers.
- Add background processing, retry policies, and richer analytics.

## Data Model Scope (Phase 1)
- `users`, `sessions`, `organizations`, `organization_members`
- `bots`, `documents`, `widget_tokens`
- `chat_sessions`, `chat_messages`

## Operational Definition for This Milestone
- User can register/login, persist session, create bots, upload/delete docs, open chat, and receive backend responses.
- Dashboard no longer depends on in-memory mock state.
- Schema and migration files exist and are versioned.
