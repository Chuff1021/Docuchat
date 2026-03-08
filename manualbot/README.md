# ManualBot 🤖

**Production-style multi-tenant SaaS** — Upload PDF manuals, create AI chatbots, embed them on any website.

---

## Architecture

```
manualbot/
├── apps/
│   ├── api/          # FastAPI backend (Python)
│   └── web/          # Next.js 15 dashboard (TypeScript)
├── packages/
│   └── widget/       # Embeddable JS widget
├── infra/
│   └── docker-compose.yml
├── Makefile
└── README.md
```

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Zustand |
| Backend | FastAPI, SQLAlchemy (async), Pydantic v2 |
| Database | PostgreSQL 16 |
| Queue | Celery + Redis |
| Vector DB | Qdrant |
| AI | OpenAI (embeddings + chat, swappable) |
| Storage | Local filesystem (S3-compatible abstraction) |
| Migrations | Alembic |

---

## Quick Start

### Prerequisites

- Docker + Docker Compose
- An OpenAI API key

### 1. Clone and configure

```bash
cd manualbot

# Copy env files
make setup

# Edit the API env file and add your OpenAI key
nano apps/api/.env
# Set: OPENAI_API_KEY=sk-your-key-here
```

### 2. Start everything

```bash
make up-build
```

This will:
- Start PostgreSQL, Redis, Qdrant
- Run database migrations automatically
- Seed demo account
- Start the API server (port 8000)
- Start the Celery worker
- Start the Next.js dashboard (port 3000)

### 3. Open the dashboard

```
http://localhost:3000
```

**Demo login:**
- Email: `demo@manualbot.ai`
- Password: `demo1234`

---

## Usage Flow

1. **Sign up** or use demo credentials
2. **Create a bot** — give it a name, greeting, brand color
3. **Upload PDFs** — drag & drop your manuals/documentation
4. **Wait for ingestion** — watch the status update (auto-polls every 5s)
5. **Test the chat** — use the live chat tester in the dashboard
6. **Copy embed snippet** — go to Embed tab, copy the HTML snippet
7. **Embed on your website** — paste before `</body>`

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register + create org |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/auth/me` | Current user |
| GET | `/api/v1/auth/me/organizations` | User's orgs |

### Bots
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/orgs/{org_id}/bots` | List bots |
| POST | `/api/v1/orgs/{org_id}/bots` | Create bot |
| GET | `/api/v1/orgs/{org_id}/bots/{bot_id}` | Get bot |
| PATCH | `/api/v1/orgs/{org_id}/bots/{bot_id}` | Update bot |
| DELETE | `/api/v1/orgs/{org_id}/bots/{bot_id}` | Delete bot |
| GET | `/api/v1/orgs/{org_id}/bots/{bot_id}/widget-tokens` | List tokens |
| POST | `/api/v1/orgs/{org_id}/bots/{bot_id}/widget-tokens` | Create token |

### Documents
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/orgs/{org_id}/bots/{bot_id}/documents` | List docs |
| POST | `/api/v1/orgs/{org_id}/bots/{bot_id}/documents` | Upload PDF |
| DELETE | `/api/v1/orgs/{org_id}/bots/{bot_id}/documents/{doc_id}` | Delete doc |
| POST | `/api/v1/orgs/{org_id}/bots/{bot_id}/documents/{doc_id}/reprocess` | Reprocess |
| GET | `/api/v1/orgs/{org_id}/ingestion-jobs` | List all jobs |

### Chat (Admin)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/orgs/{org_id}/bots/{bot_id}/chat` | Send message |
| GET | `/api/v1/orgs/{org_id}/bots/{bot_id}/chat/sessions` | List sessions |

### Chat (Public Widget)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/widget/chat/{widget_token}` | Send message (public) |
| GET | `/api/v1/widget/chat/{widget_token}/config` | Get bot config |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/orgs/{org_id}/analytics/overview` | Overview stats |
| GET | `/api/v1/orgs/{org_id}/analytics/bots/{bot_id}` | Bot analytics |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/detailed` | Dependency health |
| GET | `/metrics` | Basic metrics |

---

## Widget Embedding

```html
<!-- Paste before </body> on your website -->
<script
  src="http://localhost:8000/widget.js"
  data-bot="wt_your_widget_token"
  async
></script>
```

The widget:
- Shows a floating chat bubble
- Matches your bot's brand color
- Displays citations from source documents
- Works on mobile
- Validates allowed domains

---

## Development

### Local development (without Docker)

```bash
# Backend
cd apps/api
pip install -r requirements.txt
cp .env.example .env  # Edit with your settings
alembic upgrade head
python seed.py
uvicorn app.main:app --reload

# Worker (separate terminal)
celery -A app.workers.celery_app worker --loglevel=info -Q ingestion,default

# Frontend
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

### Useful commands

```bash
make logs          # Follow all logs
make logs-api      # API logs only
make logs-worker   # Worker logs only
make db-shell      # PostgreSQL shell
make api-shell     # API container shell
make migrate       # Run migrations
make seed          # Re-seed demo data
make down          # Stop services
make down-v        # Stop + remove volumes
```

---

## Configuration

### Backend (`apps/api/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | JWT signing key | ✅ |
| `DATABASE_URL` | PostgreSQL connection | ✅ |
| `REDIS_URL` | Redis connection | ✅ |
| `QDRANT_URL` | Qdrant connection | ✅ |
| `OPENAI_API_KEY` | OpenAI API key | ✅ |
| `STORAGE_BACKEND` | `local` or `s3` | ✅ |
| `EMBEDDING_MODEL` | Embedding model name | ✅ |
| `CHAT_MODEL` | Chat model name | ✅ |

### Frontend (`apps/web/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_WIDGET_URL` | Widget CDN URL |

---

## Data Model

```
users ──────────── memberships ──── organizations
                                         │
                                        bots
                                    ┌────┴────┐
                                documents   widget_tokens
                                    │
                              document_chunks ──── qdrant
                                    │
                              ingestion_jobs

chat_sessions ──── chat_messages
analytics_events
```

---

## What's Implemented ✅

- [x] Multi-tenant auth (JWT, bcrypt, org isolation)
- [x] Bot CRUD with full settings
- [x] PDF upload + validation
- [x] Async ingestion pipeline (Celery)
- [x] PDF text extraction (pypdf)
- [x] Text chunking with overlap
- [x] OpenAI embeddings
- [x] Qdrant vector storage (bot/org scoped)
- [x] RAG chat with citations
- [x] Strict mode (docs-only answers)
- [x] Conversation memory (session-based)
- [x] Widget token system (public vs admin)
- [x] Domain allowlisting
- [x] Dashboard UI (all pages)
- [x] Document management with status polling
- [x] Live chat tester
- [x] Embed code generator
- [x] Analytics overview
- [x] Embeddable JS widget
- [x] Docker Compose setup
- [x] Alembic migrations
- [x] Seed script with demo data
- [x] Health endpoints
- [x] Structured logging

## What's Stubbed / Next Steps 🔜

- [ ] Email verification flow
- [ ] Password reset
- [ ] Team member invitations
- [ ] Billing / plan limits
- [ ] S3 storage (abstraction ready, needs credentials)
- [ ] Rate limiting middleware (structure in place)
- [ ] Webhook escalation
- [ ] Lead capture form in widget
- [ ] Widget build pipeline (esbuild)
- [ ] More embedding providers (Cohere, local)
- [ ] More chat providers (Anthropic, Mistral)
- [ ] Streaming chat responses
- [ ] Advanced analytics charts
- [ ] Export conversations

---

## Security Notes

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with expiry
- Widget tokens are separate from admin API keys
- File type and size validation on upload
- Filename sanitization
- CORS configured
- Org-scoped data isolation throughout
- Never expose admin keys to widget

---

## License

MIT
