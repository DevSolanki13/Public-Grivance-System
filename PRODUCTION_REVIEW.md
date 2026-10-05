# JanSewa – Production Testing & Change Log

**Deployment tested:** https://jansewa-three.vercel.app
**Code tested:** `Public-Grivance-System-main_1.zip` (latest) plus a patched copy (`JanSewa-production-fixes.zip`)
**Date:** 5 Oct 2026

---

## 0. How I tested, and the limits

| What | How | Limit |
|---|---|---|
| Latest code | Installed, ran the 8 backend tests, built the frontend, started the backend **with `NODE_ENV=production`** and attacked it with curl | I cannot see your Vercel environment variables |
| Live site | Read-only GET requests to `/api/*` and page URLs | I could **not** send POST requests or log in on the live site (my tools are GET-only), and I could not open it in a real browser |
| Patches | Re-ran the same attacks and a full workflow on the patched code in production mode | The Vercel routing fix could not be tested (see 2.4) |

Anything marked **[live]** was seen on your real deployment. **[local-prod]** was reproduced by running your code in production mode on my side. **[inferred]** means it follows from the code or from live evidence, but I could not send the request that proves it.

---

## 1. Verdict

| | Score |
|---|---|
| Your code before the fixes, as deployed | **≈ 55 / 100**: strong features, but 3 serious production holes |
| Patched code in this package, plus the Vercel steps in section 5 | **≈ 80 / 100** |

**Features:** every feature works end to end. I ran file → assign → start work → resolve with photo → citizen reopens → officer redoes → citizen closes with rating. Roles, scoping, SLA, notifications, audit log and public tracking all behave correctly **on a single server**.

**Production:** three things must be fixed before you present it, and two limits of Vercel serverless need to be understood or explained (see 2.3 and 2.4).

---

## 2. Problems found

### 2.1 CRITICAL (fix before presenting)

**P1. JWT signing secret is hard-coded in the source again [local-prod]**
`backend/utils/token.js` now returns `'jansewa_secure_production_secret_key_2026_fallback_long_random'` whenever `JWT_SECRET` is missing, even in production (the earlier version threw an error). If `JWT_SECRET` is not set in Vercel, **anyone who can read the repo can sign a token as the admin**. I proved this locally: a forged token returned the admin profile, the audit logs and all complaints.
→ **Fixed in the patched code:** production now refuses to start without `JWT_SECRET`. **You must set it in Vercel** (section 5), otherwise the site returns errors.

**P2. Admin password is public, and the login page advertises it [live + README]**
- The live API returns the seeded data (6 complaints, seed users), so the seeded accounts exist in production, all with password `password123`.
- `README.md` lists every email, including `admin@jansewa.gov.in`.
- The new login page shows the demo email and a "Fill Credentials" button for every role **in production** too (the `import.meta.env.DEV` guard was missing).
→ **Fixed:** the demo box is now hidden in production builds (I checked that `password123` is not in the built JS). Set `VITE_SHOW_DEMO=true` only if you want evaluators to use it. Then, after the demo, change the seed passwords (section 5).
→ [inferred] I could not POST a login on the live site, so I did not confirm that `admin@jansewa.gov.in / password123` works there. Try it yourself in a browser.

**P3. Public map endpoint leaks every complaint with its address [live]**
`GET /api/analytics/map` needs no login. It returned all 6 complaints with subject, street address and coordinates. The page that uses it is admin-only.
→ **Fixed:** the route now requires admin or department head.

### 2.2 HIGH

**P4. Any `*.vercel.app` site was allowed by CORS with credentials [local-prod]**
`server.js` allowed every origin ending in `.vercel.app`. Tokens live in `localStorage`, so the practical risk is low, but it should be your own origin only.
→ **Fixed:** only the origins in `CORS_ORIGIN` (comma-separated). Disallowed origins now get no CORS headers instead of a 500 error page.

**P5. Rate limiting is shared by everyone behind Vercel's proxy [inferred from code]**
There was no `app.set('trust proxy', 1)`. On Vercel all visitors then appear to share one IP, so 40 failed logins from anyone could lock out every user for 15 minutes.
→ **Fixed.** I tested that per-IP limiting works (a second IP can still log in after the first is blocked).

**P6. Unknown category silently accepted [local-prod]**
Posting `categoryId=garbage` created a complaint in "Roads" instead of a 400. The change was made so the home page links work, but the form already sends category IDs.
→ **Fixed:** the category must match an id or exact name, otherwise 400.

**P7. Officer could resolve a complaint that was only "Assigned" [local-prod]**
The UI offers "Resolve" only after "Start work", but the API allowed skipping it.
→ **Fixed:** resolving requires status `IN_PROGRESS` (a reopened case goes through "Start work" again, as the UI already does).

**P8. Password minimum was 6, README says 8 [local-prod]**
→ **Fixed** in the backend, the form and its hint to 8.

### 2.3 Limits of Vercel serverless (not fixed by small patches)

**P9. Data is not persistent [live + code]**
On Vercel the JSON database lives in `/tmp`. It is temporary, per instance, and reset on a cold start. Live evidence: the seed dates on the public tracking page shift each time (e.g. complaint 00118 was created "2026-10-03 16:47" today, relative to the instance start). Registered users and filed complaints can vanish or appear missing on another instance.
The `prisma/` folder, the `@prisma/client` dependency and the "Connects to Supabase" comment are **not wired in**: no service calls Prisma, so adding the database password does nothing. The README's "uses Supabase" would be misleading in a viva.
→ For a demo: say plainly it uses an embedded store, and demonstrate within one session. For real use: port `db.js` calls to Prisma/Supabase (about 1 to 2 hours of work). I did not do this because I can't test against your database.

**P10. Uploaded photos are not durable [inferred]**
Photos are saved to `/tmp/uploads` and the URL `/uploads/...` is routed to the backend, so a photo can 404 on another instance or after a restart. Vercel also rejects request bodies over about 4.5 MB, and your limit is 5 MB per photo.
→ Use Supabase Storage or Cloudinary for production. For the demo, use small photos (under 3 MB).

**P11. Background SLA worker does not run on serverless**
`setInterval` only runs while an instance is awake. Overdue status is still computed correctly **when you read** a complaint (so the UI is right), but the stored `isOverdue` and `isEscalated` flags are only written when the worker runs.

### 2.4 Routing: deep links return 404 [live]

Opening these directly returned **404**: `/login`, `/transparency`, `/track/GRV-2026-00118`, `/citizen/dashboard`. Only `/` loaded. Clicking links inside the app works (client-side routing), but **refreshing any page other than the home page, or opening a shared tracking link, breaks**. This matters because the "Track a complaint" links are meant to be shared.

Cause (likely): `frontend/vercel.json` contains the SPA fallback, but your root `vercel.json` uses `services` and its catch-all rewrite sends `/(.*)` to the frontend service, which does not apply the nested file. I could not test a fix on Vercel, so I did **not** change `vercel.json` blindly. Options, best first:

1. **Deploy as two Vercel projects** (frontend root = `frontend`, backend root = `backend`). Then `frontend/vercel.json` works as written. Set `VITE_API_URL=https://<backend-domain>/api` on the frontend and `CORS_ORIGIN=https://<frontend-domain>` on the backend. `client.js` already reads `VITE_API_URL`.
2. Keep one project and check Vercel's current docs for a SPA fallback inside `services` (rewrite everything that is not `/api` or `/uploads` to `/index.html`).
3. Last resort: switch `BrowserRouter` to `HashRouter` in `App.jsx` (URLs become `/#/login`). Replace the plain `<a href="/transparency">` links in the footer too.

---

## 3. Feature check (all verified on the local server in production mode)

| Feature | Result |
|---|---|
| Register (validation, 8+ char password) | Works |
| Login for 4 roles, JWT, `/auth/me` | Works |
| Quick-test role switch / demo-login endpoints | Disabled in production (403) |
| File complaint with up to 5 photos | Works; bad category → 400; `.html` disguised as PNG → 400 |
| Citizen sees only own complaints | Works (403 on others) |
| Dept head assigns only an officer from the same department | Works |
| Officer: start work → resolve with proof photo | Works; skipping start work now blocked |
| Citizen verify / reopen, rating, reopen resets SLA | Works |
| Public tracking page (masked names, shows resolution) | Works **[live]** (resolution text and proof present) |
| Notifications, audit log (staff only), dashboards, stats | Work |
| Rate limit on login | 429 after 40 tries per IP |
| Reset-data endpoint | Admin only, disabled in production |
| Security headers (Helmet), `nosniff` on uploads | Present |
| Frontend build (code-split) | OK; 8/8 backend tests pass |

Not testable by me: the Leaflet map tiles, camera capture and GPS (need a real browser and internet), and anything on the live site that needs a login.

---

## 4. Change log (patched code)

| File | Change |
|---|---|
| `backend/utils/token.js` | Production never falls back to a built-in secret |
| `backend/server.js` | Fail fast without `JWT_SECRET` in production; `trust proxy`; CORS limited to `CORS_ORIGIN`; no 500 on blocked origins |
| `backend/routes/analyticsRoutes.js` | `/analytics/map` now admin / department head only |
| `backend/services/grievanceService.js` | Reject unknown categories (400); resolve only from `IN_PROGRESS` |
| `backend/services/authService.js` | Password minimum 8 |
| `backend/.env.example` | Placeholders only (removed your real Supabase project host), documents `JWT_SECRET` and `CORS_ORIGIN` |
| `frontend/pages/auth/Login.jsx` | Demo credentials box only in development or when `VITE_SHOW_DEMO=true` |
| `frontend/pages/auth/Register.jsx` | 8-character rule in the form |
| `README.md` | Added a Production Notes section |

Everything else in your latest version is kept as it was.

---

## 5. Do this in Vercel (in order)

1. **Settings → Environment Variables**, scope Production:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = a random 96-character hex string. Generate with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `CORS_ORIGIN` = `https://jansewa-three.vercel.app`
   - Optional, for a supervised demo only: `VITE_SHOW_DEMO` = `true`
2. Redeploy (the frontend variable is read at build time).
3. Check `https://jansewa-three.vercel.app/api/health` → `"environment":"production"`.
4. **Change the seeded passwords** after the demo, or at least the admin's, because the old one is in your public README and git history. Also remove the credentials table from `README.md` if the repo is public.
5. If the repo is public, **rotate the Supabase project**: the real project host appeared in `.env.example`. The password was not in the file, so this is low risk, but treat the host as exposed.
6. Fix the deep-link 404 (section 2.4) and test by refreshing `/login`.

## 6. Manual test list for after you deploy (10 minutes)

1. Open `/login` directly and refresh it (should not 404).
2. Log in as citizen, file a complaint with a small photo, and note the ID.
3. Open `/track/<that ID>` in a private window. If it says not found, you hit the non-persistent store (P9); retry quickly or explain it.
4. Log in as the department head in another window, assign an officer, then as the officer start work and resolve with a photo.
5. As the citizen, verify and close it.
6. As a citizen, open `/api/analytics/map` in the address bar (it should say authorization required).
7. Confirm the login page does **not** show the demo credentials box (unless you set `VITE_SHOW_DEMO`).

---

## 7. What to say if asked

- "Data is kept in an embedded JSON store for the demo. The Prisma/Supabase schema is prepared and the data layer is isolated in one file, so moving to PostgreSQL is a contained change."
- "Secrets come from environment variables; the server refuses to start in production without them."
- "Access control is enforced on the server for every endpoint, not just hidden in the UI."
