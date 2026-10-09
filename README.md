# JanSewa — Public Grievance Redressal System

A citizen grievance portal: citizens file civic complaints with photo evidence,
department heads triage and assign them to field officers, officers upload
proof of the repair, and the citizen verifies (closes with a rating) or
reopens the case. A public transparency page shows anonymised performance
statistics.

## Project structure

```
Public-Grivance-System/
├── package.json            ← npm workspaces root: one `npm install`, shortcut scripts
├── backend/
│   ├── server/             ← Express REST API (the frontend's backend)
│   │   ├── server.js       ← entry point: starts the API on port 4000
│   │   ├── app.js          ← Express app: middleware + route mounting
│   │   ├── config.js       ← env settings (SUPABASE_URL, keys, API_PORT, CLIENT_ORIGIN)
│   │   ├── middleware/     ← auth (verifies Supabase token), error handler
│   │   ├── routes/         ← grievances, notifications, users (me/officers), public, auth
│   │   └── lib/            ← per-user Supabase client, mappers, validation, HTTP errors
│   ├── supabase/
│   │   ├── config.toml     ← local Supabase settings (ports, auth, storage)
│   │   ├── migrations/     ← SQL schema: tables, RLS policies, workflow functions, storage bucket
│   │   └── seed.sql        ← demo departments, users and grievances (local only)
│   ├── tests/api/          ← Express API tests (supertest) against the real database
│   ├── tests/integration/  ← direct database tests (RLS + workflow functions)
│   └── .env.example
└── frontend/               ← React 19 + Vite single-page app
    ├── src/
    │   ├── lib/api.js            ← fetch wrapper for the Express API (adds the login token)
    │   ├── lib/supabase.js       ← Supabase client: login session, photo upload, realtime
    │   ├── services/             ← all data access (calls the Express API)
    │   ├── context/AuthContext   ← session + profile/role
    │   ├── hooks/                ← data-loading and photo-upload hooks
    │   ├── pages/ components/    ← UI per role
    │   ├── utils/                ← dates, analytics (SLA, workload)
    │   └── tests/                ← unit (Vitest) and e2e (Playwright)
    └── .env.example
```

## What uses what

```
Browser — React app (frontend/, Vite dev server :5173)
   │
   ├── /api/*  ──────────►  Express API (backend/server, :4000)
   │   (data + workflow)        │ verifies the user's Supabase token, then
   │                            │ queries Supabase AS that user (anon key + token)
   │                            ▼
   ├── login / session ───►  Supabase (:54321 locally, Docker)
   ├── photo upload ──────►    ├── Auth (GoTrue)      users, sessions, tokens
   └── realtime ping ─────►    ├── REST (PostgREST)   used by the Express API
                               ├── Storage            bucket "grievance-photos"
                               ├── Realtime           notification change events
                               ▼
                         PostgreSQL 17 — all data and all permission rules
                         (Row Level Security, triggers, workflow functions)
```

In development the browser calls `/api/...` on the Vite server, which proxies to
Express on port 4000 (`frontend/vite.config.js`). Express never uses the
Supabase service-role key, so even a bug in a route cannot bypass the
database's permission rules.

| Feature | Frontend calls | Express route | Supabase / database |
| --- | --- | --- | --- |
| Register / login / logout | Supabase Auth directly | — (`POST /api/auth/login` exists for API clients) | `auth.users`; trigger `handle_new_user` creates the `profiles` row (role = citizen) |
| Current user's role | API | `GET /api/me` | `profiles` |
| Dashboards / lists | API | `GET /api/grievances[?mine=true]` | `grievances` (RLS filters by role) |
| Case details + timeline | API | `GET /api/grievances/:id` (UUID or `GRV-…`) | `grievances` + `grievance_events` |
| File a grievance | API | `POST /api/grievances` | insert into `grievances`; trigger sets complaint ID, department, notifies dept head |
| Duplicate warning | API | `GET /api/grievances/similar` | `find_similar_grievances()` |
| Assign officer | API | `POST /api/grievances/:id/assign` | `assign_grievance()` |
| Reject during triage | API | `POST /api/grievances/:id/reject` | `reject_grievance()` |
| Officer resolves | API | `POST /api/grievances/:id/resolve` | `resolve_grievance()` |
| Citizen approves / reopens | API | `POST /api/grievances/:id/verify` | `verify_resolution()` |
| Officer list / workload | API | `GET /api/officers[?department=]` | `profiles` (role = officer) |
| Notification bell | API + Supabase Realtime ping | `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all` | `notifications` |
| Photo upload | Supabase Storage directly | — | bucket `grievance-photos` (`<user-id>/<file>`) |
| Public transparency page | API (no login) | `GET /api/public/grievances` | `public_grievance_feed()` (anonymised) |
| Health check | — | `GET /api/health` | — |
| Map, analytics charts | computed in the browser | — | from the grievances already loaded |

API errors are JSON `{ "error": { "message", "code" } }` with statuses
400 (invalid input / wrong status), 401 (not signed in), 403 (not allowed),
404 (not found or not visible to you).

Reference tables: `departments`, `categories` (category → department routing).

### Using the API from Postman / curl

```bash
# 1. get a token
POST http://localhost:4000/api/auth/login   { "email": "admin@demo.jansewa.in", "password": "Demo@12345" }
# 2. call any route with it
GET  http://localhost:4000/api/grievances   Authorization: Bearer <accessToken>
```

## Roles

| Role | Can |
| --- | --- |
| Citizen | Register, file grievances with photos, track them, approve or reopen resolutions |
| Field officer | See cases assigned to them, upload resolution proof |
| Department head | See their department's cases, assign officers, reject invalid cases |
| Admin | Everything, across all departments |

Lifecycle: `Submitted → In Progress → Resolved → Closed`, with `Reopened`
(citizen rejects the work) and `Rejected` (invalid during triage).

## How the backend is secured

- **Row Level Security** scopes every read: citizens see their own cases,
  officers see cases assigned to them, department heads see their department,
  admins see all. Anonymous visitors get nothing except the anonymised
  `public_grievance_feed()`.
- **No direct updates.** Clients cannot `UPDATE` grievances. Every transition
  goes through a database function that checks the caller's role and the
  current status, writes the timeline event and sends notifications.
- New sign-ups always get the **citizen** role. Users cannot change their own
  role, department or email. Staff roles are granted by an admin.
- Photos: images only, max 5 MB, each user can only upload into their own
  folder. The bucket is public-read so photos display by URL.

## Local development

Requirements: Node 20.12+, Docker (for the local Supabase stack).

```bash
npm install                      # installs backend + frontend (workspaces)
npm run db:start                 # starts Supabase in Docker, applies migrations + seed
npm run db:env                   # prints API_URL, ANON_KEY, SERVICE_ROLE_KEY
cp frontend/.env.example frontend/.env   # fill VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
cp backend/.env.example backend/.env     # fill SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
npm run dev                      # starts Express API (:4000) + website (http://localhost:5173)
```

Supabase Studio (database browser) runs at http://127.0.0.1:54323.
`npm run db:reset` re-applies migrations and the seed; `npm run db:stop` stops Docker containers.

### Demo accounts (seeded locally)

All use the password `Demo@12345`. With `VITE_ENABLE_DEMO_LOGIN=true` the login
page shows one-click buttons for the first four.

| Role | Email |
| --- | --- |
| Citizen | `aarav.citizen@demo.jansewa.in` |
| Officer (Sanitation) | `rahul.officer@demo.jansewa.in` |
| Dept head (Sanitation) | `priya.head@demo.jansewa.in` |
| Admin | `admin@demo.jansewa.in` |

More officers and department heads are in [`backend/supabase/seed.sql`](backend/supabase/seed.sql).

## Tests

```bash
npm run test           # frontend unit + component tests (no backend needed)
npm run test:backend   # backend: Express API tests + RLS/workflow database tests
npm run test:e2e       # frontend: Playwright browser tests (starts the dev server)
npm run test:all       # lint + all of the above
```

Backend and E2E tests need `npm run db:start` and the `.env` files (E2E starts
the API and website itself). They run
serially (one shared database); each test file creates its own throwaway users
and deletes them afterwards, so the seed data is left intact.
First Playwright run: `npx playwright install chromium`.

## Deploying to a hosted Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. From `backend/`, link and push the schema (do **not** push `seed.sql` — it
   contains demo accounts with a public password):
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
3. Insert departments and categories (the first two blocks of `seed.sql`) via
   the SQL editor.
4. Deploy the API (`backend/`, run `npm start`) on any Node host with
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `API_PORT` and `CLIENT_ORIGIN` (your
   website's URL). It does not need the service-role key.
5. Build the frontend (`npm run build`, output in `frontend/dist`) with
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (the API's URL)
   and `VITE_ENABLE_DEMO_LOGIN=false`, and add your site URL under
   Authentication → URL Configuration in Supabase.
6. Create your first admin: sign up normally, then in the SQL editor run
   `update public.profiles set role = 'admin' where email = 'you@example.com';`
