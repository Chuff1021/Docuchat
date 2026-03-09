# Knowledge Engine Spec (ChatGPT OAuth Only)

## Scope
This spec defines the provider and retrieval behavior for the DocuBot answer engine. The only model provider is ChatGPT OAuth (OpenAI OAuth token bound to user account).

## Provider Contract
- Source of model credentials: `users.oauth_access_token`.
- No system fallback model key in this stack.
- If OAuth token is absent/expired, API returns a controlled fallback response instructing user to connect ChatGPT.

## Inputs
- `organization_id`
- `bot_id`
- `session_token` (optional)
- user message

## Retrieval Inputs (Phase 1 baseline)
- document metadata list for selected bot
- no vector retrieval yet; placeholder context assembly from uploaded docs

## Generation Behavior
1. Resolve chat session (create if needed).
2. Build constrained prompt from bot config + document context summary.
3. If OAuth token exists, call OpenAI Responses API (`gpt-4.1-mini`).
4. Persist user + assistant messages.
5. Return answer payload + citations structure expected by frontend.

## Output Contract
- `answer`, `session_token`, `message_id`
- `citations[]`, `sources[]`
- `answer_found`, `confidence`, `tokens_used`, `latency_ms`

## Phase 2+ Additions
- OAuth token refresh before expiry.
- chunk-level retrieval with embeddings.
- citation extraction from selected chunks.
- strict-mode enforcement using retrieval confidence threshold.
