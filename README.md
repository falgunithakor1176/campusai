<div align="center">

# 🎓 CampusAI

### *AI-Powered Intelligent College Management Assistant*

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![LangChain](https://img.shields.io/badge/LangChain.js-RAG-1C3C3C?style=for-the-badge&logo=chainlink&logoColor=white)](https://js.langchain.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

> **Enterprise-grade AI college assistant** — students, faculty & admins get instant, accurate answers from structured DB data, uploaded PDFs, and Google Gemini. Built for final year projects, hackathons, and placement interviews.

[🚀 Quick Start](#-quick-start) · [📖 API Docs](#-api-documentation) · [🗄️ Database Schema](#️-database-schema) · [🤖 AI Architecture](#-ai-architecture) · [🐳 Docker Deploy](#-docker-deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Database Schema](#️-database-schema)
- [AI Architecture](#-ai-architecture)
- [API Documentation](#-api-documentation)
- [Demo Credentials](#-demo-credentials)
- [Docker Deployment](#-docker-deployment)
- [Scripts Reference](#-scripts-reference)
- [Contributing](#-contributing)

---

## 🌟 Overview

CampusAI is a **production-ready, multi-tenant AI platform** for colleges. It answers natural-language questions using a **three-tier decision engine**:

```
Query → Intent Classifier → Priority Router
                                ├── P1: PostgreSQL (structured data — fees, faculty, courses …)
                                ├── P2: pgvector RAG (uploaded PDFs via semantic search)
                                └── P3: Gemini AI (general reasoning + honest disclaimer)
```

The AI **never fabricates** official college information. When data is unavailable it says so clearly, citing which tier was consulted.

### Who is it for?

| Persona | What they get |
|---------|--------------|
| 🎓 **Students** | Chat-based Q&A, fee lookup, exam timetables, scholarships, notices |
| 👩‍🏫 **Faculty** | Directory listing, department info, placement stats |
| 🛡️ **Admins** | Full CRUD dashboard, PDF knowledge-base, analytics, user management |

---

## ✨ Features

### 🤖 AI Chat System
- **Streaming responses** via Server-Sent Events (SSE)
- Intent classification across 13 query categories (fees, exams, hostel, admission…)
- Source attribution in every response (DB / PDF / Gemini)
- Persistent chat sessions with full message history
- Guest daily query limit with graceful upsell to register

### 📄 PDF Knowledge Base (RAG)
- Upload → auto-extract text → chunk → embed → store in pgvector
- HNSW semantic search with 768-dimension vectors (`gemini-embedding-001`)
- Admin-controlled document visibility (Public / Students / Faculty / Private)
- Document versioning and audit log

### 🏛️ College Data APIs
- Departments, Faculty Directory, Courses & Subjects
- Fee Structures (year-wise breakdown)
- Notices & Events with audience targeting
- Scholarships, Placement Stats, Exam Timetables
- Attendance Policies, Library, Hostel, Labs, Clubs, Facilities

### 🔐 Security
- JWT access + refresh token rotation (15 min / 7 day)
- Role-based access control: `SUPER_ADMIN → ADMIN → FACULTY → STUDENT`
- Zod schema validation on every request body
- Helmet.js security headers
- Per-endpoint rate limiting (general: 100/15 min, AI: 20/15 min)
- OWASP Top-10 compliant

### 📊 Analytics Dashboard
- Query volume trends by day/week
- Source distribution (DB vs PDF vs Gemini)
- Top questions and unanswered query tracking
- Active users and session metrics

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + Vite | 18 / 5 |
| **State** | Zustand | 5 |
| **Routing** | React Router | v6 |
| **Styling** | Tailwind CSS | 3 |
| **Animations** | Framer Motion | 12 |
| **Charts** | Recharts | 2 |
| **HTTP Client** | Axios | 1 |
| **Backend** | Node.js + Express | 18+ / 4 |
| **ORM** | Prisma | 6 |
| **Database** | PostgreSQL + pgvector | 16 |
| **AI** | Google Gemini API | 2.0-flash |
| **Embeddings** | gemini-embedding-001 | 768-dim |
| **RAG** | LangChain.js | 0.3 |
| **Auth** | JWT + bcryptjs | — |
| **Validation** | Zod | 3 |
| **Logging** | Winston | 3 |
| **API Docs** | Swagger / OpenAPI | 3.0 |
| **Containerization** | Docker Compose | 3.9 |

---

## 📁 Project Structure

```
campusai/
├── client/                         # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/               # ChatInput, ChatMessageBubble, ChatSidebar
│   │   │   ├── documents/          # DocumentUploadModal, DocumentDetailModal
│   │   │   ├── layouts/            # Role-aware layout wrappers
│   │   │   └── ui/                 # Badge, Button, Card, Modal, Spinner, Toast
│   │   ├── pages/
│   │   │   ├── admin/              # DocumentManagementPage
│   │   │   ├── chat/               # ChatPage
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── routes/                 # AppRouter, ProtectedRoute
│   │   ├── services/               # api.js (Axios instance + all API calls)
│   │   └── store/                  # authStore, chatStore, documentStore, uiStore
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                         # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js         # Prisma client singleton
│   │   │   ├── gemini.js           # Google Generative AI setup
│   │   │   ├── logger.js           # Winston logger config
│   │   │   ├── storage.js          # File storage provider
│   │   │   └── swagger.js          # OpenAPI spec setup
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── chat.controller.js  # SSE streaming handler
│   │   │   ├── document.controller.js
│   │   │   ├── health.controller.js
│   │   │   └── retrieval.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT verification
│   │   │   ├── role.middleware.js   # RBAC enforcement
│   │   │   ├── rateLimit.middleware.js
│   │   │   ├── upload.middleware.js # Multer PDF config
│   │   │   ├── validate.middleware.js
│   │   │   └── errorHandler.middleware.js
│   │   ├── repositories/           # Data access layer (Prisma)
│   │   │   ├── base.repository.js
│   │   │   ├── chat.repository.js
│   │   │   ├── college.repository.js
│   │   │   ├── course.repository.js
│   │   │   ├── department.repository.js
│   │   │   ├── document.repository.js
│   │   │   ├── erp.repository.js
│   │   │   ├── faculty.repository.js
│   │   │   └── user.repository.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── chat.routes.js
│   │   │   ├── document.routes.js
│   │   │   ├── health.routes.js
│   │   │   ├── retrieval.routes.js
│   │   │   └── index.js
│   │   ├── schemas/                # Zod validation schemas
│   │   │   ├── auth.schema.js
│   │   │   ├── chat.schema.js
│   │   │   ├── college.schema.js
│   │   │   └── document.schema.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── chat.service.js           # Core AI orchestration
│   │   │   ├── chunking.service.js       # PDF → text chunks
│   │   │   ├── college.service.js
│   │   │   ├── document.service.js
│   │   │   ├── documentProcessing.service.js  # Upload pipeline
│   │   │   ├── embedding.service.js      # Batch embedding via Gemini
│   │   │   ├── erp.service.js
│   │   │   └── retrieval.service.js      # pgvector semantic search
│   │   └── utils/
│   │       ├── apiResponse.js            # Standardised JSON responses
│   │       ├── asyncHandler.js
│   │       ├── intentClassifier.js       # 13-category query tagger
│   │       └── tokenizer.js
│   ├── prisma/
│   │   ├── schema.prisma               # Full DB schema (27 models)
│   │   └── seed.js                     # Realistic demo data generator
│   ├── scripts/                        # Dev/debug utilities
│   ├── uploads/documents/              # Uploaded PDFs (gitignored)
│   ├── storage/documents/              # Processed file storage
│   ├── server.js                       # Entry point
│   └── package.json
│
├── scripts/
│   └── init-db.sql                     # pgvector extension setup
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | LTS recommended |
| npm | 9+ | Comes with Node |
| PostgreSQL | 16+ | With **pgvector** extension |
| Google Gemini API Key | — | [Get free key](https://aistudio.google.com/) |

> **Alternative**: Use Docker Compose to spin up PostgreSQL + pgvector automatically — see [Docker Deployment](#-docker-deployment).

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/falgunithakor1176/campusai.git
cd campusai
```

---

### Step 2 — Configure environment variables

**Server:**
```bash
cp server/.env.example server/.env
```
Edit `server/.env` and fill in your values (see [Environment Variables](#-environment-variables)).

**Client** (optional for local dev — defaults work out of the box):
```bash
cp client/.env.example client/.env
```

---

### Step 3 — Start PostgreSQL with pgvector

**Option A – Docker (recommended):**
```bash
docker-compose up -d postgres
# Waits for health check; pgvector extension is auto-enabled via init-db.sql
```

**Option B – Local PostgreSQL:**
```sql
-- Connect as superuser and run:
CREATE DATABASE campusai_db;
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### Step 4 — Set up the backend

```bash
cd server
npm install

# Generate Prisma client
npx prisma generate

# Apply schema to the database (first time)
npx prisma db push

# Seed with realistic demo data
#   ↳ 1 college · 8 departments · 60+ faculty · 80 courses
#   ↳ 1000 students · notices · scholarships · placement stats …
npm run prisma:seed
```

---

### Step 5 — Start the backend

```bash
# Development (with hot-reload via nodemon)
npm run dev

# Production
npm start
```

Server starts at **http://localhost:5000**  
Swagger API docs at **http://localhost:5000/api/docs**

---

### Step 6 — Set up and start the frontend

```bash
cd ../client
npm install
npm run dev
```

Frontend starts at **http://localhost:3000**

---

## ⚙️ Environment Variables

### `server/.env`

```env
# ── Server ──────────────────────────────────────────────────────
NODE_ENV=development
PORT=5000

# ── Database ─────────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/campusai_db

# ── JWT (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))") ──
JWT_ACCESS_SECRET=<256-bit-random-string>
JWT_REFRESH_SECRET=<different-256-bit-random-string>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# ── Google Gemini ─────────────────────────────────────────────────
GEMINI_API_KEY=<your-api-key>
GEMINI_MODEL=gemini-2.0-flash
GEMINI_EMBEDDING_MODEL=models/gemini-embedding-001
EMBEDDING_BATCH_SIZE=10

# ── CORS ──────────────────────────────────────────────────────────
CORS_ORIGIN=http://localhost:3000

# ── File Upload ───────────────────────────────────────────────────
MAX_FILE_SIZE_MB=10
UPLOAD_PATH=./uploads/documents
STORAGE_PROVIDER=local

# ── Rate Limiting ─────────────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000       # 15 min
RATE_LIMIT_MAX_REQUESTS=100
AI_RATE_LIMIT_MAX=20
GUEST_DAILY_QUERY_LIMIT=5

# ── Logging ───────────────────────────────────────────────────────
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

### `client/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=CampusAI
```

---

## 🗄️ Database Schema

The schema contains **27 Prisma models** with full relational integrity, pgvector support, and multi-tenant `college_id` scoping.

### Entity Groups

```
┌─────────────────────────────────────────────────────────────────┐
│  CORE                                                           │
│  College ─┬─ User (Student / Faculty / Admin / SuperAdmin)      │
│            ├─ RefreshToken                                       │
│            └─ Department ─┬─ Faculty                            │
│                            ├─ Course / Subject                   │
│                            ├─ FeeStructure                       │
│                            ├─ PlacementStat / PlacementRecord    │
│                            ├─ ExamTimetable                      │
│                            ├─ AttendancePolicy                   │
│                            └─ Laboratory                         │
│                                                                 │
│  CAMPUS LIFE                                                     │
│  College ─┬─ Notice · Event · Scholarship                       │
│            ├─ LibraryInfo · HostelInfo                           │
│            ├─ AcademicCalendar                                   │
│            ├─ Facility · Club · CampusRule                       │
│            └─ Faq                                                │
│                                                                 │
│  AI / DOCUMENTS                                                  │
│  Document ─┬─ DocumentChunk (pgvector 768-dim)                  │
│             ├─ DocumentVersion                                   │
│             └─ DocumentAuditLog                                  │
│                                                                 │
│  CHAT                                                            │
│  ChatSession ── ChatMessage (with source metadata)              │
│                                                                 │
│  PLACEMENTS                                                      │
│  PlacementCompany ─┬─ PlacementStat                             │
│                     └─ PlacementRecord                           │
└─────────────────────────────────────────────────────────────────┘
```

### Key Tables Summary

| Table | Rows (seeded) | Description |
|-------|:---:|---------|
| `colleges` | 1 | Multi-college SaaS root entity |
| `users` | ~1,060 | All roles; soft-delete + MFA fields |
| `students` | ~1,000 | Roll number, semester, dept link |
| `faculty` | ~60 | Designation, publications, research areas |
| `departments` | 8 | HOD reference, accreditation info |
| `courses` | 80 | Credits, type, prerequisites |
| `subjects` | 120+ | Theory/practical/internal marks, syllabus |
| `fee_structures` | ~32 | Year-wise per-department breakdown |
| `notices` | 40+ | Audience targeting, pinned, view count |
| `events` | 20+ | Registration link, max participants |
| `scholarships` | 15+ | Eligibility, deadline, selection process |
| `placement_stats` | 50+ | Per company, per dept, per year |
| `exam_timetables` | 100+ | Room, invigilator, duration |
| `documents` | — | PDF metadata + status pipeline |
| `document_chunks` | — | 768-dim vectors (HNSW index) |
| `chat_sessions` | — | User sessions with AI |
| `chat_messages` | — | Messages with source attribution |

---

## 🤖 AI Architecture

### Three-Tier Decision Engine

```
User Message
     │
     ▼
┌─────────────────────────────┐
│   Intent Classifier         │  ← 13 categories:
│   (intentClassifier.js)     │    fees · exams · hostel · library
└──────────────┬──────────────┘    placement · faculty · courses …
               │
               ▼
┌─────────────────────────────┐
│  Priority 1: Structured DB  │  ← Prisma query on exact match
│  (college.service.js)       │    High confidence, no hallucination
└──────────────┬──────────────┘
               │ if data found → return with [DB] source tag
               │ if no match ↓
               ▼
┌─────────────────────────────┐
│  Priority 2: RAG / pgvector │  ← embed query → cosine similarity
│  (retrieval.service.js)     │    top-k chunks from document_chunks
└──────────────┬──────────────┘
               │ if chunks found → inject as context into Gemini
               │ if no chunks ↓
               ▼
┌─────────────────────────────┐
│  Priority 3: Gemini AI      │  ← general reasoning
│  (chat.service.js)          │    always adds disclaimer that
└──────────────┬──────────────┘    data is not officially verified
               │
               ▼
          SSE Stream → Client
```

### Embedding Pipeline (PDF Upload)

```
PDF File Upload
      │
      ▼
 pdf-parse (text extraction)
      │
      ▼
 chunking.service.js
 (fixed-size + overlap chunking)
      │
      ▼
 embedding.service.js
 (batch of 10 via gemini-embedding-001)
      │
      ▼
 document_chunks table
 (pgvector HNSW index, 768-dim)
      │
      ▼
 Document status → READY
```

---

## 📖 API Documentation

Interactive Swagger UI: **[http://localhost:5000/api/docs](http://localhost:5000/api/docs)**

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/api/auth/register` | — | Register new user |
| `POST` | `/api/auth/login` | — | Login → access + refresh token |
| `POST` | `/api/auth/refresh` | Cookie | Rotate refresh token |
| `POST` | `/api/auth/logout` | JWT | Revoke refresh token |
| `GET` | `/api/auth/me` | JWT | Get current user profile |

### College Data

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/api/departments` | — | All departments |
| `GET` | `/api/departments/:id` | — | Department detail |
| `GET` | `/api/faculty` | — | Faculty directory (paginated) |
| `GET` | `/api/faculty/:id` | — | Faculty detail |
| `GET` | `/api/courses` | — | Course catalog |
| `GET` | `/api/fees` | — | Fee structures |
| `GET` | `/api/notices` | — | Published notices |
| `GET` | `/api/events` | — | Upcoming events |
| `GET` | `/api/scholarships` | — | Active scholarships |
| `GET` | `/api/placement-stats` | — | Placement statistics |
| `GET` | `/api/exam-timetables` | JWT | Exam schedule |

### AI Chat

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/api/chat/sessions` | JWT/Guest | Create new chat session |
| `GET` | `/api/chat/sessions` | JWT | List user's sessions |
| `GET` | `/api/chat/sessions/:id` | JWT | Session with messages |
| `POST` | `/api/chat/sessions/:id/message` | JWT/Guest | Send message → **SSE stream** |
| `DELETE` | `/api/chat/sessions/:id` | JWT | Delete session |

### Documents (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/api/documents/upload` | Admin | Upload PDF → auto-process |
| `GET` | `/api/documents` | Admin | List all documents |
| `GET` | `/api/documents/:id` | Admin | Document detail + chunks |
| `PATCH` | `/api/documents/:id` | Admin | Update metadata |
| `DELETE` | `/api/documents/:id` | Admin | Delete + remove embeddings |

### Retrieval (Debug / Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/api/retrieval/search` | Admin | Raw vector similarity search |
| `GET` | `/api/retrieval/stats` | Admin | Embedding stats |

### System

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/api/health` | — | Service health check |

---

## 🔑 Demo Credentials

After running `npm run prisma:seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@campusai.edu` | `Admin@123` |
| Student | `student1@campusai.edu` | `Student@123` |
| Faculty | *(seeded faculty email)* | `Faculty@123` |

---

## 🐳 Docker Deployment

### Full Stack with Docker Compose

```bash
# 1. Copy and edit the root .env
cp .env.example .env
# Fill in JWT secrets and GEMINI_API_KEY

# 2. Start all services
docker-compose up -d

# 3. Run migrations + seed inside container
docker-compose exec server npx prisma db push
docker-compose exec server node prisma/seed.js
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| API Docs | http://localhost:5000/api/docs |
| PostgreSQL | localhost:5432 |

### Services in docker-compose.yml

| Container | Image / Build | Port |
|-----------|--------------|------|
| `campusai_postgres` | `pgvector/pgvector:pg16` | 5432 |
| `campusai_server` | `./server/Dockerfile` | 5000 |
| `campusai_client` | `./client/Dockerfile` (Nginx) | 3000→80 |

---

## 📜 Scripts Reference

### Server (`cd server`)

```bash
npm run dev              # Start with nodemon (hot-reload)
npm start                # Production start
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Run migrations (dev)
npm run prisma:seed      # Seed demo data
npm run prisma:studio    # Open Prisma Studio GUI
npm run prisma:reset     # ⚠️  Reset DB + re-seed (destructive)
```

### Utility Scripts (`server/scripts/`)

| Script | Purpose |
|--------|---------|
| `testGemini.js` | Test Gemini API key and model connectivity |
| `testRetrieval.js` | Run a test vector similarity search |
| `testChatApi.js` | End-to-end chat session test |
| `importAndProcess.js` | Bulk import + embed PDF files |
| `verifySubmissionReady.js` | Pre-submission health check |
| `checkStatus.js` | DB + embedding status report |
| `generateDemoPdfs.js` | Generate sample PDF documents |

---

## 🤝 Contributing

Pull requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/your-feature`
3. Commit with conventional commits: `git commit -m "feat: add xyz"`
4. Push and open a PR

Please open an issue first for major changes.

---

## 📄 License

[MIT](LICENSE) — Free to use for education, portfolios, and interviews.

---

<div align="center">

Built with ❤️ for placement interviews, hackathons & final year projects

**⭐ Star the repo if it helped you!**

</div>
