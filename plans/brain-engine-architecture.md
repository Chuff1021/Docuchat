# DocuBot AI — Brain & Engine Architecture

## Product Rebrand: ManualBot → DocuBot

**Why "DocuBot"?**
- "Manual" sounds like instruction manuals only — too narrow
- "Docu" = documentation, which covers manuals, guides, policies, SOPs, knowledge bases, FAQs
- "Bot" = clear it's a chatbot
- **Tagline**: "Your business knowledge, instantly accessible"
- **One-liner**: "Upload your docs. Get an AI expert that answers questions for your team and customers."

---

## What DocuBot Actually Is

DocuBot is a **one-shot business chatbot** — you upload your company's documents, and it creates an AI assistant that can answer any question about your business on the first try. No training, no fine-tuning, no waiting. Upload → Ask → Get expert answers with citations.

**Target users**: Small-to-medium businesses that want to:
- Give customers instant answers from their documentation
- Help internal teams find information fast
- Reduce support ticket volume
- Embed an AI assistant on their website

---

## The Brain: How DocuBot Understands Your Documents

### Overview

DocuBot's brain is a **Retrieval-Augmented Generation (RAG)** system with three layers:

```
┌─────────────────────────────────────────────────────────┐
│                    THE DOCUBOT BRAIN                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 1: KNOWLEDGE INGESTION                           │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ PDF     │  │ Text     │  │ Vision   │  │ Smart   │ │
│  │ Upload  │→ │ Extract  │→ │ Extract  │→ │ Chunk   │ │
│  │ + URLs  │  │ (pypdf)  │  │ (GPT-4o) │  │ + Embed │ │
│  └─────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                    ↓                    │
│  Layer 2: KNOWLEDGE STORE                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Vector Database (Qdrant)                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │   │
│  │  │ Text     │ │ Diagram  │ │ Table            │ │   │
│  │  │ Chunks   │ │ Descrip. │ │ Extractions      │ │   │
│  │  │ (embed.) │ │ (embed.) │ │ (embed.)         │ │   │
│  │  └──────────┘ └──────────┘ └──────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                    ↓                    │
│  Layer 3: ANSWER ENGINE                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Query    │→ │ Vector   │→ │ Context  │→ │ LLM    │ │
│  │ Planner  │  │ Search   │  │ Builder  │  │ Answer │ │
│  │          │  │ + Web    │  │          │  │ + Cite │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Layer 1: Knowledge Ingestion — How Documents Become Knowledge

### Step 1: Document Upload

The user uploads PDFs (drag & drop) or pastes URLs to PDF files. That's it — nothing else required from the user.

```
User Action:
  ├── Drag & drop PDF files
  └── Paste URLs (one per line)
      ↓
System:
  ├── Validate file type (PDF only for now)
  ├── Store original file (local/S3)
  ├── Create document record (status: "processing")
  └── Queue ingestion job
```

### Step 2: Text Extraction

Every page of the PDF is processed by `pypdf` to extract raw text.

```
PDF (50 pages)
  ↓
pypdf extracts text page-by-page
  ↓
Result: Array of { page_number, raw_text, word_count }
```

### Step 3: Vision Extraction (The Secret Sauce)

Technical documents are full of diagrams, tables, flowcharts, and images that text extraction completely misses. This is where DocuBot gets smart.

**How it works:**
1. Convert each PDF page to an image using `pdf2image`
2. Detect which pages likely contain visual content:
   - Pages with < 100 words of text (probably a diagram/image page)
   - Pages containing keywords: "figure", "diagram", "table", "schematic"
   - Pages with mixed text + images
3. Send detected pages to **GPT-4o Vision** with this prompt:

```
"Analyze this page from a business document. Describe ALL visual elements:
 - Diagrams: describe connections, flow, components, labels
 - Tables: extract all data in structured format
 - Charts: describe data, axes, trends
 - Images: describe what is shown, any labels or callouts
 Include all text, numbers, and measurements visible."
```

4. The vision description becomes a searchable chunk — so when someone asks "What does the org chart look like?" or "Show me the pricing table", the system finds the vision description and answers accurately.

**Example:**
```
Page 12 of "Employee Handbook.pdf"
  ├── Text extraction: "Figure 3: Company Organization Chart" (7 words)
  ├── Vision extraction: "Organization chart showing CEO at top, with three 
  │   VP branches: VP Engineering (Sarah Kim, 45 reports), VP Sales 
  │   (Mike Johnson, 32 reports), VP Operations (Lisa Park, 28 reports).
  │   Engineering subdivides into Frontend, Backend, DevOps, QA teams..."
  └── This vision description is now searchable!
```

### Step 4: Smart Chunking

Raw text and vision descriptions are split into overlapping chunks optimized for retrieval.

```
Chunking Strategy:
  ├── Text chunks: 800 tokens each, 150 token overlap
  ├── Vision descriptions: stored as-is (usually 200-500 tokens)
  ├── Each chunk gets metadata:
  │   ├── document_id, file_name
  │   ├── page_number
  │   ├── chunk_type: "text" | "image_description" | "table"
  │   ├── has_diagram: boolean
  │   └── section_heading (if detectable)
  └── Overlap ensures no information falls between chunk boundaries
```

**Why 800 tokens?** It's the sweet spot — large enough to contain complete thoughts/paragraphs, small enough for precise retrieval. The 150-token overlap means if a concept spans two chunks, both chunks contain the full context.

### Step 5: Embedding

Each chunk is converted to a vector (a list of numbers that represents its meaning) using OpenAI's `text-embedding-3-small` model.

```
"The return policy allows 30-day returns for unused items..."
  ↓
text-embedding-3-small
  ↓
[0.023, -0.156, 0.891, ...] (1536 dimensions)
```

These vectors are stored in **Qdrant** (vector database) alongside the original text and metadata. This is what makes semantic search possible — the system finds chunks by *meaning*, not just keywords.

---

## Layer 2: Knowledge Store — The Memory

### Vector Database (Qdrant)

Qdrant stores every chunk as a point in 1536-dimensional space. Similar concepts cluster together:

```
Vector Space (simplified to 2D):

  "return policy"  ●  ● "refund process"
                    ● "exchange rules"
  
  
  "shipping rates" ●  ● "delivery times"
                    ● "tracking orders"
  
  
  "pricing plans"  ●  ● "subscription tiers"
                    ● "billing cycle"
```

When a user asks a question, the question is also embedded into a vector, and Qdrant finds the nearest chunks — the ones most semantically similar to the question.

### Metadata Database (PostgreSQL)

Stores everything that isn't vectors:
- User accounts, organizations
- Bot configurations
- Document records (file name, status, page count)
- Chat sessions and message history
- Analytics data

### File Storage

Original PDFs are stored in local filesystem (dev) or S3 (production) for reference and re-processing.

---

## Layer 3: Answer Engine — How Questions Get Answered

This is the core intelligence. When a user asks a question, here's exactly what happens:

### Step 1: Query Planning

The user's question is analyzed and optimized for retrieval.

```
User: "What's the return policy for electronics?"
  ↓
Query Planner:
  ├── Extract key terms: ["return policy", "electronics"]
  ├── Detect intent: factual lookup
  ├── Generate search query: "return policy electronics items"
  ├── Decide: search docs first, web search if low confidence
  └── Output: optimized search query + strategy
```

**Query reformulation** is critical. Users ask messy questions. The planner cleans them up:
- "how do i return stuff" → "return policy process steps"
- "what's the thing with the warranty" → "warranty terms conditions coverage"
- "bob said something about PTO" → "PTO policy paid time off"

### Step 2: Vector Search (Primary Retrieval)

The optimized query is embedded and searched against the vector database.

```
Search query → embed → find top 8 nearest chunks
  ↓
Results (ranked by similarity score 0.0 - 1.0):
  1. [0.92] "Return Policy" section, page 14 (text chunk)
  2. [0.88] "Electronics Returns" section, page 15 (text chunk)
  3. [0.85] "Return process flowchart" page 16 (image description)
  4. [0.71] "Warranty vs Returns" section, page 18 (text chunk)
  5. [0.65] "Refund timeline table" page 17 (table extraction)
  ... (up to 8 chunks)
```

### Step 3: Confidence Check + Web Search (Conditional)

If the best vector search score is below 0.4, the system knows the docs don't have a great answer. This triggers **AI-powered web search**.

```
Confidence Check:
  ├── Best score >= 0.4 → Docs have the answer, skip web search
  ├── Best score < 0.4 → Docs are weak, trigger web search
  ├── Query contains "latest", "current", "news" → Always web search
  └── User explicitly asks for broader context → Web search
```

**Web Search Integration (via OAuth):**

This is where the ChatGPT OAuth connection becomes powerful. When a user connects their OpenAI account:

1. DocuBot uses their OAuth token to access OpenAI's API
2. For web search, we use **Tavily API** (purpose-built for AI search)
3. Web results are clearly labeled separately from document results

```
Web Search Flow:
  Query: "latest electronics return policy regulations 2026"
  ↓
  Tavily API → top 3 results with clean text snippets
  ↓
  Results:
    1. [Web] "FTC Updates Consumer Return Rights" - ftc.gov
    2. [Web] "2026 E-Commerce Return Policy Best Practices" - shopify.com
    3. [Web] "State-by-State Return Policy Laws" - nolo.com
```

### Step 4: Context Assembly

All retrieved information is assembled into a structured context for the LLM.

```
Context Builder assembles:
  ├── DOCUMENT SOURCES (from vector search):
  │   ├── [Doc: Return-Policy.pdf, Page 14] "Our return policy allows..."
  │   ├── [Doc: Return-Policy.pdf, Page 15] "For electronics specifically..."
  │   ├── [Diagram: Return-Policy.pdf, Page 16] "Flowchart showing: 
  │   │    Customer initiates return → Check 30-day window → ..."
  │   └── [Table: Return-Policy.pdf, Page 17] "Refund timeline:
  │        Credit card: 5-7 days, Store credit: instant..."
  │
  └── WEB SOURCES (if triggered):
      ├── [Web: ftc.gov] "The FTC requires..."
      └── [Web: shopify.com] "Best practices include..."
```

### Step 5: LLM Answer Generation

The assembled context + the user's question are sent to GPT-4o with a carefully crafted system prompt.

**The Expert System Prompt:**

```
You are DocuBot, an expert AI assistant for {business_name}. You have access 
to the company's official documentation and, when needed, web search results.

RULES:
1. Answer the question directly and completely on the FIRST response
2. ALWAYS cite your sources using [Document Name, Page X] or [Web: source]
3. Prioritize information from official documentation over web results
4. If the docs contain a relevant diagram or table, reference it
5. For step-by-step processes, format as numbered lists
6. For specifications/data, use tables or bullet points
7. If you're not confident in the answer, say so honestly
8. If the question is outside the scope of available docs, say so
9. Keep answers concise but complete — aim for "one-shot" resolution
10. For safety-critical or legal information, add appropriate disclaimers

TONE: Professional, helpful, direct. Like a knowledgeable colleague.
```

### Step 6: Citation Generation

The LLM's response is post-processed to extract and format citations.

```
Final Response:
{
  "answer": "Electronics can be returned within 30 days of purchase in 
    original packaging. The process is: 1) Initiate return online or 
    in-store, 2) Get RMA number, 3) Ship item back... [Return-Policy.pdf, 
    Page 14-15]. The return flowchart on page 16 shows the complete 
    process including exception handling for defective items.",
  "citations": [
    { "type": "document", "file": "Return-Policy.pdf", "page": 14 },
    { "type": "document", "file": "Return-Policy.pdf", "page": 15 },
    { "type": "diagram", "file": "Return-Policy.pdf", "page": 16 },
    { "type": "table", "file": "Return-Policy.pdf", "page": 17 }
  ],
  "confidence": "high",
  "sources_used": ["document"],
  "answer_found": true
}
```

---

## AI-Powered Search Engine (OAuth Integration)

### How OAuth Supercharges DocuBot

When a user connects their OpenAI (ChatGPT) account via OAuth, DocuBot gains:

1. **Zero API cost for the platform** — the user's own OpenAI account handles API calls
2. **Access to the user's model tier** — GPT-4o if they have Plus, etc.
3. **Web search capability** — augment document answers with live web data

### The Search Engine Architecture

```
┌─────────────────────────────────────────────────────────┐
│              DOCUBOT SEARCH ENGINE                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐                                       │
│  │ User Query   │                                       │
│  └──────┬───────┘                                       │
│         ↓                                               │
│  ┌──────────────┐     ┌──────────────┐                  │
│  │ Query        │────→│ Intent       │                  │
│  │ Analyzer     │     │ Classifier   │                  │
│  └──────┬───────┘     └──────┬───────┘                  │
│         ↓                    ↓                          │
│  ┌─────────────────────────────────────┐                │
│  │         SEARCH ORCHESTRATOR         │                │
│  │                                     │                │
│  │  ┌─────────┐  ┌─────────┐  ┌─────┐ │                │
│  │  │ Vector  │  │ Web     │  │ Re- │ │                │
│  │  │ Search  │  │ Search  │  │ rank│ │                │
│  │  │ (Docs)  │  │ (Tavily)│  │     │ │                │
│  │  └────┬────┘  └────┬────┘  └──┬──┘ │                │
│  │       ↓            ↓         ↓     │                │
│  │  ┌─────────────────────────────┐   │                │
│  │  │    RESULT FUSION            │   │                │
│  │  │  Merge + Deduplicate +      │   │                │
│  │  │  Score + Rank               │   │                │
│  │  └─────────────┬───────────────┘   │                │
│  └────────────────┼───────────────────┘                │
│                   ↓                                     │
│  ┌──────────────────────────────┐                       │
│  │  ANSWER GENERATOR (GPT-4o)  │                       │
│  │  via User's OAuth Token     │                       │
│  └──────────────┬───────────────┘                       │
│                 ↓                                       │
│  ┌──────────────────────────────┐                       │
│  │  Cited Answer + Sources     │                       │
│  └──────────────────────────────┘                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Search Orchestrator Logic

The orchestrator decides which search sources to use based on the query:

```python
# Pseudocode for search orchestration
def search(query, bot_config, user_token):
    # Always search documents first
    doc_results = vector_search(query, bot_id, top_k=8)
    best_doc_score = max(r.score for r in doc_results) if doc_results else 0
    
    web_results = []
    
    # Decide if web search is needed
    if bot_config.web_search_enabled:
        if best_doc_score < 0.4:  # Docs don't have a good answer
            web_results = web_search(query, max_results=3)
        elif is_time_sensitive(query):  # "latest", "current", "2026"
            web_results = web_search(query, max_results=2)
        elif user_explicitly_asked_for_web(query):  # "search the web for..."
            web_results = web_search(query, max_results=3)
    
    # Fuse results
    context = build_context(doc_results, web_results)
    
    # Generate answer using user's OAuth token (or their API key)
    answer = generate_answer(
        query=query,
        context=context,
        model="gpt-4o",
        api_token=resolve_token(user_token, bot_config)
    )
    
    return answer
```

### Token Resolution (Who Pays for API Calls?)

```
Priority Order:
  1. User's OAuth token (connected ChatGPT account) → User pays
  2. User's manual API key (pasted in settings) → User pays
  3. Platform API key (DocuBot's own key) → Platform pays (free tier only)
```

This is the business model magic: users on paid plans connect their own OpenAI account, so DocuBot has near-zero marginal cost per conversation.

---

## How DocuBot "Trains" and Refines

DocuBot doesn't train in the traditional ML sense — it doesn't fine-tune a model. Instead, it gets smarter through:

### 1. Better Retrieval (Automatic)

Every time a document is uploaded, the ingestion pipeline:
- Extracts text with maximum fidelity
- Identifies and describes visual content
- Creates optimally-sized chunks with overlap
- Generates high-quality embeddings

**The "training" is the ingestion.** Better documents = better answers.

### 2. Feedback Loop (Semi-Automatic)

```
User asks question → Bot answers → User reacts
  ├── 👍 Thumbs up → Log as "good answer" (reinforces retrieval)
  ├── 👎 Thumbs down → Log as "bad answer" (flags for review)
  ├── "Not helpful" → Triggers:
  │   ├── Log the failed query
  │   ├── Suggest: "Would you like me to search the web?"
  │   └── Flag for admin: "Knowledge gap detected"
  └── Escalation → Routes to human support
```

### 3. Analytics-Driven Improvement

The analytics dashboard shows:
- **Top unanswered questions** → Tells the business what docs to add
- **Low-confidence answers** → Shows where docs are weak
- **Most asked topics** → Reveals what customers care about
- **Resolution rate** → Overall bot effectiveness

```
Analytics Insight Example:
  "23% of questions about 'warranty claims' get low-confidence answers.
   Consider uploading your warranty policy document."
```

### 4. Admin Refinement

Bot admins can:
- **Edit the system prompt** → Change the bot's personality and rules
- **Adjust temperature** → More creative (0.7) vs more precise (0.1)
- **Toggle strict mode** → Only answer from docs, never improvise
- **Set fallback messages** → What to say when the bot can't answer
- **Configure web search** → Enable/disable, set confidence threshold

### 5. Document Updates

When a business updates their docs:
1. Upload the new version
2. DocuBot re-ingests automatically
3. Old chunks are replaced with new ones
4. The bot immediately reflects the updated information

No retraining, no waiting, no downtime.

---

## The Complete Flow: End to End

```
SETUP (one-time, 5 minutes):
  1. Business signs up → Creates organization
  2. Creates a bot → "Customer Support Bot"
  3. Uploads PDFs → Employee handbook, return policy, FAQ, product catalog
  4. DocuBot processes everything automatically (2-5 min for ~100 pages)
  5. Bot is ready to answer questions

DAILY USAGE:
  Customer visits website → Chat widget appears
    ↓
  Customer: "Can I return my laptop after 45 days?"
    ↓
  DocuBot Brain:
    1. Query Planner: "return policy laptop 45 days time limit"
    2. Vector Search: Finds return policy chunks (score: 0.91)
    3. Confidence: HIGH → Skip web search
    4. Context: Return policy text + timeline table + process flowchart
    5. LLM generates answer with citations
    ↓
  DocuBot: "Our standard return window is 30 days from purchase. 
    Unfortunately, at 45 days your laptop would be outside the return 
    window [Return-Policy.pdf, Page 14]. However, if the laptop is 
    defective, our warranty program covers repairs for up to 1 year 
    [Warranty-Guide.pdf, Page 3]. Would you like information about 
    filing a warranty claim?"
    ↓
  Customer gets their answer on the FIRST try ✅
```

---

## Technical Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js 16 + React 19 + Tailwind 4 | Dashboard & landing page |
| Chat Widget | Vanilla TS, embeddable | Customer-facing chat |
| API | FastAPI (Python) | REST API + WebSocket chat |
| Vector DB | Qdrant | Semantic search |
| Metadata DB | PostgreSQL | Users, bots, docs, analytics |
| Task Queue | Celery + Redis | Async document processing |
| PDF Text | pypdf | Text extraction |
| PDF Vision | pdf2image + GPT-4o Vision | Diagram/image understanding |
| Embeddings | text-embedding-3-small | Vector generation |
| LLM | GPT-4o (via user's OAuth) | Answer generation |
| Web Search | Tavily API | Augmented search |
| Auth | JWT + OpenAI OAuth | User authentication |
| File Storage | Local / S3 | PDF storage |

---

## What Makes DocuBot Different

1. **One-shot answers** — Designed to resolve questions on the first response, not back-and-forth
2. **Vision-aware** — Understands diagrams, tables, and images in your docs
3. **Web-augmented** — Falls back to web search when docs aren't enough
4. **Zero AI cost** — Users bring their own OpenAI account via OAuth
5. **5-minute setup** — Upload docs, get a working chatbot immediately
6. **Embeddable** — Drop a widget on any website with one line of code
7. **Self-improving** — Analytics show knowledge gaps so you know what docs to add

---

## Pricing Model (Updated for DocuBot)

| Plan | Price | Bots | Documents | Chats | AI Provider |
|------|-------|------|-----------|-------|-------------|
| **Starter** | Free | 1 | 5 docs | 50/mo | Platform key (limited) |
| **Pro** | $29/mo | 5 | Unlimited | Unlimited* | User's OpenAI account |
| **Business** | $79/mo | 25 | Unlimited | Unlimited* | User's OpenAI account |
| **Enterprise** | Custom | Unlimited | Unlimited | Unlimited* | User's OpenAI account |

*Unlimited chats because the user pays their own OpenAI API costs. DocuBot only charges for the platform.

**Key insight**: By having users connect their own OpenAI account, DocuBot's marginal cost per chat is essentially $0. The pricing is for the platform, not the AI.
