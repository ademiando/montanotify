# MontaNotify (AI task scheduler & notifier)

MontaNotify is a deployable Next.js application that:
- Lets users create scheduled **tasks** (custom prompts) or **subscriptions** (topic-based).
- Calls selected AI (OpenAI or Grok-like xAI) automatically at scheduled times.
- Sends results via **Email (SendGrid)** and optionally **WhatsApp (Twilio)**.
- Persists subscriptions/tasks in **Supabase**.
- Scheduler endpoint (`/api/sendScheduled`) protected by header `x-scheduler-secret: ACTION_SECRET`.

> This README includes step-by-step instructions for creating files via **GitHub web UI** and deploying on **Vercel** without using a local machine.

---

## What’s included
- Frontend UI: subscription & task creation, preview, task list.
- API routes: preview, subscribe, unsubscribe, tasks CRUD, fetchNow, sendScheduled, health.
- Lib modules: supabase client, NewsAPI fetcher, AI client (OpenAI + Grok-compatible), summarizer, email, WhatsApp helper.
- DB schema: `db/schema.sql` for Supabase.
- GitHub Actions fallback workflow `.github/workflows/scheduler.yml`.
- `.env.example` lists required environment variables.

---

## 1) Create GitHub repo & add files (web UI)
1. Go to GitHub → New repository → name it `montanotify` (or any name).
2. In the repository page click **Add file → Create new file**.
3. For each file listed in this repository, create a new file with the same path and paste the exact file contents from this package.
   - Example: create a file named `package.json`, paste the JSON contents, then click **Commit new file**.
4. Repeat for all files and subfolders (create folders by typing `pages/index.js`, `lib/aiClient.js`, etc.)

**File order recommendation (helps avoid missing imports):**
- Root config: `package.json`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`, `.gitignore`, `.env.example`, `README.md`, `LICENSE`.
- `db/schema.sql`
- `.github/workflows/scheduler.yml`
- `styles/globals.css`
- `pages/_app.js`, `pages/index.js`, `pages/dashboard.js`
- `pages/api/*`
- `components/*`
- `lib/*`
- `notes/DEPLOY_CHECKLIST.txt`

---

## 2) Create Supabase DB and apply schema
1. Go to https://app.supabase.com → create new project.
2. After project ready, open SQL Editor → paste `db/schema.sql` and run it.
   - This creates `subscriptions`, `tasks`, and `task_runs` tables.

---

## 3) Set environment variables (Vercel)
Go to your Vercel project → Settings → Environment Variables. Add the variables from `.env.example` (Production). Required at minimum:
- NEXT_PUBLIC_SITE_URL
- NEWSAPI_KEY
- OPENAI_API_KEY
- OPENAI_MODEL (optional; default gpt-4)
- SENDGRID_API_KEY
- FROM_EMAIL
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- ACTION_SECRET

Optional (for Grok/xAI, WhatsApp):
- XAI_API_KEY
- XAI_API_BASE
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_WHATSAPP_FROM
- SITE_URL (for GitHub Actions)
  

**Do NOT commit these values to GitHub.**

---

## 4) Deploy to Vercel
1. Sign in to Vercel → Import Project → choose your GitHub repo.
2. During import ensure Environment Variables are set (or set them in Project Settings after import).
3. Deploy.

---

## 5) Configure scheduler
Use Vercel Cron or another scheduler to POST to `/api/sendScheduled`.

- Path: `/api/sendScheduled`
- Method: `POST`
- Body: `{}` (empty JSON)
- Header: `x-scheduler-secret: <ACTION_SECRET>`

Example cron expressions:
- Hourly: `0 * * * *`
- Daily at 08:00 UTC: `0 8 * * *`
- Every 15 minutes: `*/15 * * * *` (useful for per-minute scheduling windows)

Alternatively, add GitHub Actions secrets `SITE_URL` and `ACTION_SECRET`. The included workflow `.github/workflows/scheduler.yml` will call the endpoint on schedule.

---

## 6) Test
- Visit site root `/` to create a subscription or a task.
- Use **Preview** to test a prompt or topic.
- Manually trigger scheduler (after deploy):
```bash
curl -X POST "https://your-site.vercel.app/api/sendScheduled" \
  -H "Content-Type: application/json" \
  -H "x-scheduler-secret: your_action_secret" \
  -d '{}'
