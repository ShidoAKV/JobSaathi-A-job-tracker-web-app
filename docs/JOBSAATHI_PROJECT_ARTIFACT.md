# JobSaathi — Complete Project Artifact

> **JobSaathi** | MERN, Socket.IO, GeminiAPI, JWT, Node-Cron, NodeCache, Rate limiter, Tailwind CSS
> GitHub: https://github.com/ShidoAKV/Updated_jobsarthi_project-  ·  Live: https://jobsaathi-web.onrender.com  ·  API: https://jobsaathi-api.onrender.com
>
> • Built a full-stack job tracker with a drag-and-drop Kanban board and an analytics dashboard to manage applications across hiring stages.
> • Implemented secure JWT auth with 3 role-based dashboards for candidates, recruiters and admins, with employer approval by admin.
> • Integrated real-time chat via Socket.IO, an AI career chatbot, and a Gemini-powered Resume Analyzer that scores resumes against job descriptions.
> • Automated job alerts via Node-Cron with Nodemailer, added API rate limiting and NodeCache, and deployed frontend and backend independently on Render.

---

## Table of contents

1. [Project in a nutshell](#1-project-in-a-nutshell)
2. [Full functionality list](#2-full-functionality-list)
3. [Technology inventory: what, where, why, trade-offs](#3-technology-inventory)
4. [Architecture](#4-architecture)
5. [End-to-end flows (click by click)](#5-end-to-end-flows)
6. [Scaling the application](#6-scaling-the-application)
7. [Interview questions with answers (30 per technology)](#7-interview-questions-with-answers)

---

## 1. Project in a nutshell

JobSaathi ("saathi" = companion) is a job-search companion web app. A **candidate** tracks every application on a Kanban board (Applied → Interview → Offer → Rejected), sees analytics about their search, browses job listings posted by verified **employers**, chats with those employers in real time, gets in-app and email alerts for new jobs, asks an AI career assistant about their stats or any company, and runs their PDF resume through a Gemini-powered analyzer that scores it against a job description, proofreads every bullet with an **evidence label** (supported / needs confirmation / unsupported), keeps versions and exports a new PDF. An **admin** approves employer requests, manages users and moderates listings.

**Stack in one line:** React 19 + Vite + Tailwind CSS 4 SPA  →  Express 5 REST API + Socket.IO on Node 22  →  MongoDB Atlas via Mongoose 9, with Google Gemini for AI, node-cron for scheduled alerts, Nodemailer for email, express-rate-limit for abuse protection and node-cache for in-memory caching. Frontend and backend are deployed as two independent Render services.

**Why it is interesting technically:** three roles with an approval workflow, a dual-channel real-time layer (Socket.IO with REST + polling fallback), an AI layer that degrades gracefully to deterministic answers when Gemini is unavailable, content-hash based de-duplication of expensive AI calls, and a scheduled fan-out job that writes notifications, pushes them over sockets and emails users.

---

## 2. Full functionality list

### 2.1 Authentication & accounts
| Feature | Details |
|---|---|
| Sign up | Name, email, password; choose **Job seeker** or **Employer** (employer must give a company name and starts as `candidate` with `recruiterRequest = pending`). |
| Login | Email + password → bcrypt compare → JWT (7-day expiry) + public user object stored in `localStorage`. |
| Auto-admin | Emails listed in `ADMIN_EMAILS` are promoted to `admin` on signup/login. |
| Session handling | Axios interceptor attaches `Authorization: Bearer <jwt>`; any 401 clears the session and redirects to `/login`. |
| Protected / public-only / role routes | `ProtectedRoute`, `PublicOnlyRoute`, `RoleRoute` wrappers in React Router. |
| Profile | Edit name, email, phone, LinkedIn, GitHub, profile image; employers can edit company. |
| Change password | Verifies current password, re-hashes new one. |
| Request employer access | Job seekers submit a company name → request goes `pending` → admin approves/rejects → user receives a **system notification** over socket and their cached role updates without re-login. |
| Logout | Clears storage, dispatches an auth event, disconnects the socket. |
| Brute-force protection | `authLimiter`: 10 failed login/signup attempts per 15 min per IP. |

### 2.2 Application tracker (My Applications)
| Feature | Details |
|---|---|
| Kanban board | Four columns: Applied, Interview, Offer, Rejected (`@hello-pangea/dnd`). |
| Add / edit / delete application | Company, role, location, salary, link, applied date, status, notes, interview date. |
| Drag & drop status change | Dropping a card into another column calls `PUT /api/jobs/:id`; dropping into **Interview** without an interview date opens the edit modal first. |
| Search + status filter | Client-side filter on company / role / location and status. |
| Ownership | Every query is scoped by `user: req.user.id`, so users only ever see their own jobs. |

### 2.3 Dashboard & analytics
| Feature | Details |
|---|---|
| Stat cards | Total, Applied, Interview, Offer, Rejected counts. |
| Recent applications | Last 5 created. |
| Activity timeline | Last 5 updated. |
| Upcoming interviews | Next 5 `Interview` jobs with a future `interviewDate`. |
| Monthly applications chart | Recharts bar/area chart of applications per month. |
| Status distribution chart | Recharts pie/donut of status counts. |
| Caching | `GET /api/analytics` is cached per user with node-cache and invalidated on every job create/update/delete. |

### 2.4 Job listings (Explore Jobs)
| Feature | Details |
|---|---|
| Browse listings | All listings, newest first, with poster populated. Search by role / company / skills / location; filter by type; "only mine" for employers. |
| Post a job (recruiter/admin only) | Company, role, location, salary, type, description, skills, apply link, company email. `authorize("recruiter","admin")` + `writeLimiter`. |
| Delete listing | Owner or admin. |
| Highlight from notification | `/jobs?highlight=<listingId>` scrolls to and highlights the card. |
| Message company | "Message" button starts (or reuses) a conversation between the viewer and the poster for that listing and navigates to `/messages?c=<id>`. |
| Caching | `GET /api/listings` cached by query string; invalidated on create/delete. |

### 2.5 Real-time messaging
| Feature | Details |
|---|---|
| Conversations | Exactly two participants per listing; list sorted by last message, with per-conversation unread counts. |
| Live chat | Socket.IO rooms per conversation; `message:send`, `message:new`, `typing`, `messages:read`, `conversation:updated` events. |
| Fallback | If the socket is down, messages go through REST (`POST /api/conversations/:id/messages`) and the thread polls every 15 s for new messages. |
| Read receipts | Opening a thread marks messages read (REST and socket), emits `messages:read` to the room. |
| Unread badge | Sidebar shows total unread across conversations (socket-driven, polled every 60 s as backup). |
| Abuse protection | Per-socket token buckets: 20 messages / 10 s, 10 typing pings / 5 s; REST writes limited by `writeLimiter`. |

### 2.6 Notifications & job alerts
| Feature | Details |
|---|---|
| Cron fan-out | `node-cron` runs every 2 min (configurable): finds listings with `notified=false`, creates one `Notification` per user (except the poster), emits `notification:new` to each user's socket room, sends an HTML email via Nodemailer (if SMTP configured), marks listing notified. |
| Bell panel | Dropdown with unread count, mark one / mark all read, click → jump to listing or to Settings for system notices. |
| Live toast | Socket push shows a toast immediately; polling every 60 s as backup. |
| Manual trigger | `POST /api/notifications/run` runs the job on demand (testing). |

### 2.7 AI career chatbot (floating widget)
| Feature | Details |
|---|---|
| Intent detection | Regex classifier: `stats`, `top_jobs`, `company`, `general`. |
| Grounded answers | For stats/top jobs the model receives JSON pulled from MongoDB and is told never to invent platform data. |
| Company research | Gemini general knowledge + "On JobSaathi" section built only from DB listings. |
| Conversation memory | Last 8 messages sent as history for general questions. |
| Graceful degradation | If Gemini is missing / quota-exceeded / down, deterministic Markdown fallbacks are returned with a one-line note. |
| Caching | Top-jobs answer cached 120 s per day-key; company profile cached 6 h keyed by listing ids. |
| Rate limit | `aiLimiter`: 30 AI calls / 15 min per user. |

### 2.8 Resume AI (Resume Analyzer, proofreader & evidence checker)
| Feature | Details |
|---|---|
| Upload | PDF ≤ 5 MB (Multer memory storage) + job description. Text extracted with `pdf-parse` and wrapped lines repaired. |
| Match analysis | Gemini returns JSON: `matchScore` 0–100, summary, matched skills, missing keywords, strengths, targeted improvements. Result coerced/validated and cached 1 h by SHA-1 of (text + JD). |
| Draft persistence | Each upload creates a `ResumeDraft` with original text, current text, analysis, versions (max 20, "Original" always kept). |
| Live editor | Edit the resume text line by line in the browser. |
| Proofread + evidence checker | Gemini rewrites weak bullets, each with `flags` (vague, missing_metric, weak_verb…) and an `evidence.status` of supported / needs_confirmation / unsupported; `[ADD: …]` placeholders for missing metrics; list of unsupported JD claims; a learning roadmap. |
| Apply suggestions | Accept / reject individual bullets, fill placeholders, apply all. |
| Re-analyze | Re-score the edited text; skipped (served from the draft) when the text hash hasn't changed. |
| Versions | Save named versions with their score; compare/restore. |
| Export | Download as TXT, Markdown or an ATS-friendly single-column PDF (jsPDF). |

### 2.9 Admin console
| Feature | Details |
|---|---|
| Stats | Users by role, pending requests, listings, conversations, messages (cached 30 s). |
| Employer requests | Approve / reject pending requests → role update + system notification over socket. |
| Users | Search, filter by role/request state, change role, delete user (cascades listings, conversations, messages, notifications, jobs). |
| Listings | View all, delete any listing (cascades its conversations/messages/notifications). |

### 2.10 Cross-cutting
| Feature | Details |
|---|---|
| Dark / light theme | `ThemeProvider` toggles a class on `<html>`, persisted in localStorage. |
| Toasts | `react-hot-toast` for success/error, including a dedicated 429 "slow down" toast. |
| Health endpoint | `GET /api/health` returns uptime + cache stats (skipped by rate limiter). |
| CORS allow-list | Only `CLIENT_URL`s + localhost:5173 for both HTTP and Socket.IO. |
| SPA deep links on static hosting | Build copies `index.html` to `404.html` so `/dashboard` refreshes load the app on Render static hosting. |
| Seed script | `npm run seed` creates demo recruiters + 16 listings. |

---

## 3. Technology inventory

### 3.1 Where each technology is used

| Technology | Version | Layer | Where in the code | What it does here |
|---|---|---|---|---|
| **MongoDB (Atlas)** | 7.x cloud | Database | `backend/config/db.js`, all `backend/models/*` | Stores users, jobs, listings, conversations, messages, notifications, resume drafts. |
| **Mongoose** | 9 | ODM | `backend/models/*`, controllers/services | Schemas, enums, indexes, `populate`, instance methods (`toPublic`, `addVersion`). |
| **Express** | 5 | HTTP server | `backend/server.js`, `routes/*`, `middleware/*`, `controllers/*` | REST API under `/api/*`, middleware chain (CORS → JSON → rate limit → routes → 404 → error handler). |
| **Node.js** | 22 | Runtime | whole backend | Async I/O, `http.createServer` shared by Express and Socket.IO, `crypto` for SHA-1 hashes. |
| **React** | 19 | UI | `frontend/src/*` | Component tree, hooks (`useAuthUser`, `useAnalytics`, `useNotifications`, `useUnreadMessages`, `useProfileSync`), context for theme. |
| **Vite** | 7 | Build/dev | `frontend/vite.config.js`, `package.json` | Dev server with HMR, production bundle, `VITE_API_URL` env injection. |
| **React Router** | 7 | Routing | `App.jsx`, `components/ProtectedRoute.jsx`, `layouts/DashboardLayout.jsx` | Nested routes, route guards, `useSearchParams` for `?c=` and `?highlight=`. |
| **Tailwind CSS** | 4 | Styling | `index.css`, every component | Utility classes, design tokens via CSS variables, dark/light themes. |
| **Axios** | 1 | HTTP client | `services/api.js` + `services/*Service.js` | Base URL, auth header interceptor, 401/429 handling. |
| **Socket.IO** (server + client) | 4.8 | Real-time | `backend/services/socketService.js`, `frontend/src/services/socket.js`, `ChatThread.jsx`, hooks | JWT-authenticated websockets, rooms per user and per conversation, chat, typing, read receipts, notification push. |
| **JSON Web Token (jsonwebtoken)** | 9 | Auth | `controllers/authController.js`, `middleware/authMiddleware.js`, `socketService.js` | Signs `{ id }` for 7 days; verified on every REST request and socket handshake. |
| **bcryptjs** | 3 | Security | `authController.js`, `userController.js` | Password hashing (cost 10) and comparison. |
| **Google Gemini API (@google/genai)** | 2.16, model `gemini-3.5-flash` | AI | `services/geminiService.js`, `chatbotService.js`, `resumeService.js` | Text generation (chatbot) and JSON-mode generation (resume match, proofread). |
| **node-cron** | 4 | Scheduler | `jobs/notificationCron.js` | Runs `notifyNewListings` on a cron expression (default `*/2 * * * *`). |
| **Nodemailer** | 10 | Email | `services/emailService.js` | SMTP transport, HTML new-job email template. |
| **express-rate-limit** | 8 | Abuse control | `middleware/rateLimiter.js` | Global, auth, AI and write limiters + custom socket token bucket. |
| **node-cache** | 5 | Caching | `services/cacheService.js`, `middleware/cacheMiddleware.js` | In-process TTL cache for listings, analytics, admin stats, chatbot answers, resume analyses. |
| **Multer** | 2 | Uploads | `routes/resumeRoutes.js` | Memory-storage PDF upload with 5 MB limit. |
| **pdf-parse** | 2 | Parsing | `services/resumeService.js` | Extracts text from the uploaded PDF. |
| **CORS** | 2 | Security | `server.js`, `config/env.js` | Origin allow-list for HTTP and sockets. |
| **dotenv** | 17 | Config | `config/env.js` | Loads `.env`, parses lists and numbers, prints a startup summary. |
| **@hello-pangea/dnd** | 18 | UI | `components/myjobs/JobBoard.jsx` | Drag-and-drop Kanban columns. |
| **Recharts** | 3 | Charts | `components/analytics/*` | Monthly applications and status distribution charts. |
| **jsPDF** | 4 | Export | `utils/exportResume.js` | Generates the ATS-friendly PDF client-side. |
| **react-markdown** | 10 | Rendering | `components/chatbot/ChatMessage.jsx` | Renders Gemini's Markdown replies. |
| **react-hot-toast** | 2 | UX | `main.jsx`, everywhere | Notifications/toasts. |
| **lucide-react**, **lottie-react**, **date-fns** | — | UI helpers | icons, bot animation, relative dates. |
| **Render** | — | Hosting | `render.yaml` | Web service (API) + static site (frontend), independent deploys. |

### 3.2 Why each main technology was needed, with trade-offs

#### MongoDB + Mongoose
- **Need:** flexible documents (resume analyses are free-form JSON, versions are embedded arrays), fast iteration, Atlas free tier.
- **Pros:** schema-light for AI outputs (`Schema.Types.Mixed`), embedded `versions[]` keeps a draft self-contained, easy horizontal scaling later, JSON all the way through the stack.
- **Cons:** no multi-document joins (we use `populate` and extra queries, e.g. unread counts per conversation = N queries), weak enforcement of relational integrity (cascade deletes are hand-written in `adminController`), regex search is not indexed (fine for small data, needs Atlas Search at scale).
- **Trade-off taken:** simplicity and speed of development over strict relational guarantees.

#### Express 5
- **Need:** a minimal, well-known HTTP framework for a REST API.
- **Pros:** tiny core, huge middleware ecosystem (cors, rate-limit, multer), Express 5 forwards rejected promises to the error handler automatically.
- **Cons:** no built-in validation, structure or DI; everything (RBAC, caching, error shapes) is hand-rolled.
- **Trade-off:** chose Express over NestJS/Fastify for familiarity and lowest ceremony.

#### Node.js
- **Need:** one language across the stack, event-loop concurrency suits an I/O-bound app (DB + external AI + websockets).
- **Pros:** Socket.IO and Express share one `http.Server`; npm ecosystem; easy to host on Render.
- **Cons:** single thread — CPU-heavy work (PDF parsing of large files) blocks the loop; in-process state (cache, cron, rate-limit counters) doesn't survive multiple instances.
- **Trade-off:** accepted single-instance assumptions for a free-tier deploy, documented the Redis swap for later.

#### React 19 + Vite
- **Need:** a rich, stateful SPA (board, editor with diffs, chat, charts).
- **Pros:** component model and hooks; Vite gives instant HMR and small bundles; React Router 7 nested layouts.
- **Cons:** SPA deep links need host-side rewrite (solved with `404.html`); SEO irrelevant here but would need SSR otherwise; client-side auth state in `localStorage`.
- **Trade-off:** chose a pure SPA + static hosting over Next.js SSR because the whole app sits behind login.

#### Tailwind CSS 4
- **Need:** fast, consistent styling with dark/light theme.
- **Pros:** utilities co-located with markup, design tokens through CSS variables, tiny production CSS, no naming bikeshedding.
- **Cons:** long class strings, learning curve, harder to share styles without component abstraction (solved with `card`, `btn-primary`, `input` utility classes).

#### Socket.IO
- **Need:** real-time chat, typing indicators, read receipts and instant notification push.
- **Pros:** automatic reconnection, fallback to long polling, rooms/namespaces, acknowledgements, works behind Render's proxy.
- **Cons:** heavier than raw WebSocket; sticky sessions / Redis adapter required for multiple instances; per-socket rate limiting must be custom (no `req` object).
- **Trade-off:** reliability features outweigh the extra payload; a REST + polling fallback is kept so chat still works if websockets are blocked.

#### JWT (jsonwebtoken) + bcryptjs
- **Need:** stateless auth usable by both HTTP and websocket handshakes.
- **Pros:** no session store; same token works for `Authorization: Bearer` and `socket.handshake.auth.token`; horizontal scaling friendly.
- **Cons:** cannot revoke before expiry (7 days); stored in `localStorage` → XSS exposure (mitigated by no `dangerouslySetInnerHTML` and Markdown sanitisation); a DB lookup per request keeps the role fresh at the cost of one query.
- **Trade-off:** chose 7-day access tokens without refresh tokens for simplicity.

#### Google Gemini API
- **Need:** natural-language chatbot, resume scoring and bullet rewriting with structured output.
- **Pros:** JSON response mode (`responseMimeType: application/json`), system instructions, generous free tier, fast `flash` model.
- **Cons:** free-tier quota/503 "high demand" errors, latency of seconds, non-deterministic output (hence coercion/validation), vendor lock-in, data leaves the server.
- **Trade-off:** every Gemini call has a deterministic fallback or a cached result, and expensive outputs are keyed by content hash.

#### node-cron
- **Need:** periodic job to announce new listings without an external scheduler.
- **Pros:** zero infrastructure, cron syntax, in-process so it can emit over Socket.IO directly.
- **Cons:** runs on every instance (duplicate fan-out if scaled out), pauses while a free Render instance sleeps, no persistence/retry history.
- **Trade-off:** acceptable for a single instance; a `notified` flag on the listing makes the job idempotent.

#### node-cache
- **Need:** cut repeated DB queries and, more importantly, repeated Gemini calls.
- **Pros:** microsecond reads, TTL per key, `useClones:false` to avoid copying big objects, no extra service.
- **Cons:** per-process memory (not shared across instances), lost on restart, unbounded growth if keys are unbounded (mitigated by TTLs and prefix invalidation).
- **Trade-off:** Redis would be the drop-in replacement when running more than one instance.

#### express-rate-limit
- **Need:** protect login from brute force, the Gemini quota from exhaustion and the DB from write floods.
- **Pros:** declarative, per-route, standard `RateLimit-*` headers, custom key generators (user id vs IP).
- **Cons:** memory store is per instance; needs `trust proxy` configured correctly behind Render; too-strict limits hurt legitimate users (fixed by `skipSuccessfulRequests` on auth).
- **Trade-off:** four tiers (global 300/15 min, auth 10 fails, AI 30/user, writes 30/min) rather than a single blunt limit.

#### Nodemailer
- **Need:** email alerts for new jobs.
- **Pros:** any SMTP provider, HTML + text bodies.
- **Cons:** SMTP credentials to manage, sending is slow and can fail per recipient (handled with `Promise.allSettled`), no bounce handling.
- **Trade-off:** SMTP is optional; the system logs "SMTP not configured, skipping email" and still delivers in-app notifications.

---

## 4. Architecture

### 4.1 High-level diagram

```
                ┌────────────────────────────────────────────────────────────────┐
                │                      Browser (React 19 SPA)                     │
                │  React Router ─ pages ─ components ─ hooks ─ Tailwind CSS       │
                │  services/api.js (Axios + JWT interceptor)                      │
                │  services/socket.js (socket.io-client, auth: { token })         │
                └───────────────┬───────────────────────────────┬────────────────┘
                 HTTPS REST     │                               │  WebSocket / polling
                 /api/*         │                               │  (same origin as API)
                                ▼                               ▼
   ┌──────────────────────────────────────────────────────────────────────────────┐
   │              Render Web Service  —  Node 22  —  one http.Server              │
   │                                                                              │
   │   Express 5                                   Socket.IO 4                    │
   │   ├─ cors (allow-list)                        ├─ io.use(JWT verify)          │
   │   ├─ express.json (1 MB)                      ├─ rooms: user:<id>            │
   │   ├─ apiLimiter (300/15min)                   │          conversation:<id>   │
   │   ├─ /api/auth        (authLimiter)           ├─ events: message:send/new,   │
   │   ├─ /api/jobs        (protect)               │   typing, messages:read,     │
   │   ├─ /api/analytics   (protect + cache)       │   conversation:updated,      │
   │   ├─ /api/listings    (protect + cache/RBAC)  │   notification:new           │
   │   ├─ /api/conversations (protect+writeLimit)  └─ per-socket token buckets    │
   │   ├─ /api/notifications                                                      │
   │   ├─ /api/chatbot     (protect + aiLimiter)   node-cron (NOTIFY_CRON)        │
   │   ├─ /api/resume      (protect + aiLimiter + multer)  └─ notifyNewListings   │
   │   ├─ /api/admin       (protect + authorize("admin"))                         │
   │   ├─ notFound → errorHandler                                                 │
   │                                                                              │
   │   services: geminiService · chatbotService · resumeService · messageService  │
   │             notificationService · emailService · socketService · cacheService│
   │   node-cache (in-process TTL cache)                                          │
   └────────┬───────────────────────┬──────────────────────────┬──────────────────┘
            │ Mongoose              │ @google/genai             │ Nodemailer (SMTP)
            ▼                       ▼                           ▼
   MongoDB Atlas (jobsaathi)   Google Gemini (gemini-3.5-flash)   SMTP provider
   users · jobs · joblistings
   conversations · messages
   notifications · resumedrafts

   Render Static Site: frontend/dist (index.html + 404.html copy for SPA deep links)
```

### 4.2 Request lifecycle (REST)

1. Browser calls `api.get("/jobs")`. The Axios request interceptor reads the JWT from `localStorage` and adds `Authorization: Bearer …`.
2. Express receives it: `cors` checks the `Origin` against the allow-list → `express.json` parses the body → `app.set("trust proxy", 1)` lets the limiter see the real client IP behind Render.
3. `apiLimiter` counts the request (per IP, 300 per 15 min; `/api/health` skipped).
4. Router-level middleware: `protect` verifies the JWT, loads the user from MongoDB (minus password) into `req.user`; optionally `authorize(...)` checks the role; optionally a route limiter (`authLimiter`, `aiLimiter`, `writeLimiter`); optionally `cacheResponse(keyFn, ttl)` returns a cached JSON body with `X-Cache: HIT`.
5. Controller runs (wrapped in `asyncHandler`), talks to Mongoose/services, calls cache invalidators after writes, responds with JSON.
6. Unknown paths hit `notFound`; thrown errors hit `errorHandler`, which maps `CastError`/`ValidationError` → 400, Gemini-not-configured → 503, otherwise `err.statusCode || 500`.
7. Axios response interceptor: 429 → toast with retry time; 401 (while a token existed) → clear session and redirect to `/login`.

### 4.3 Socket lifecycle

1. After login, any hook calling `getSocket()` creates a single shared `socket.io-client` connection to the API origin with `auth: { token }` and both transports (websocket first, polling fallback).
2. Server `io.use` middleware verifies the JWT and attaches `socket.user`; unauthenticated sockets are rejected with `Unauthorized`.
3. On `connection` the socket joins `user:<id>` (for notifications and conversation list updates). Opening a chat thread emits `conversation:join` which is validated against the participants list before joining `conversation:<id>`.
4. Messages sent over the socket run the same `createMessage` service as the REST route, then `broadcastMessage` emits `message:new` to the room and `conversation:updated` to both participants' user rooms.
5. On logout `clearSession` dispatches `jobsaathi:auth`; the socket module listens and disconnects.

### 4.4 Folder structure

```
backend/
  server.js               app bootstrap: middleware, routes, DB, cron, socket
  config/env.js, db.js    env parsing + startup summary, Mongo connection
  routes/                 one router per domain (auth, jobs, analytics, user, resume,
                          listings, notifications, conversations, chatbot, admin)
  controllers/            request handlers
  services/               gemini, chatbot, resume, message, notification, email, socket, cache
  middleware/             auth (JWT), role (RBAC), rateLimiter, cacheMiddleware, errorMiddleware
  models/                 User, Job, JobListing, Conversation, Message, Notification, ResumeDraft
  jobs/notificationCron.js
  seed/seed.js
frontend/src/
  main.jsx, App.jsx       providers, router
  pages/                  Login, Signup, Dashboard, MyJobs, ExploreJobs, Messages, Analytics,
                          Resume, Settings, Admin, NotFound
  layouts/DashboardLayout.jsx   sidebar + navbar + outlet + chatbot widget
  components/             admin, analytics, auth, chatbot, dashboard, listings, messages,
                          myjobs, notifications, resume, settings, ui
  hooks/                  useAuthUser, useAnalytics, useNotifications, useUnreadMessages, useProfileSync
  services/               api.js (Axios), socket.js, one service file per API domain
  utils/                  auth, diff, evidence, exportResume, resumeInsights
  providers/ThemeProvider.jsx
render.yaml               blueprint: jobsaathi-api (node web) + jobsaathi-web (static)
```

### 4.5 Data model

| Collection | Key fields | Indexes / rules |
|---|---|---|
| `users` | name, email (unique, lowercase), password (bcrypt), role ∈ {candidate, recruiter, admin}, recruiterRequest ∈ {none, pending, approved, rejected}, company, phone, linkedin, github, profileImage | unique email; `toPublic()` strips password |
| `jobs` (applications) | company, role, location, salary, jobLink, appliedDate, status ∈ {Applied, Interview, Offer, Rejected}, notes, interviewDate, user → User | all queries scoped by user |
| `joblistings` | company, role, location, salary, type ∈ {Full-time, Part-time, Internship, Contract, Remote}, description, skills[], applyLink, companyEmail, postedBy → User, notified | `{createdAt:-1}`, `{notified:1, createdAt:1}` |
| `conversations` | listing → JobListing, participants[2] → User, lastMessage, lastMessageAt | `{participants:1, lastMessageAt:-1}`; validator enforces exactly 2 participants |
| `messages` | conversation, sender, text (≤2000), readBy[] | `{conversation:1, createdAt:1}` |
| `notifications` | user, type ∈ {new_job, system}, title, message, listing, read | `{user:1, read:1, createdAt:-1}` |
| `resumedrafts` | user, title, jobDescription, originalText, currentText, analysis (Mixed), originalAnalysis, analysisTextHash, proofread (Mixed), proofreadTextHash, versions[{label,text,matchScore,createdAt}] (max 20) | `{user:1, updatedAt:-1}` |

### 4.6 API surface

| Method & path | Guard | Purpose |
|---|---|---|
| `POST /api/auth/signup` | authLimiter | Create account (candidate or pending employer) |
| `POST /api/auth/login` | authLimiter | Returns JWT + user |
| `GET/POST /api/jobs`, `PUT/DELETE /api/jobs/:id` | protect | Application CRUD (own only) |
| `GET /api/analytics` | protect + cache(user) | Dashboard/analytics aggregate |
| `GET/PUT /api/user/profile`, `PUT /api/user/password`, `POST /api/user/request-recruiter` | protect | Profile, password, employer request |
| `GET /api/listings` (+search/location/type), `GET /mine`, `GET /:id` | protect (+cache) | Browse listings |
| `POST /api/listings` | protect + authorize(recruiter, admin) + writeLimiter | Post a job |
| `DELETE /api/listings/:id` | protect (owner or admin) | Remove a listing |
| `GET /api/notifications`, `PUT /read-all`, `PUT /:id/read`, `POST /run` | protect | Alerts |
| `GET/POST /api/conversations`, `GET/POST /:id/messages` | protect (+writeLimiter) | Chat (REST path) |
| `POST /api/chatbot/ask`, `GET /status` | protect + aiLimiter | AI assistant |
| `POST /api/resume/analyze` (multipart) | protect + aiLimiter + multer | Upload + match |
| `GET/PUT/DELETE /api/resume/drafts[/ :id]`, `POST /:id/analyze`, `POST /:id/proofread` | protect (+aiLimiter/writeLimiter) | Draft lifecycle |
| `GET /api/admin/stats` (cache 30 s), `GET /users`, `PUT /users/:id/role`, `PUT /users/:id/recruiter-request`, `DELETE /users/:id`, `GET /listings`, `DELETE /listings/:id` | protect + authorize(admin) | Admin |
| `GET /api/health` | none (limiter skipped) | Uptime + cache stats |

### 4.7 Deployment topology (Render)

- **jobsaathi-api** — Node web service, root `backend`, `npm install` / `npm start`, health check `/api/health`. Env: `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `CLIENT_URL`, `APP_URL`, `ADMIN_EMAILS`, `NOTIFY_CRON`, optional SMTP and limit/cache tunables.
- **jobsaathi-web** — static site, root `frontend`, `npm install && npm run build`, publish `dist`. Env: `VITE_API_URL=https://jobsaathi-api.onrender.com/api` baked into the bundle at build time. `404.html` = copy of `index.html` so deep links render the SPA.
- The two services are independent: either can be redeployed or scaled on its own; they communicate only over HTTPS/WSS with CORS enforced by the API.

---

## 5. End-to-end flows

Each flow is written from the first click to the last state change, naming the exact files, routes, middleware and events involved.

### Flow 1 — Sign up (job seeker or employer)

1. User opens `https://jobsaathi-web.onrender.com/`. `PublicOnlyRoute` sees no token and `/` redirects to `/login`; they click **Create account** → `/signup` (`pages/Signup.jsx`).
2. They fill name, email, password and pick an **account type** card: *Job seeker* or *Employer*. Choosing Employer reveals a required **Company** input.
3. Clicking **Sign up** runs client validation (employer must have a company), then `authService.signupUser(form)` → `POST /api/auth/signup`.
4. Server: `authLimiter` (only failed attempts count) → `authController.signup`: validates required fields, rejects duplicate email, hashes password with bcrypt (cost 10), creates the `User` with `role: candidate` and `recruiterRequest: pending` if employer (plus `company`), else `none`.
5. `ensureAdminRole` promotes the user to `admin` if their email is in `ADMIN_EMAILS`.
6. Response 201 with a message ("Employer access is pending admin approval" for employers). The page toasts it and navigates to `/login`.

### Flow 2 — Login and session bootstrap

1. On `/login` the user enters email/password and clicks **Sign in** → `POST /api/auth/login`.
2. Server: `authLimiter` → `login`: finds the user by email (404 if missing), `bcrypt.compare` (400 on mismatch), `ensureAdminRole`, then `jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" })`.
3. Response `{ token, user }`. `storeSession` writes both to `localStorage` and dispatches a `jobsaathi:auth` window event so `useAuthUser` re-renders everywhere.
4. `navigate(location.state?.from || "/dashboard")` — if the user was bounced from a deep link, they go back there.
5. `ProtectedRoute` now passes; `DashboardLayout` mounts: `Sidebar`, `Navbar`, the routed page and the floating `ChatbotWidget`.
6. `useProfileSync` immediately calls `GET /api/user/profile` to refresh role/request status in storage; `useNotifications` calls `GET /api/notifications`; `useUnreadMessages` calls `GET /api/conversations`. Each also calls `getSocket()`, which opens the single Socket.IO connection with the JWT in `handshake.auth`.
7. Server socket middleware verifies the JWT, loads the user and joins the socket to room `user:<id>`.

### Flow 3 — Session expiry / logout

- **Expiry:** any REST call returning 401 while a token exists triggers the Axios interceptor: it clears storage and `window.location.assign("/login")`.
- **Logout:** clicking **Log out** in the sidebar/navbar calls `clearSession()` → storage cleared, `jobsaathi:auth` dispatched → `socket.js` listener sees no token and disconnects the socket → `ProtectedRoute` redirects to `/login`.

### Flow 4 — Dashboard & analytics

1. `/dashboard` mounts `Dashboard.jsx`, which calls `useAnalytics()` → `GET /api/analytics`.
2. Server: `protect` → `cacheResponse(KEYS.analytics(userId))`: on HIT returns the cached body with `X-Cache: HIT`; on MISS `analyticsController.getAnalytics` loads all of the user's jobs once and computes status counts, monthly series, recent 5 applications, recent 5 activities and next 5 interviews, then the middleware stores the JSON for `CACHE_TTL_SECONDS` (60 s).
3. The hook feeds `StatCards`, `RecentApplications`, `ActivityTimeline`, `UpcomingInterviews`, `QuickActions`. `/analytics` reuses the same hook for Recharts `ApplicationsChart` and `StatusChart`.
4. Any job create/update/delete calls `invalidateAnalytics(userId)` so the next load recomputes.

### Flow 5 — Track an application on the Kanban board

1. Sidebar → **My Applications** (`/my-jobs`). `MyJobs.jsx` calls `GET /api/jobs` (own jobs, newest first) and renders `JobBoard` with four `JobColumn`s.
2. **Add:** click **Add application** → `AddJobModal` opens; fill company, role, location, salary, link, applied date, status, notes, interview date → **Save** → `POST /api/jobs` → `createJob` validates company/role, creates the `Job` with `user: req.user.id`, invalidates analytics → modal closes, board refetches, toast.
3. **Drag and drop:** `DragDropContext.onDragEnd` gets `destination.droppableId` (new status). If it equals the current status nothing happens. If the target is **Interview** and the job has no `interviewDate`, the edit modal opens pre-filled with `status: Interview` so the user must enter a date first. Otherwise `PUT /api/jobs/:id` with the new status → `updateJob` (`findOneAndUpdate` scoped by user, `runValidators`) → refetch → toast "Moved to Offer".
4. **Edit / delete:** card menu → edit opens the same modal with the job; delete calls `DELETE /api/jobs/:id` → `findOneAndDelete` scoped by user.
5. **Search / filter:** typed text and status select filter the already-loaded list client-side; a single status filter collapses the board to one column.

### Flow 6 — Explore listings and post a job

1. Sidebar → **Explore Jobs** (`/jobs`). `ExploreJobs.jsx` calls `GET /api/listings` (cached by query string). Cards show company, role, type, location, salary, skills, poster, posted time.
2. Search box / type select / "only mine" checkbox filter client-side.
3. **Post a job** button is visible only when `canPostJobs(user)` (recruiter or admin). Candidates instead see a hint that routes to **Settings** to request employer access.
4. Clicking it opens `PostJobModal`; submit → `POST /api/listings` → `protect` → `authorize("recruiter","admin")` → `writeLimiter` (30/min per user) → `createListing`: company defaults to the recruiter's profile company, skills string normalised to an array, `companyEmail` defaults to recruiter email, `notified: false`. `invalidateListings()` clears listing, chatbot and admin-stats caches. The card appears at the top.
5. Within ≤ 2 minutes the notification cron picks the listing up (Flow 8).
6. **Delete:** owner or admin → `DELETE /api/listings/:id` → cache invalidated.
7. Arriving via a notification (`/jobs?highlight=<id>`) scrolls to the card and highlights it.

### Flow 7 — Message a company (real-time chat)

1. On a listing card the candidate clicks **Message**. `startConversation(listing._id)` → `POST /api/conversations { listingId }` → `writeLimiter` → `startConversation`: rejects messaging your own listing, looks for an existing conversation `{ listing, participants: $all [me, poster], $size 2 }`, creates one if absent, returns it populated.
2. Frontend navigates to `/messages?c=<conversationId>`. `Messages.jsx` loads `GET /api/conversations` (each with `otherUser`, `lastMessage`, `unreadCount`) and renders `ConversationList` + `ChatThread` for the active id.
3. `ChatThread` mount: `GET /api/conversations/:id/messages` loads history and marks unread messages as read server-side. Then `socket.emit("conversation:join", id, ack)`; the server checks participation and joins room `conversation:<id>`. It also emits `messages:read` so the other party's UI updates.
4. **Typing:** on keystroke the client emits `typing { isTyping: true }` once, then `false` after idle; the server relays to the room (rate-limited 10 per 5 s per socket).
5. **Send:** pressing Enter/Send → if the socket is connected, `socket.emit("message:send", { conversationId, text }, ack)`. Server bucket allows 20 per 10 s → `messageService.createMessage` validates (non-empty, ≤ 2000 chars, participant), inserts the `Message` with `readBy: [sender]`, updates `lastMessage`/`lastMessageAt` → `broadcastMessage` emits `message:new` to the room and `conversation:updated` to both `user:<id>` rooms. The ack returns the saved message to the sender.
6. If the socket is **not** connected, the client falls back to `POST /api/conversations/:id/messages`, and the thread polls `GET …/messages?after=<lastSeen>` every 15 s.
7. The recipient's `ChatThread` appends the message from `message:new`; their `Messages` list reloads on `conversation:updated`; their `Sidebar` unread badge recomputes from `useUnreadMessages`.

### Flow 8 — New-job alerts (cron + socket + email)

1. `startNotificationCron()` runs at server boot: validates `NOTIFY_CRON` (default every 2 min), schedules `runSafely`, and runs it once immediately. A module-level `isRunning` flag prevents overlapping runs.
2. `notifyNewListings()` fetches listings with `notified: false` (oldest first). For each: loads all users except the poster; `insertMany` one `Notification` per user; emits `notification:new` to each `user:<id>` room with the listing summary; sends the HTML email via `sendMail` to every user with `Promise.allSettled` (skipped if SMTP is off); marks the listing `notified = true`.
3. Client side, `useNotifications` receives `notification:new`, prepends it, bumps the unread count and shows a toast ("💼 New job: …"). As a backup it polls `GET /api/notifications` every 60 s.
4. User clicks the **bell** → `NotificationPanel` lists alerts; clicking one calls `PUT /api/notifications/:id/read` optimistically and navigates to `/jobs?highlight=<listing>` (or `/settings` for system notices). **Mark all read** → `PUT /api/notifications/read-all`.

### Flow 9 — Request employer access and admin approval

1. Candidate → **Settings** → `AccountTypeCard` → enters company → **Send request** → `POST /api/user/request-recruiter` → `recruiterRequest = pending`, company saved; the card switches to "awaiting admin approval".
2. Admin logs in (email in `ADMIN_EMAILS`); the sidebar shows **Admin** (guarded by `RoleRoute roles=[admin]`). `/admin` loads `GET /api/admin/stats` (cached 30 s) and the **Employer requests** tab (`GET /api/admin/users?request=pending`).
3. Admin clicks **Approve** → `PUT /api/admin/users/:id/recruiter-request { action: "approve" }` → `authorize("admin")` → user becomes `recruiter` / `approved`, admin stats cache invalidated, a `system` Notification is created and `emitToUser(userId, "notification:new", …)`.
4. On the candidate's open tab, `useNotifications` shows the toast and `useProfileSync` (listening for `type === "system"`) re-fetches the profile and updates the stored role. The **Post a job** button appears without re-login.
5. Reject sets `recruiterRequest = rejected` and the Settings card shows the decline with the option to re-apply.

### Flow 10 — AI career chatbot

1. Any dashboard page shows the floating bot button (`ChatbotWidget` in `DashboardLayout`). Clicking it opens the panel, shows a greeting and quick prompts ("my stats", "top jobs today", "tell me about Google"). `GET /api/chatbot/status` reports whether AI is configured.
2. User types and hits Send → `POST /api/chatbot/ask { message, history }` (last 8 turns) → `protect` → `aiLimiter` (30 per 15 min per user).
3. `chatbotService.answer` detects intent with regexes:
   - **stats** → loads the user's jobs, computes counts/response rate/upcoming interviews + platform totals → prompt Gemini with that JSON; fallback is a deterministic Markdown summary.
   - **top_jobs** → today's listings (padded with latest) → cache key per day; Gemini formats a numbered list; cached 120 s on success; fallback lists them directly.
   - **company** → regex extracts the company name → DB listings for that company → Gemini writes a profile from general knowledge + an "On JobSaathi" section limited to the JSON; cached 6 h keyed by listing ids.
   - **general** → Gemini with the user's stats line + history; fallback explains the three supported intents.
4. `withGemini` wraps every call: if the key is missing, or the call throws (quota, 503), it returns the fallback with a short italic note. `geminiService` logs each distinct error once and never prints the key.
5. The widget appends the reply (rendered with `react-markdown`) with a typing Lottie animation while waiting.

### Flow 11 — Resume AI: upload → match → edit/proofread → versions/export

1. Sidebar → **Resume AI** (`/resume`). Step **Upload** (`UploadPanel`): choose a PDF (client checks type and 5 MB), paste the job description, click **Analyze match**. Saved drafts are listed on the right and can be reopened or deleted.
2. `analyzeResume(file, jd, title)` sends `multipart/form-data` → `POST /api/resume/analyze` → `protect` → `aiLimiter` → `multer.single("resume")` (memory, 5 MB) → `resumeController.analyzeResume`: validates JD and mimetype, `extractPdfText` (pdf-parse + line-repair heuristics), then `analyzeMatch(text, jd)`.
3. `analyzeMatch` builds key `resume:analysis:<sha1(text+jd)>` and uses `cacheService.wrap` → on miss, `generateJson` calls Gemini in JSON mode with a strict system prompt ("do not invent skills"), `extractJson` strips code fences, `coerceAnalysis` clamps the score 0–100 and normalises arrays.
4. A `ResumeDraft` is created with original/current text, analysis, hash and version "Original". Response includes `draftId`, text and analysis. UI moves to step **Match** (`MatchReport`): `ScoreRing`, summary, matched skills, missing keywords, strengths, improvement cards.
5. **Continue** → step **Editor** (`ResumeEditor` + `EvidenceSidebar`). User edits text directly. Clicking **Proofread with evidence checker** → `POST /api/resume/drafts/:id/proofread { text }` → `runOnDraft`: updates `currentText` if changed, computes the hash, and if `proofreadTextHash` matches it returns the stored result with `cached: true` (no Gemini call). Otherwise `resumeService.proofread` numbers the lines, prompts Gemini for bullets with `line`, `original`, `suggested`, `flags`, `evidence {status, note, askFor}`, `unsupportedClaims`, `summary`, `roadmap`; `coerceProofread` drops invalid lines, dedupes, caps at 25 and relabels ids.
6. Each `SuggestionCard` shows original vs suggested with the evidence badge; the user accepts/rejects, fills `[ADD: …]` placeholders (`applyEvidence`), or **Apply all**; the editor text updates. **Re-analyze** → `POST /drafts/:id/analyze` re-scores (same hash short-circuit).
7. **Save version** → `PUT /api/resume/drafts/:id { currentText, saveVersion: true, label }` → `addVersion` keeps at most 20 (never dropping "Original"). Step **Versions** (`VersionsPanel`) lists them with scores and lets the user restore.
8. **Export** → `exportTxt`, `exportMarkdown` or `exportPdf` (jsPDF builds an A4 single-column PDF with headings and bullets) — all client-side, no server call.

### Flow 12 — Admin moderation

- **Users tab:** search/filter → `GET /api/admin/users?search&role&request`; change role → `PUT /users/:id/role` (cannot change own role); delete → `DELETE /users/:id` cascades listings (and their conversations, messages, notifications), the user's conversations/messages, notifications and jobs.
- **Listings tab:** `GET /api/admin/listings`; delete → `DELETE /api/admin/listings/:id` → `purgeListings` removes dependent conversations, messages and notifications, then invalidates caches.

### Flow 13 — What happens when limits are hit

- Exceeding a limiter returns 429 with `Retry-After` and `{ message, retryAfterSeconds }`; the Axios interceptor shows one toast (id `rate-limit`) with the minutes to wait.
- Over-fast socket sends get an ack `{ error: "You are sending messages too quickly…" }` and the thread shows it inline.
- Gemini quota exhaustion never breaks the UI: chatbot answers fall back; resume analysis returns 503 with a human message and the page toasts it.

---

## 6. Scaling the application

Today the app runs as **one** API instance on Render's free tier with in-process cache, cron and rate-limit state. That is correct for a portfolio deploy. Here is the overview of how it grows, in order of what breaks first.

### 6.1 What breaks first and the fix

| Bottleneck | Symptom | Fix |
|---|---|---|
| Free instance sleeps | First request after idle takes ~30 s | Paid instance / keep-alive ping; later autoscaling |
| Single Node process | CPU-bound PDF parsing and Gemini JSON parsing block other requests | Run 2+ instances behind Render's load balancer; move PDF parsing to a worker (BullMQ) |
| In-process `node-cache` | Each instance has its own cache → inconsistent HIT/MISS, invalidation only local | Replace with **Redis** (same get/set/del/prefix API; `ioredis`) |
| In-process rate-limit store | Limits become per-instance (N× looser) | `rate-limit-redis` store so counters are shared |
| Socket.IO rooms per instance | User A on instance 1 can't receive events emitted on instance 2 | **Socket.IO Redis adapter** (`@socket.io/redis-adapter`) + sticky sessions at the load balancer |
| `node-cron` on every instance | Duplicate notifications/emails | Run the job in a single **worker** process, or guard with a Redis lock / Atlas `findOneAndUpdate` claim on `notified` |
| Notification fan-out = users × listings documents | A listing with 100k users creates 100k docs and emails synchronously | Push to a **queue** (BullMQ/SQS); batch `insertMany`; send email in chunks with a provider (SES/SendGrid); consider "notification per listing + read-state per user" model |
| Regex search on listings/users | Collection scans | **Atlas Search** / text indexes; paginate `GET /api/listings` (currently returns all) |
| Unread count = one `countDocuments` per conversation | O(conversations) queries per list load | Maintain `unreadCount` per participant on the conversation document, updated atomically on send/read |
| Analytics computed from all jobs in memory | Grows with user's history | MongoDB aggregation pipeline (`$group`, `$dateToString`) with indexes on `{user, status}` and `{user, createdAt}` |
| Gemini latency and quota | 503/429 under load | Paid tier, request queue with concurrency limit, cache by content hash (already), consider smaller prompts / streaming |
| JWT 7-day tokens cannot be revoked | Compromised token stays valid | Short-lived access token + refresh token in an httpOnly cookie; token blacklist in Redis |
| Static frontend | Rarely a bottleneck | Already CDN-served by Render; add long-cache headers for hashed assets |

### 6.2 Target architecture at ~100k users (overview)

```
Browser ──CDN (static SPA)
   │
   └──> Load balancer (sticky for WS) ──> API instances ×N (Express + Socket.IO)
                                              │        │
                                   Redis (cache, rate limits, socket adapter, locks)
                                              │
                               MongoDB Atlas replica set (M10+) + Atlas Search
                                              │
                      Worker instances (BullMQ): notification fan-out, emails, PDF parse,
                                                 Gemini jobs with concurrency control
```

Principles: keep the API stateless (all shared state in Redis/Mongo), move anything slow or bursty (email, PDF, AI) behind a queue, add observability (structured logs, request ids, Atlas metrics, Sentry), and add pagination to every list endpoint.

### 6.3 Step-by-step scaling plan

1. **Now → 1k users:** paid Render instance, Atlas M0→M2, pagination on listings/users, aggregation for analytics, indexes already in place.
2. **1k → 10k:** add Redis; swap node-cache, rate-limit store and Socket.IO adapter; move cron to a separate worker service; use a transactional email provider.
3. **10k → 100k+:** horizontal API autoscaling behind sticky load balancing; BullMQ workers for fan-out and AI; Atlas Search; refresh tokens; CDN cache rules; load tests (k6) and SLOs.

---

## 7. Interview questions with answers

Thirty questions each for the main technologies on the resume line: **MongoDB, Express, React, Node.js, Socket.IO, Google Gemini API, JWT, Node-Cron, NodeCache, Rate limiter, Tailwind CSS**. Answers are short and tied to how JobSaathi uses the technology where it helps.

### 7.1 MongoDB (and Mongoose)

1. **What is MongoDB?** A document database storing BSON documents in collections, schema-flexible, horizontally scalable via sharding.
2. **Why MongoDB for JobSaathi?** AI outputs (analysis, proofread) are nested, evolving JSON; embedding `versions[]` in a draft maps naturally to documents; Atlas free tier.
3. **What is Mongoose?** An ODM that adds schemas, validation, middleware, population and a query builder on top of the MongoDB driver.
4. **Difference between embedding and referencing?** Embedding stores sub-documents inside the parent (resume `versions`); referencing stores ObjectIds (`Job.user`, `Message.conversation`). Embed for one-to-few data read together; reference for many-to-many or large/independent data.
5. **What is `populate`?** A Mongoose client-side join: `JobListing.find().populate("postedBy", "_id name email")` runs a second query to replace ids with documents.
6. **What is an index and which does the project define?** A B-tree that speeds queries/sorts. Examples: `{participants:1,lastMessageAt:-1}` on conversations, `{conversation:1,createdAt:1}` on messages, `{user:1,read:1,createdAt:-1}` on notifications, unique index on `email`.
7. **How are enums enforced?** Schema `enum` arrays (`status`, `role`, `type`), validated on `save` and on `findOneAndUpdate` when `runValidators: true`.
8. **Why is `email` lowercase + unique?** Lowercase normalisation prevents duplicate accounts differing by case; the unique index enforces one account per email at the DB level.
9. **What is `Schema.Types.Mixed`?** A free-form field with no validation; used for `analysis` and `proofread`. Changes to it require `markModified()` before `save()`.
10. **What is `lean()`?** Returns plain JS objects instead of Mongoose documents; faster and lighter for read-only responses (used in listings/messages/drafts).
11. **How does the project prevent one user reading another's jobs?** Every query includes `user: req.user.id` (`findOneAndUpdate({_id, user})`, `find({user})`), so ownership is enforced at query level.
12. **`findOneAndUpdate` vs `save`?** `findOneAndUpdate` is atomic and one round trip; `save` loads the doc, runs full validation/middleware and writes. The project uses `returnDocument: "after"` to get the updated doc.
13. **What is `$addToSet` and where is it used?** Adds a value to an array only if absent; used to add a reader to `Message.readBy` idempotently.
14. **How do unread counts work?** `countDocuments({conversation, sender:{$ne:me}, readBy:{$ne:me}})` per conversation. At scale you would denormalise an unread counter.
15. **How are cascading deletes handled?** MongoDB has no FK cascades; `adminController.purgeListings` and `deleteUser` delete dependent conversations, messages, notifications and jobs explicitly, in parallel with `Promise.all`.
16. **What is a replica set?** A group of mongod processes with one primary and secondaries for redundancy and failover; Atlas clusters are replica sets by default.
17. **What is sharding?** Partitioning a collection across shards by a shard key for horizontal write/storage scaling.
18. **Explain the aggregation pipeline.** Stages (`$match`, `$group`, `$sort`, `$project`, `$lookup`) that transform documents server-side; the monthly analytics could use `$group` by `$month` instead of JS loops.
19. **Why does regex search not scale?** Un-anchored case-insensitive regex can't use a B-tree index and scans the collection; use text indexes or Atlas Search.
20. **How do you escape user input in a regex?** `escapeRegex` replaces metacharacters so a search term like `c++` or `.*` cannot alter the pattern (also prevents ReDoS-style abuse).
21. **What is `insertMany` with `ordered:false`?** Bulk insert that continues past individual failures; used to create notifications for all users.
22. **What are timestamps in Mongoose?** `{ timestamps: true }` adds `createdAt`/`updatedAt` automatically; the app sorts and shows activity by them.
23. **How would you store the password safely?** Never plaintext: bcrypt hash with salt; `select("-password")` when loading users; `toPublic()` omits it from responses.
24. **What is a transaction in MongoDB?** Multi-document ACID transactions on replica sets via sessions; could wrap `createMessage` + conversation update to be atomic.
25. **How does Mongoose handle connection pooling?** The driver keeps a pool (default 100 in driver 4+/Mongoose 9 uses `maxPoolSize`); one `mongoose.connect` per process is reused by all models.
26. **What is an ObjectId?** A 12-byte id: timestamp + random + counter; roughly time-ordered, generated client-side.
27. **What is a `CastError` and how is it surfaced?** Thrown when a value can't be cast to the schema type (e.g. an invalid ObjectId in `/jobs/:id`); the error handler maps it to HTTP 400.
28. **How would you paginate listings?** `skip/limit` for small sets, or cursor pagination on `{createdAt:-1,_id:-1}` for stability and index use.
29. **What is schema validation at DB level?** JSON Schema validators on the collection; the project relies on Mongoose instead.
30. **How would you back up and monitor Atlas?** Atlas continuous backups/snapshots, alerts on connections/ops, Performance Advisor for missing indexes.

### 7.2 Express

1. **What is Express?** A minimal web framework for Node that provides routing and a middleware pipeline over `http`.
2. **What is middleware?** A function `(req, res, next)` that runs in order; it can modify `req/res`, end the response or call `next()`. The project chains cors → json → rate limit → auth → cache → controller → 404 → error.
3. **What changed in Express 5 that this project relies on?** Rejected promises from async handlers are passed to `next(err)` automatically; path matching uses path-to-regexp v8 (no `*` wildcards).
4. **What is `express.Router()`?** A mini-app for grouping routes; each domain has its own router mounted under `/api/<domain>`.
5. **How does error handling work?** A 4-arity middleware `(err, req, res, next)` registered last; `notFound` creates a 404 error and `errorHandler` formats JSON and maps known error types to status codes.
6. **What is `asyncHandler`?** A wrapper that catches promise rejections and forwards them to `next`; kept for clarity even though Express 5 does this natively.
7. **Why `app.set("trust proxy", 1)`?** Render terminates TLS and forwards via a proxy; trusting one hop lets `req.ip` and `req.protocol` reflect the client, which the rate limiter needs.
8. **How is CORS configured?** `cors({ origin: fn })` checks the `Origin` header against `CLIENT_URL` list + localhost; non-browser requests without Origin are allowed; `credentials: true`.
9. **What does `express.json({ limit: "1mb" })` do?** Parses JSON bodies and rejects bodies over 1 MB (protects memory). File uploads use Multer instead.
10. **How does RBAC work here?** `protect` loads the user; `authorize("recruiter","admin")` checks `req.user.role` and returns 403 otherwise; routers can `router.use(protect, authorize("admin"))` to guard everything.
11. **Route-level vs app-level middleware?** App-level (`app.use`) applies to every request; route-level is passed into `router.get(path, mw1, mw2, handler)`. Limiters and cache are route-level.
12. **How are query params and route params read?** `req.query.search`, `req.params.id`; both are strings and must be validated/escaped.
13. **How does `cacheResponse` intercept the response?** It wraps `res.json` so that successful bodies are stored in node-cache before being sent, and sets an `X-Cache` header.
14. **What is `res.status().json()`?** Sets the status code and sends a JSON body with `Content-Type: application/json`.
15. **Difference between `app.use("/api", limiter)` and `app.use(limiter)`?** The first only runs for paths starting with `/api`, so `/` and static paths are unaffected.
16. **How is a health check exposed?** `GET /api/health` returns status, uptime and cache stats; Render pings it; the limiter skips it.
17. **How would you add request validation?** Zod/Joi schemas as middleware; currently controllers validate manually (required fields, enums).
18. **How does Multer integrate?** `upload.single("resume")` middleware parses multipart, puts the file buffer on `req.file` and text fields on `req.body`.
19. **How do you share one HTTP server between Express and Socket.IO?** `http.createServer(app)` then `new Server(httpServer)`; both listen on the same port.
20. **What is the order problem with 404 handlers?** `notFound` must be registered after all routes or it would shadow them.
21. **How do you handle different error types in one handler?** Inspect `err.name` (`CastError`, `ValidationError`), `err.statusCode`, or messages (Gemini not configured → 503).
22. **What is `req.user` and where does it come from?** A property set by `protect` after verifying the JWT and loading the user; it is not part of Express itself.
23. **How does Express handle async errors in Express 4?** It doesn't; you must wrap handlers (`asyncHandler`) or use `express-async-errors`.
24. **What does `router.use(protect)` on the admin router mean?** Every admin route is authenticated and authorised once, avoiding repetition.
25. **How would you version the API?** Mount routers under `/api/v1` and keep `/api/v2` in parallel.
26. **Why return consistent `{ message }` JSON on errors?** The frontend's `getErrorMessage` reads `error.response.data.message` for toasts uniformly.
27. **How are large responses avoided?** `.select()` limits fields (`USER_FIELDS`), `.limit()` caps lists (notifications 50, users 200, drafts 30).
28. **How do you secure headers in Express?** `helmet` middleware (not yet added); CORS allow-list and JSON size limit are present.
29. **How do you test Express routes?** Supertest against `module.exports = app` without listening on a port, with a test Mongo instance.
30. **Express vs Fastify vs NestJS?** Express: minimal and familiar; Fastify: faster, schema-first; Nest: opinionated DI/architecture. Express chosen for simplicity.

### 7.3 React

1. **What is React?** A library for building UIs from declarative components that re-render when state or props change.
2. **What is JSX?** Syntax sugar for `React.createElement`; compiled by Vite's React plugin.
3. **What are hooks? Which custom hooks exist in JobSaathi?** Functions to use state/lifecycle in function components. Custom: `useAuthUser`, `useAnalytics`, `useNotifications`, `useUnreadMessages`, `useProfileSync`, `useTheme`.
4. **Explain `useState` vs `useRef`.** `useState` triggers re-render on change; `useRef` holds a mutable value without re-render (used for `mounted`, `typingTimer`, `lastSeenRef`).
5. **What does the dependency array in `useEffect` do?** Controls when the effect re-runs; `[]` = on mount only; cleanup returns unsubscribe (socket `off`, `clearInterval`).
6. **How does the app avoid state updates after unmount?** An `active`/`mounted` flag checked in async callbacks before `setState`.
7. **What is React Context and where is it used?** Shared state without prop drilling; `ThemeProvider` exposes `theme`, `toggleTheme` via `useTheme()`.
8. **How is auth state shared without Context?** Stored in `localStorage`; `useAuthUser` subscribes to a custom `jobsaathi:auth` window event and `storage` events to re-render.
9. **What is a protected route?** A wrapper (`ProtectedRoute`) that renders `<Outlet/>` when authenticated and `<Navigate to="/login" state={{from}}/>` otherwise.
10. **What are nested routes / layouts?** React Router 7 `<Route element={<DashboardLayout/>}>` renders shared sidebar/navbar once and swaps the page via `<Outlet/>`.
11. **How is role-based UI done?** `RoleRoute roles={[admin]}` for `/admin`; helpers `canPostJobs`, `isAdmin` hide/show buttons.
12. **What is optimistic UI and where is it used?** Update local state before the server confirms; notifications are marked read locally first and refreshed on failure.
13. **Controlled vs uncontrolled inputs?** Controlled inputs keep value in state (`form.email`); the file input in `UploadPanel` is read from the change event.
14. **How does drag-and-drop work with `@hello-pangea/dnd`?** `DragDropContext.onDragEnd` receives `source`, `destination`, `draggableId`; `Droppable` columns and `Draggable` cards; the handler calls the API and refetches.
15. **What is `useMemo`/`useCallback` for?** Memoising derived values/functions to avoid recomputation and effect re-runs (filtered listings, `load` callbacks, theme context value).
16. **How does `React.StrictMode` affect effects?** In dev it double-invokes effects to surface missing cleanups; sockets must be idempotent (single shared socket).
17. **What is key reconciliation?** `key` lets React match list items between renders; `_id`s are used as keys; `key={location.pathname}` on the page wrapper re-triggers the enter animation.
18. **How are side effects like websockets kept out of components?** A module-level socket singleton in `services/socket.js` with `onSocket(event, handler)` returning an unsubscribe for effects.
19. **How is Markdown rendered safely?** `react-markdown` parses to React elements (no `dangerouslySetInnerHTML`), so Gemini output can't inject scripts.
20. **What is code splitting and would it help here?** `React.lazy` + `Suspense` per route to shrink the initial bundle (Recharts, jsPDF, Lottie are heavy).
21. **How does the app handle loading and empty states?** `loading` flags render `Spinner`; `EmptyState` component for empty lists.
22. **What's the difference between `navigate()` and `<Navigate/>`?** Imperative vs declarative redirects; `replace: true` avoids polluting history.
23. **How do `useSearchParams` get used?** `/messages?c=<id>` selects a conversation and `/jobs?highlight=<id>` highlights a card, keeping state in the URL.
24. **What is prop drilling and how is it reduced?** Passing props through many layers; hooks and context (theme) and co-located state reduce it.
25. **How is a 401 handled globally?** In the Axios interceptor, not in React; it clears storage and reloads to `/login`.
26. **Why Vite over CRA?** Native ESM dev server with instant HMR, esbuild/Rollup builds, env via `import.meta.env`.
27. **What are React 19 features you could use?** `use()`, Actions/`useActionState` for forms, improved `ref` as prop, automatic batching already present.
28. **How are charts implemented?** Recharts components fed by `monthlyApplications` and `statusCount` from the analytics hook, themed via `chartTheme.js`.
29. **How is the resume editor diff computed?** `utils/diff.js` compares original and suggested text to highlight changes in `SuggestionCard`.
30. **How would you test the frontend?** React Testing Library for components/hooks, Playwright for e2e (login → dashboard → board drag).

### 7.4 Node.js

1. **What is Node.js?** A JavaScript runtime on V8 with an event loop and libuv for non-blocking I/O.
2. **Why is Node suitable for JobSaathi?** The workload is I/O-bound (Mongo, Gemini HTTP, websockets); one event loop handles many concurrent connections cheaply.
3. **Explain the event loop.** Phases (timers, pending callbacks, poll, check, close) process callbacks; microtasks (promises) run between phases. Long synchronous work blocks everything.
4. **What blocks the loop in this app?** Large PDF parsing and big `JSON.parse` of Gemini output; mitigations are size limits (5 MB, 1 MB) and, at scale, worker threads/queues.
5. **CommonJS vs ESM?** Backend uses `require`/`module.exports` (CJS); frontend uses ESM (`"type": "module"`). Node supports both.
6. **What is `process.env` and how is it loaded?** Environment variables; `dotenv` loads `.env` in dev; Render injects them in prod. `config/env.js` parses and defaults them.
7. **Why `process.exit(1)` on DB connection failure?** Fail fast so the host restarts the service rather than serving errors without a DB.
8. **What is `http.createServer(app)` for?** To get a raw server that both Express and Socket.IO attach to.
9. **How are secrets kept out of logs?** `geminiService.describeError` replaces the API key with `[redacted]` and logs each distinct error once.
10. **What is `Promise.all` vs `Promise.allSettled`?** `all` rejects on first failure (used for independent DB counts); `allSettled` waits for all (used for emails so one failure doesn't stop others).
11. **What is the `crypto` module used for?** SHA-1 hashing of resume text + JD to make cache/draft keys.
12. **What is `Buffer`?** Binary data container; Multer memory storage gives `req.file.buffer` to pdf-parse.
13. **How do you handle unhandled promise rejections?** Node 15+ crashes on them; Express 5 routes them to the error handler; cron wraps `runSafely` in try/catch.
14. **What is `nodemon`?** Dev tool that restarts the server on file changes (`npm run dev`).
15. **What does `"engines": { "node": ">=20" }` do?** Declares the required Node version; Render reads `NODE_VERSION=22` env too.
16. **How is graceful degradation implemented?** Startup summary prints Gemini/SMTP ON/OFF; services check `isConfigured` and fall back instead of throwing.
17. **Why keep one Mongoose connection per process?** Connection pooling; reconnecting per request would exhaust Atlas connection limits.
18. **How would you run CPU work off the main thread?** `worker_threads`, child processes, or a separate worker service consuming a queue.
19. **What are streams and would they help?** Chunked processing of data; could stream PDF uploads to disk/S3 instead of buffering.
20. **What is the difference between `setImmediate`, `setTimeout(0)`, `process.nextTick`?** nextTick runs before promises/microtasks drain; setImmediate runs in the check phase; setTimeout 0 in timers.
21. **How does Node handle many websocket connections?** Each is a socket on the loop; memory per connection is small; scale out with Redis adapter when one process's CPU/memory is saturated.
22. **What is a memory leak risk here?** Unbounded cache keys (mitigated by TTL), socket listeners not removed (handled in cleanups), `loggedErrors` Set (bounded by distinct messages).
23. **How do you store uploaded files in production?** Not in memory/disk of a dyno; upload to S3/Cloudinary and store the URL; here the PDF is parsed and discarded, only text is stored.
24. **What is `npm start` vs `npm run dev`?** `node server.js` for prod vs `nodemon server.js` for dev.
25. **How do you pick a Node LTS?** Even-numbered releases are LTS (20, 22); the project targets 22.
26. **How does Node's `cluster` module relate to Render scaling?** Cluster forks workers in one machine; Render scales instances across machines; both need shared state in Redis.
27. **How are environment-specific CORS origins handled?** `CLIENT_URL` comma list parsed into a Set, plus localhost always allowed for dev.
28. **What is `module.exports = app` used for?** Lets tests import the app without starting the server.
29. **How do you profile a Node app?** `--inspect` with Chrome DevTools, `clinic.js`, or `0x` flame graphs.
30. **How would you add structured logging?** `pino` with request ids and JSON lines shipped to a log drain.

### 7.5 Socket.IO

1. **What is Socket.IO?** A real-time bidirectional event library over WebSocket with HTTP long-polling fallback, reconnection, rooms and acknowledgements.
2. **WebSocket vs Socket.IO?** WebSocket is the raw protocol; Socket.IO adds an event protocol, auto-reconnect, fallbacks, rooms, namespaces and acks. Socket.IO clients cannot talk to plain WS servers.
3. **How is a socket authenticated?** Client passes `auth: { token }` in the handshake; server `io.use` verifies the JWT and loads the user; otherwise `next(new Error("Unauthorized"))`.
4. **What are rooms and how are they used?** Named groups of sockets; `user:<id>` for personal pushes and `conversation:<id>` for chat threads.
5. **Why must `conversation:join` be validated server-side?** Otherwise any user could join any room and read messages; the server checks `isParticipant`.
6. **What is an acknowledgement?** A callback the server invokes to reply to a specific emit; used to return the saved message or an error to the sender.
7. **Which events does JobSaathi define?** Client→server: `conversation:join`, `conversation:leave`, `message:send`, `messages:read`, `typing`. Server→client: `message:new`, `conversation:updated`, `messages:read`, `typing`, `notification:new`.
8. **How do REST and socket paths stay consistent?** Both call `messageService.createMessage`, so validation and persistence are identical.
9. **How does the client fall back when the socket is down?** Sends via REST and polls `GET …/messages?after=` every 15 s; notifications/unread counts also poll every 60 s.
10. **`socket.to(room).emit` vs `io.to(room).emit`?** The first excludes the sender (typing indicators); the second includes everyone (new messages).
11. **How is rate limiting done on sockets?** A per-socket token bucket closure (`createSocketBucket(20, 10_000)`), since express-rate-limit needs an HTTP `req`.
12. **How does reconnection work?** Client option `reconnection: true` with backoff (1 s → 8 s); on `connect` the thread re-joins its room and re-emits `messages:read`.
13. **Why a single shared socket on the client?** Multiple hooks share one connection; `getSocket()` recreates it only when the token changes; `disconnectSocket()` on logout.
14. **What transports are configured?** `["websocket", "polling"]` — try WebSocket first, fall back to polling.
15. **How does CORS apply to Socket.IO?** Separate `cors` option on the `Server`, using the same `isAllowedOrigin` function as Express.
16. **How do you scale Socket.IO horizontally?** Redis adapter so emits propagate across instances, plus sticky sessions so polling requests hit the same instance.
17. **What is a namespace?** A logical channel (`/chat`, `/admin`) with its own handlers; the app uses the default namespace with rooms.
18. **How are typing indicators debounced?** Client emits `true` once on first keystroke and `false` after an idle timeout; server relays only within a 10-per-5-s budget.
19. **How are read receipts delivered?** `messages:read` updates `readBy` via `$addToSet` and emits to the room so the other participant can show "seen".
20. **How does the cron job push notifications?** `emitToUser(userId, "notification:new", payload)` targets the user room from a non-request context via the exported `io`.
21. **What happens if `io` is not initialised yet?** `emitToUser` guards with `if (!io) return`, so services never crash before the server starts.
22. **How do you avoid duplicate listeners in React?** Effects register handlers and return `socket.off` cleanups; `onSocket` returns an unsubscribe.
23. **What is the handshake?** The initial HTTP request that upgrades to WebSocket (or starts polling) carrying `auth` and headers.
24. **How large can a message be?** Default `maxHttpBufferSize` 1 MB; app also enforces 2000 chars on text.
25. **How do you test socket flows?** `socket.io-client` in Jest against a test server, or Playwright with two browser contexts.
26. **Why emit `conversation:updated` to users instead of the room?** The recipient may not have the thread open; the user room updates their conversation list and unread badge.
27. **What is binary support?** Socket.IO can send Buffers/ArrayBuffers; not used here.
28. **How do you detect connection state in the UI?** `socket.connected` plus `connect`/`disconnect` events toggling a "live/offline" indicator and the polling fallback.
29. **What security issues exist with websockets?** Missing auth, room hijacking, flooding; addressed by JWT middleware, participant checks and token buckets.
30. **Socket.IO vs Server-Sent Events?** SSE is one-way server→client over HTTP; fine for notifications only, but chat needs bidirectional events.

### 7.6 Google Gemini API

1. **What is Gemini and which model is used?** Google's multimodal LLM family; the app uses `gemini-3.5-flash` via `@google/genai` for speed and cost.
2. **How is the client initialised?** Lazily: `new GoogleGenAI({ apiKey })` on first use; throws a 503 "not configured" error if the key is missing.
3. **What is a system instruction?** A persistent instruction passed in `config.systemInstruction` that sets persona and rules (e.g. "never invent platform data").
4. **What is JSON mode?** `responseMimeType: "application/json"` asks the model to return JSON only; the app still strips code fences and extracts the first JSON object defensively.
5. **Why coerce/validate the model output?** LLM output is non-deterministic; `coerceAnalysis`/`coerceProofread` clamp scores, filter invalid lines, enforce enums and caps.
6. **How is hallucination limited in the Resume Analyzer?** Prompt rules forbid inventing experience, require `[ADD: …]` placeholders for missing metrics, and label evidence as supported/needs_confirmation/unsupported.
7. **What is grounding in the chatbot?** Platform data (stats, listings) is pulled from MongoDB and injected as JSON; the prompt instructs the model to only use that JSON for platform facts.
8. **How are quota and outage errors handled?** `describeError` maps 429/RESOURCE_EXHAUSTED, invalid key, suspended project; chatbot falls back to deterministic answers; resume returns 503 with a message.
9. **Why cache Gemini results?** Calls are slow and quota-limited; the same resume + JD hash returns the stored analysis; top jobs cached 120 s; company profiles 6 h.
10. **How does the draft avoid repeated calls on re-analyze?** Stores `analysisTextHash`; if the current text hash matches, it returns the saved result with `cached: true`.
11. **What is a prompt template?** A function that builds the prompt string with rules + data (`buildAnalysisPrompt`, `buildProofreadPrompt`).
12. **How is conversation memory implemented?** The last 8 chat turns are sent as text in the prompt for general questions (no server-side session).
13. **Why not send the whole resume for every bullet?** Cost and latency; one call returns all bullets with line numbers referencing the numbered resume.
14. **What is temperature and is it set?** Controls randomness; not set (model default). For JSON extraction a lower temperature would increase consistency.
15. **How do you keep the API key safe?** Server-only env var, never sent to the browser, redacted from logs.
16. **What rate limiting protects the quota?** `aiLimiter` 30 requests per 15 min per user on chatbot and resume endpoints.
17. **Streaming vs non-streaming?** Streaming returns tokens incrementally for better UX; app uses single responses for simplicity and JSON parsing.
18. **How would you evaluate output quality?** Golden resume/JD pairs with expected keywords, score bands, and schema validation in CI.
19. **What is intent detection and why not let Gemini do it?** Regexes classify stats/top_jobs/company deterministically, which is free, instant and makes fallbacks possible without AI.
20. **What about PII sent to Google?** Resume text leaves the server; a privacy notice and data-retention policy are required; could redact emails/phones before sending.
21. **How do you handle partial/invalid JSON?** `extractJson` locates the first `{`/`[` and last matching bracket, then parses; failure throws a readable error → 503/500.
22. **Why a 503 for AI errors?** It signals temporary unavailability of a dependency, and the client can retry; distinct from 500 bugs.
23. **How are prompts kept within token limits?** Resumes are capped by the 5 MB PDF limit and typical length; listings are reduced with `minimalListing`; history limited to 8 turns.
24. **What does the "evidence checker" return?** Per bullet: `evidence.status`, `note`, `askFor`; plus `unsupportedClaims` from the JD and a learning `roadmap`.
25. **Gemini vs OpenAI vs local models?** Gemini chosen for free tier, JSON mode and speed; the service layer isolates the vendor so swapping is a one-file change.
26. **How do you prevent prompt injection from resume text?** Treat resume/JD as data under explicit delimiters, enforce JSON schema on output, and never execute model output.
27. **What is the `lastError` status endpoint for?** `GET /api/chatbot/status` lets the widget show whether AI is available and why not.
28. **How would you A/B test prompts?** Version prompts, log the version with each analysis, compare scores/acceptance rates.
29. **What is multimodal capability and is it used?** Gemini accepts images/PDF directly; the app extracts text with pdf-parse instead to control input and cost.
30. **How would you add retries?** Exponential backoff on 429/503 with a small max, respecting `Retry-After`, bounded by the request timeout (Axios 60 s).

### 7.7 JWT (JSON Web Token)

1. **What is a JWT?** A signed token with header, payload and signature (base64url) that proves claims without server-side session state.
2. **What does JobSaathi put in the payload?** Only `{ id }` plus `iat`/`exp`; role is loaded from the DB on every request so changes take effect immediately.
3. **Which algorithm is used?** `jsonwebtoken` default HS256 (HMAC with `JWT_SECRET`).
4. **How long is the token valid?** 7 days (`expiresIn: "7d"`).
5. **Where is the token stored on the client?** `localStorage`; sent as `Authorization: Bearer <token>` by the Axios interceptor and as `auth.token` on the socket handshake.
6. **localStorage vs httpOnly cookie?** localStorage is readable by JS (XSS risk) but immune to CSRF; httpOnly cookies are safer against XSS but need CSRF protection and CORS credentials.
7. **How is the token verified?** `jwt.verify(token, secret)` checks signature and expiry; failures return 401.
8. **Why does `protect` still hit the database?** To get fresh role/request status and to reject deleted users; stateless verification alone can't do that.
9. **How do you revoke a JWT?** You can't directly; options: short expiry + refresh tokens, a denylist in Redis, or rotating the secret (logs everyone out).
10. **What is the difference between authentication and authorisation here?** `protect` authenticates (who); `authorize(...roles)` authorises (what they may do).
11. **What are refresh tokens?** Long-lived tokens exchanged for new short-lived access tokens; not implemented yet (listed in scaling plan).
12. **What is in the JWT header?** `alg` and `typ`; never trust `alg` from the token — libraries pin allowed algorithms.
13. **Why is `JWT_SECRET` generated by Render?** `generateValue: true` creates a strong random secret so it is never committed.
14. **How does the frontend react to an expired token?** A 401 response triggers the interceptor to clear storage and redirect to login.
15. **Can two services verify the same JWT?** Yes, with the shared secret (HS256) or public key (RS256); Express and Socket.IO both verify it in this app.
16. **HS256 vs RS256?** Symmetric secret vs asymmetric key pair; RS256 lets other services verify without the signing key.
17. **What is `iat` and `exp`?** Issued-at and expiry timestamps (seconds) added by the library.
18. **Why not store the role in the token?** It would go stale after admin approval; the app wants instant role changes (approval flow).
19. **How does bcrypt relate to JWT?** bcrypt verifies the password at login; JWT then represents the session.
20. **What is a bearer token?** Whoever holds it is authenticated; hence HTTPS only and short lifetimes.
21. **What's the risk of a weak secret?** Offline brute force of HS256 signatures lets attackers forge tokens; use ≥ 32 random bytes.
22. **How do you pass a JWT over websockets?** In the handshake `auth` object (preferred) or an `Authorization` header; query strings leak into logs.
23. **How would you implement logout server-side?** Add the token's `jti` to a denylist until `exp`, or rotate per-user token versions stored in the user document.
24. **What claims does the standard define?** `iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, `jti`.
25. **What is token replay and how to mitigate?** Reusing a stolen token; mitigate with short expiry, binding to client fingerprint, TLS.
26. **How is the password hash protected from leaking?** `select("-password")` in `protect`, `toPublic()` in responses, `delete safe.password` in profile update.
27. **What happens if the Authorization header is malformed?** `protect` requires the `Bearer` prefix; otherwise 401 "no token".
28. **How do you test protected routes?** Sign a token with the test secret and send it in the header with Supertest.
29. **JWT vs server sessions?** Sessions need a store and cookie but allow instant revocation; JWT is stateless and scales easily but can't be revoked cheaply.
30. **Why `ensureAdminRole` on login as well as signup?** So an email added to `ADMIN_EMAILS` later is promoted on next login without a DB migration.

### 7.8 Node-Cron

1. **What is node-cron?** An in-process scheduler that runs a function on a cron expression using timers.
2. **What is the cron expression used?** `NOTIFY_CRON`, default `*/2 * * * *` = every 2 minutes.
3. **Explain cron syntax.** Five fields: minute, hour, day of month, month, day of week; node-cron also supports an optional seconds field.
4. **What does the scheduled job do?** `notifyNewListings`: announce un-notified listings via notifications, sockets and emails, then mark them notified.
5. **How are overlapping runs prevented?** A module-level `isRunning` flag; if a run is still going, the next tick is skipped.
6. **Why run the job once at startup?** To catch listings created while the server was down or sleeping.
7. **Why is the job idempotent?** It only processes `notified: false` listings and flips the flag after success, so re-runs don't duplicate alerts.
8. **What happens on a free Render instance that sleeps?** Timers stop; the job catches up on the next wake because of the startup run.
9. **What if `NOTIFY_CRON` is invalid?** `cron.validate` fails and the server logs an error and continues without the cron.
10. **How is the job triggered manually?** `POST /api/notifications/run` calls the same `notifyNewListings` for testing.
11. **node-cron vs setInterval?** Cron gives wall-clock schedules (e.g. 9 AM daily) and expressions; setInterval drifts and is relative to start time.
12. **node-cron vs system cron vs a job queue?** In-process is simplest; system cron needs a long-lived host; queues (BullMQ, Agenda) add persistence, retries and distribution.
13. **What is the risk when scaling to multiple instances?** Each instance runs the cron → duplicate emails; use a single worker or a distributed lock.
14. **How would you implement a distributed lock?** Redis `SET lock NX PX` or an atomic Mongo `findOneAndUpdate` that claims a listing (`notified:false → processing`).
15. **How do you handle errors inside the job?** `runSafely` catches and logs; per-email failures are isolated with `Promise.allSettled`.
16. **How do time zones work in node-cron?** `schedule(expr, fn, { timezone: "Asia/Kolkata" })`; default is the server's zone (UTC on Render).
17. **How would you add a daily digest instead of per-listing alerts?** A second schedule `0 9 * * *` aggregating listings from the past day per user.
18. **How do you stop a scheduled task?** `task.stop()` on the returned task object (returned from `startNotificationCron`).
19. **What is the cost of the fan-out?** O(users × new listings) notification docs and emails; fine at small scale, needs batching/queues at scale.
20. **Why `insertMany` with `ordered:false` in the job?** Faster bulk insert and resilience to a single bad document.
21. **How does the job emit socket events outside a request?** Through `socketService.emitToUser`, which uses the module-level `io`.
22. **How would you monitor the cron?** Log a summary each run (already), add a last-run timestamp to `/api/health`, alert if stale.
23. **Would you move the cron into a worker on Render?** Yes: a Background Worker service running only the job, leaving the API stateless.
24. **How are email failures reported?** The first rejected result per listing is logged; counts of sent emails are logged in the summary.
25. **What is `checkperiod` vs cron?** Unrelated: `checkperiod` is node-cache's expiry sweep; cron is the business schedule.
26. **Can node-cron run async functions?** Yes; the callback can return a promise, but node-cron doesn't await it, which is why `isRunning` guards overlap.
27. **How do you test the cron logic?** Unit-test `notifyNewListings` with a test DB; don't test node-cron scheduling itself.
28. **How would you throttle emails to respect provider limits?** Chunk recipients and `await` between batches, or hand off to a queue with a rate limiter.
29. **What's the difference between `cron.schedule` and `new CronJob`?** `schedule` is node-cron's API; `CronJob` is from the `cron` package.
30. **Why not notify synchronously inside `createListing`?** It would slow the recruiter's request and couple posting to email delivery; the cron decouples them.

### 7.9 NodeCache (node-cache)

1. **What is node-cache?** A simple in-memory key-value cache for Node with per-key TTL and periodic expiry checks.
2. **What is cached in JobSaathi?** Listings by query, analytics per user, admin stats, chatbot top-jobs and company replies, resume analysis/proofread results.
3. **What are the TTLs?** Default `CACHE_TTL_SECONDS` = 60 s; admin stats 30 s; top jobs 120 s; company profiles 6 h; resume AI results 1 h.
4. **Why `useClones: false`?** Avoids deep-cloning large objects on every get/set for speed; callers must not mutate cached objects.
5. **What is `checkperiod`?** Interval at which expired keys are swept; set to half the TTL (min 30 s).
6. **How does `cacheResponse` middleware work?** Builds a key from the request, returns the cached body on HIT, otherwise wraps `res.json` to store successful 2xx bodies.
7. **How is cache invalidation done?** Domain helpers: `invalidateListings` (prefix delete of `listings:`, chatbot keys, admin stats), `invalidateAnalytics(userId)`, `invalidateAdminStats`, called from controllers after writes.
8. **What is cache stampede and does it apply?** Many misses recomputing at once after expiry; small risk here; mitigate with request coalescing or stale-while-revalidate.
9. **What is the `wrap` helper?** Get-or-compute: returns cached value or runs `compute()`, stores and returns it; used for Gemini results.
10. **Why key resume results by content hash?** Identical text + JD gives identical output, so the hash is a stable, privacy-neutral key.
11. **What are the limits of in-memory caching?** Per-process, lost on restart, not shared across instances, bounded by heap.
12. **When would you move to Redis?** As soon as there is more than one API instance or you need persistence/shared invalidation.
13. **How does the cache affect correctness?** Reads can be up to TTL stale; writes invalidate the relevant keys so users see their own changes immediately.
14. **Why is `X-Cache: HIT|MISS` useful?** Debugging and verifying caching in production without logs.
15. **How are cache stats exposed?** `/api/health` returns keys, hits, misses and TTL from `cache.getStats()`.
16. **Why cache per user for analytics but globally for listings?** Analytics are user-specific; listings are the same for everyone with the same query.
17. **How does `delByPrefix` work and what is its cost?** Filters `cache.keys()` by prefix then deletes; O(keys), fine for small caches.
18. **What could cause unbounded growth?** Distinct listing query strings; mitigated by TTL expiry and by invalidation on writes.
19. **Cache-aside vs write-through?** The app uses cache-aside (read-through on miss, invalidate on write); write-through would update the cache on writes.
20. **How do you prevent caching error responses?** The middleware only stores when `statusCode` is 2xx.
21. **How is the chatbot's top-jobs cache keyed?** By UTC date so the "today" list resets daily, and it's cleared whenever a listing changes.
22. **Why cache the company profile for 6 h?** Company general knowledge rarely changes; the key includes listing ids so new listings change the key.
23. **Is caching applied to authenticated data safely?** Yes: keys include the user id where data is personal; shared keys only for data every authenticated user may read.
24. **What is TTL jitter and why add it?** Random TTL offsets to avoid many keys expiring simultaneously; not needed at this scale.
25. **How would you cache at the HTTP layer instead?** `Cache-Control`/ETag headers for GETs; harder with per-user auth headers.
26. **How does node-cache handle `undefined` values?** `get` returns `undefined` on miss, so the code checks `!== undefined`; `wrap` doesn't store undefined.
27. **Memory estimate for the cache?** Small: listings and analytics are KBs; resume analyses tens of KBs; TTLs keep it bounded.
28. **How do you test caching behaviour?** Call an endpoint twice and assert `X-Cache` MISS then HIT; write then assert MISS again.
29. **What's the difference between node-cache and `lru-cache`?** node-cache is TTL-centric; lru-cache evicts by size/least-recently-used, better for bounded memory.
30. **Why cache Gemini results but not chat messages?** AI results are expensive and deterministic by input; messages change constantly and must be fresh.

### 7.10 Rate limiter (express-rate-limit)

1. **What is rate limiting?** Capping how many requests a client can make in a time window to prevent abuse and protect resources.
2. **Which limiters exist in JobSaathi?** `apiLimiter` (300 per 15 min per IP on all `/api`), `authLimiter` (10 failed attempts per 15 min), `aiLimiter` (30 per 15 min per user), `writeLimiter` (30 per minute per user), plus socket token buckets.
3. **Why key by user id when available?** Users behind shared NATs (offices, campuses) share an IP; per-user keys are fairer and stricter against single abusers.
4. **What does `skipSuccessfulRequests` do?** Only failed responses count, so legitimate logins aren't blocked while brute force is.
5. **What headers are sent?** `standardHeaders: "draft-7"` → `RateLimit` header with limit/remaining/reset; legacy `X-RateLimit-*` disabled; custom `Retry-After`.
6. **What status code is returned?** 429 Too Many Requests with a JSON body `{ message, retryAfterSeconds }`.
7. **How does the frontend handle 429?** Axios interceptor shows a single toast with the retry time.
8. **Why is `/api/health` skipped?** Render's health checks must never be rate-limited.
9. **Why does `trust proxy` matter?** Without it every request appears to come from the proxy IP and all users share one bucket.
10. **What is `ipKeyGenerator`?** A helper that normalises IPv6 addresses so a client can't bypass limits by rotating within a /64.
11. **What is a token bucket?** Tokens refill at a steady rate; each event consumes one; allows bursts up to the bucket size. Used for socket events.
12. **Fixed window vs sliding window?** Fixed resets at the boundary (allows 2× bursts at edges); sliding smooths this; express-rate-limit's default memory store is fixed window.
13. **Where is the limit state stored?** In memory per process by default; use `rate-limit-redis` for shared counters across instances.
14. **Why separate AI limits?** Gemini calls cost quota and seconds; a lower cap per user protects the shared key.
15. **Why a per-minute write limiter?** Prevents listing/message spam while leaving reads unaffected.
16. **How do you choose limits?** Observe normal usage (requests per page load), add headroom, tighten on abuse signals; all values are env-configurable.
17. **How does rate limiting differ from throttling?** Limiting rejects over-limit requests; throttling slows them (delays). The app rejects.
18. **What about rate limiting per route vs global?** Global protects infrastructure; per-route protects specific expensive actions; both are used.
19. **How are limits communicated to API consumers?** Headers and a human message; documented defaults in `.env.example`.
20. **What is the risk of too-strict limits?** Blocking real users (e.g. a dashboard load fires ~5 requests); hence 300 per 15 min globally.
21. **How does the socket bucket refill?** `tokens = min(limit, tokens + elapsed/interval × limit)` on each call, then consume one.
22. **Why not rely on Render/Cloudflare rate limiting?** Edge limits are coarse and per IP; application limits can be per user and per feature.
23. **How would you implement a global per-user daily AI quota?** Redis counter keyed `ai:<user>:<date>` with expiry at midnight, checked in middleware.
24. **How do you test limiters?** Hit the endpoint limit+1 times in a test and expect 429, with a short window configured via env.
25. **What's the handler option?** A custom function to format the 429 response; the app uses `jsonHandler(message)` to set `Retry-After` and JSON.
26. **Does rate limiting stop DDoS?** No; it mitigates application-level abuse. Volumetric attacks need edge/CDN protection.
27. **Why count only failed auth attempts per IP and not per email?** Simplicity; adding a per-email key would also stop distributed guessing of one account.
28. **What is `windowMs`?** Window length in ms; derived from `RATE_LIMIT_WINDOW_MIN` (15 min).
29. **Could the limiter leak memory?** The memory store prunes expired keys; bounded by distinct IPs/users per window.
30. **How do rate limits interact with caching?** Cached responses still count against the limit because the limiter runs before the cache middleware.

### 7.11 Tailwind CSS

1. **What is Tailwind CSS?** A utility-first CSS framework where you compose styles from small single-purpose classes in markup.
2. **What's new in Tailwind 4 used here?** CSS-first configuration (`@theme` in CSS), the `@tailwindcss/vite` plugin, no `tailwind.config.js` required, native CSS variables for tokens.
3. **How is dark/light theming implemented?** `ThemeProvider` toggles `dark`/`light` classes on `<html>`; CSS variables (`--bg`, `--fg`, `--surface-2`, `--line`) change per theme and utilities reference them (`bg-bg`, `text-fg`).
4. **How are repeated patterns kept DRY?** Component classes defined with `@apply` or `@utility` (`card`, `btn-primary`, `btn-ghost`, `input`, `badge`, `icon-btn`, `label`).
5. **What is responsive design in Tailwind?** Mobile-first breakpoints as prefixes: `grid-cols-1 md:grid-cols-2 xl:grid-cols-4` for the Kanban board.
6. **How does Tailwind keep CSS small?** It scans source files and emits only the classes used; production CSS is typically tens of KB.
7. **What is the JIT engine?** Generates styles on demand as classes are found, enabling arbitrary values like `h-[calc(100vh-13.5rem)]`.
8. **How are state variants used?** `hover:`, `focus:`, `disabled:`, `last:` (e.g. `hover:bg-surface-2`, `last:border-0`).
9. **How are animations done?** Custom keyframes exposed as utilities (`animate-rise`, `animate-pop`) for page and dropdown transitions.
10. **Why utility classes instead of CSS modules or styled-components?** Faster iteration, no naming, consistent spacing/color scale, no runtime cost.
11. **What are the downsides?** Long class strings, duplication across similar elements, harder to read for newcomers.
12. **How do you handle conditional classes?** Template literals with ternaries (`${n.read ? "" : "bg-primary-soft/40"}`) or `clsx`.
13. **What does `/40` mean in `bg-primary-soft/40`?** Opacity modifier: 40 % alpha of that color.
14. **How is the toast styled to match the theme?** `react-hot-toast` receives inline styles referencing the same CSS variables.
15. **How does Tailwind integrate with Vite?** `@tailwindcss/vite` plugin processes `@import "tailwindcss"` in `index.css`.
16. **How are charts themed?** Recharts takes colors from `chartTheme.js`, which reads the same palette so charts match dark/light mode.
17. **What is `space-y-6` vs `gap-6`?** `space-y` adds margin between stacked children; `gap` is for flex/grid containers.
18. **How do you prevent layout shift with sidebars?** Fixed widths (`lg:grid-cols-[340px_1fr]`), `min-w-0` to allow truncation, `shrink-0` on icons.
19. **What is `line-clamp-2`?** Truncates text to two lines with an ellipsis; used for notification messages.
20. **How are accessible focus styles maintained?** Tailwind preserves focus outlines unless removed; custom `focus:ring` utilities on inputs.
21. **How do you create a design token system in Tailwind 4?** Define `--color-primary`, spacing and radius variables inside `@theme`, then utilities like `bg-primary` are generated automatically.
22. **How does purge/content detection work in v4?** Automatic source detection with optional `@source` directives; no `content` array needed.
23. **What's the difference between `hidden lg:block` and conditional rendering?** CSS hides but still mounts; conditional rendering unmounts. Messages page uses CSS so the list stays mounted on desktop.
24. **How do you style third-party components (Recharts, DnD)?** Wrapper divs with utilities and passing colors/props; DnD cards get `card` classes and transform styles from the library.
25. **How do you handle long class lists for readability?** Extract components, use `@apply` for repeated bundles, order classes consistently (Prettier plugin).
26. **What are arbitrary variants?** `[&>svg]:w-4` style selectors for one-off child styling.
27. **How does Tailwind affect performance?** Static CSS, no runtime; initial CSS small; class scanning at build only.
28. **How do you support RTL or print?** `rtl:` and `print:` variants exist; not used here.
29. **How is a skeleton/loading state styled?** `animate-pulse` on placeholder blocks and `Spinner` component.
30. **How would you migrate from Tailwind 3 to 4?** Remove `tailwind.config.js` in favour of `@theme`, update plugin to `@tailwindcss/vite`, run the official upgrade tool, check renamed utilities.

---

## Appendix — Quick reference

**Local dev:** backend `npm run dev` on port 5001, frontend `npm run dev` on 5173, `VITE_API_URL=http://localhost:5001/api`.
**Key env vars:** `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `CLIENT_URL`, `APP_URL`, `ADMIN_EMAILS`, `NOTIFY_CRON`, `SMTP_*`, `RATE_LIMIT_*`, `AI_RATE_LIMIT_MAX`, `WRITE_RATE_LIMIT_PER_MIN`, `CACHE_TTL_SECONDS`.
