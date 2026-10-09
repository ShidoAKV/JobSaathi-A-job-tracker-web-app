# JobSathi

JobSathi is a MERN stack web application that helps users keep track of their job applications throughout the hiring process. It allows users to organize applications, update their status, and monitor their job search progress from a single dashboard.

## Features

- Secure user authentication
- Add, edit and delete job applications
- Track application status (Applied, Interview, Offer, Rejected)
- Drag and drop applications between stages
- Dashboard with application statistics
- Monthly application analytics
- Recent applications and activity timeline
- Responsive UI with Light/Dark mode
-  AI-powered resume Analyzer

## Tech Stack

**Frontend**
- React.js
- Vite
- Tailwind CSS
- React Router
- Axios
- @hello-pangea/dnd

**Backend**
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- bcryptjs

**AI Integration**
-Google Gemini API

## Future Improvements


- Calendar integration
- Email notifications
- Company-wise application insights

## Author

Khushi  
B.Tech CSE Student, IGDTUW



## Deployment (backend and frontend deployed separately)

The backend and frontend are independent apps. Deploy the **API first**, then the **frontend** with the API URL baked in, then point the API's `CLIENT_URL` at the frontend origin.

### Backend — Node web service

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Build command | `npm install` |
| Start command | `npm start` |
| Node version | 20 or newer (set `NODE_VERSION=22` on the host) |
| Health check | `GET /api/health` |

Environment variables (see `backend/.env.example` for the full annotated list):

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | host-provided | Most hosts inject it; defaults to `5001` locally |
| `MONGO_URI` | yes | MongoDB Atlas connection string |
| `JWT_SECRET` | yes | Long random string for signing tokens |
| `CLIENT_URL` | yes | Frontend origin for CORS + Socket.IO, e.g. `https://jobsaathi.vercel.app` (comma-separate several) |
| `APP_URL` | yes | Frontend URL used inside notification emails (usually same as `CLIENT_URL`) |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | yes for AI | Chatbot, resume analyzer and evidence checker. Default model `gemini-3.5-flash` |
| `ADMIN_EMAILS` | recommended | Comma-separated emails that become admins on login |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `EMAIL_FROM` | optional | Email every user when a job is listed (Gmail: App Password, `smtp.gmail.com:587`) |
| `NOTIFY_CRON` | optional | node-cron schedule for announcing new listings (default every 2 min) |
| `RATE_LIMIT_WINDOW_MIN` `RATE_LIMIT_MAX` `AUTH_RATE_LIMIT_MAX` `AI_RATE_LIMIT_MAX` `WRITE_RATE_LIMIT_PER_MIN` | optional | Rate-limit tuning |
| `CACHE_TTL_SECONDS` | optional | node-cache TTL (default 60) |

### Frontend — static site

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Build command | `npm install && npm run build` |
| Publish directory | `dist` |
| SPA rewrite | `/*` → `/index.html` (required for client-side routing) |
| Env var | `VITE_API_URL=https://<your-api-host>/api` (must be set **before** the build; see `frontend/.env.example`) |

### Local setup

```bash
cp backend/.env.example backend/.env     # fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY, ADMIN_EMAILS
cp frontend/.env.example frontend/.env   # VITE_API_URL=http://localhost:5001/api
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

`.env` files are git-ignored in both folders; only the `.env.example` templates are committed.

**Roles (RBAC).** Every account is a **candidate** by default: track applications, browse listings and message companies. Employer access is requested at signup ("Employer" account type) or later from **Settings**, and an admin approves it from the **Admin** page at `/admin`. Only **recruiters** and **admins** can post listings; recruiters can delete their own listings, admins can delete any listing or user. Admins are bootstrapped via `ADMIN_EMAILS`.

**Resume Evidence Checker.** Besides the match score, `POST /api/resume/drafts/:id/proofread` returns line-referenced bullet rewrites, each labelled **supported**, **needs confirmation** or **unsupported** by the uploaded resume. Missing numbers are left as `[ADD: …]` placeholders rather than invented, and the job-description requirements the resume cannot evidence are listed separately with a short learning roadmap. Every upload becomes a draft (`/api/resume/drafts`) with up to 20 saved versions in MongoDB; analysis and proofread results are cached for an hour, so re-running on unchanged text costs no Gemini calls.

**Rate limiting & caching.** `express-rate-limit` guards every `/api` route (300 req / 15 min per IP by default), with stricter buckets for failed logins (10 per 15 min), Gemini-backed endpoints (30 per user per 15 min) and writes such as listings and messages (30 per minute per user). Socket.IO events have a per-socket token bucket. `node-cache` memoises listings, per-user analytics, admin stats and chatbot top-jobs/company answers (TTL 60 s by default; invalidated on writes). Tune via `RATE_LIMIT_*`, `AUTH_RATE_LIMIT_MAX`, `AI_RATE_LIMIT_MAX`, `WRITE_RATE_LIMIT_PER_MIN` and `CACHE_TTL_SECONDS` (see `backend/.env.example`). `GET /api/health` reports cache hit/miss counts.

**Real-time chat.** Company conversations and new-job alerts are pushed over Socket.IO (JWT-authenticated handshake); REST endpoints remain as a fallback. Make sure your host supports websockets for the API service (Render, Railway, Fly and most VPS setups do).

**Cron caveat on free tiers.** The new-job notification cron runs inside the API process. Free web services (e.g. Render) spin down after ~15 minutes without traffic, so the cron only fires while the service is awake; pending listings are announced on the next wake-up (the job also runs once at startup). For always-on notifications use a paid instance or ping `/api/health` from an external uptime monitor. You can also trigger the job manually with `POST /api/notifications/run` (requires a logged-in user's token).

**Demo data.** `cd backend && npm run seed` creates six demo company accounts and ~16 public job listings (idempotent). Log in as a company to reply to candidates in **Messages**:

| Company account | Email | Password |
|---|---|---|
| Google Careers | careers@google.demo | Company@123 |
| Microsoft Talent | talent@microsoft.demo | Company@123 |
| Amazon Hiring | hiring@amazon.demo | Company@123 |
| Razorpay People | people@razorpay.demo | Company@123 |
| Zomato Talent | talent@zomato.demo | Company@123 |
| Flipkart Careers | careers@flipkart.demo | Company@123 |

Run the seed against your Atlas database by setting `MONGO_URI` locally before `npm run seed`.
