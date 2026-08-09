# GeoTrackHR — Deployment & Testing Guide

This guide deploys the system to free tiers so you can share a live link for
review:

| Piece | Where | Cost | Notes |
|-------|-------|------|-------|
| PostgreSQL | **Render Postgres** (via `render.yaml`) | Free | Created automatically by the Blueprint; free instances expire after 30 days |
| Backend API | **Render** web service (via `render.yaml`) | Free | Spins down after 15 min idle (~1 min cold start) |
| Admin dashboard | **Netlify** | Free | Static Vite build, SPA redirects via `netlify.toml` |
| Mobile app | Debug/Release APK | Free | Built on your machine, shared as a file |

Demo logins (seeded automatically — the seed is idempotent and runs on every
Render deploy, skipping if the database already has users):

- Admin: `admin@geotrackhr.com` / `Admin@123`
- Employees: `james.wilson@demo.com`, `maria.garcia@demo.com`, `robert.chen@demo.com` — all `Employee@123`

---

## 1. Backend + Database — Render (Blueprint)

The repo contains a `render.yaml` Blueprint at the root that deploys **both**
the Postgres database (`geotrackhr-db`) and the API web service
(`geotrackhr-api`) together. No manual DB setup needed.

1. Make sure the `testing` branch is pushed to GitHub:
   ```bash
   git push origin testing
   ```
2. Create a free account at <https://render.com>.
3. **Dashboard → New + → Blueprint** → connect the GitHub repo
   (`Ayodeji90/HR-ATTENDANCE-PORT-AGO`) → select the **`testing`** branch.
   Render reads `render.yaml` and offers to create:
   - `geotrackhr-db` — Postgres (free)
   - `geotrackhr-api` — Node web service (free)
4. During creation Render asks for the env var `CORS_ORIGIN` (it's marked
   `sync: false` in the blueprint). Enter your **Netlify URL**, e.g.
   `https://<your-site>.netlify.app` — scheme + host, **no trailing slash**.
   This step is **optional**: the code default already allows
   `http://localhost:5173` **and** `https://hrportago.netlify.app` (see
   `geotrackhr-backend/src/config/index.ts`); setting `CORS_ORIGIN` overrides
   the default (comma-separated list supported).
   `JWT_SECRET` / `JWT_REFRESH_SECRET` are generated automatically by Render.
5. **Apply / Deploy.** The API becomes live at
   `https://geotrackhr-api.onrender.com` (Render assigns the subdomain from
   the service name; if `geotrackhr-api` is already taken it appends a suffix
   — note your actual URL).

   What happens automatically on the first deploy (configured in the
   blueprint):
   - `buildCommand`: `npm install --workspace geotrackhr-backend --include=dev
     && npm run build`. The `--include=dev` flag is required because Render
     sets `NODE_ENV=production` during builds, which otherwise makes npm skip
     devDependencies (`typescript`, `tsc-alias`, `@types/*`) and the build
     fails. The `--workspace` flag keeps the install scoped to the backend
     (the repo is an npm monorepo — a plain install would also pull the
     react-native app).
   - `startCommand`:
     `NODE_OPTIONS=--no-experimental-detect-module node dist/database/migrate.js
     && NODE_OPTIONS=--no-experimental-detect-module node
     dist/database/seed.js && NODE_OPTIONS=--no-experimental-detect-module node
     dist/server.js` — applies all migrations, inserts demo data (roles, admin
     + employee logins, 2 demo sites), then boots the API. Both steps are
     safe on every start: knex migrations are idempotent, and `seed.js`
     **skips** when the `users` table already has rows (pass `--force` to
     wipe & re-seed) — so a populated database is never touched. Migrations
     and seeding are chained into the start command because Render's
     `preDeployCommand` is **not supported on the free tier**. The
     `NODE_OPTIONS` prefix disables Node's ESM syntax detection
     (defense-in-depth; see Troubleshooting).

6. **Verify:** open `https://geotrackhr-api.onrender.com/api/health` →
   `{"success":true,..."status":"healthy"}`.

> **Notes:**
> - Free web instances spin down after 15 min idle — the first request after
>   a pause takes ~1 min.
> - Free Postgres instances are **deleted 30 days after creation**. If you
>   need the DB to persist longer, upgrade the database plan on Render or
>   switch to a hosted Postgres (e.g. Neon) and set `DATABASE_URL` manually.
> - Uploaded files (photos, leave documents) live on an ephemeral disk and
>   are wiped on redeploy/restart — fine for a demo.

### Environment variables (summary)

| Variable | Set by | Notes |
|----------|--------|-------|
| `NODE_ENV` | Blueprint | `production` |
| `DATABASE_URL` | Blueprint | Auto-wired to `geotrackhr-db` (private network) |
| `DB_SSL_REJECT_UNAUTHORIZED` | Blueprint | `false` — trust Render's self-signed DB cert (required) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Blueprint | `generateValue: true` |
| `CORS_ORIGIN` | Optional | Comma-separated allowlist; defaults to `localhost:5173` + the Netlify URL |
| `PORT` | Render | Injected automatically; `server.ts` already binds `0.0.0.0` |

If you need to change `CORS_ORIGIN` later, edit it in the Render dashboard
(Environment tab → save → triggers a redeploy).

---

## 2. Frontend — Netlify

The repo contains a **root-level** `netlify.toml` that sets
`base = "geotrackhr-frontend"` (so Netlify runs the build **inside** the
frontend package — required because the root `package.json` is a workspaces
aggregator with no `build` script), the build command, publish directory,
and an SPA redirect so deep links (`/login`, `/dashboard`, …) don't 404.

1. Create a free account at <https://netlify.com>.
2. **Add new site → Import an existing project** → connect the GitHub repo.
   The root `netlify.toml` already sets everything (`base` = the frontend
   package, `npm run build`, publish `dist`, SPA redirect) — so leave the UI
   **Base directory** empty (or set it to `geotrackhr-frontend` to match; a
   conflicting value would break the build).
3. **(Optional) Environment variable** (Site settings → Environment
   variables): `VITE_API_BASE_URL` = `https://geotrackhr-api.onrender.com/api`
   (use your **actual** Render URL — the subdomain is only `geotrackhr-api`
   if that name wasn't already taken). The repo already ships
   `geotrackhr-frontend/.env.production` with this exact value, so **no
   dashboard step is required** — a dashboard variable just overrides the
   repo default if you ever set one.
4. **Deploy.** You get `https://<your-site>.netlify.app`.
5. **Verify the connection:** open the Netlify URL, log in with
   `admin@geotrackhr.com` / `Admin@123`, and confirm the dashboard loads data.
   In DevTools → Network, API calls should go to your `*.onrender.com` URL
   (not a relative `/api`).

The dashboard now calls your live backend (CORS is handled by `CORS_ORIGIN`
on Render, which must match the Netlify URL exactly).

---

## 3. Mobile app — build a shareable APK

The `android/` (and `ios/`) native projects are now in the repo — the app was
previously JS-only and couldn't be built. To produce a file a reviewer can
install on their Android phone:

1. **Point the app at your hosted backend** — in
   `geotrackhr-mobile/src/config.ts`, set:

   ```ts
   export const API_BASE_URL: string = 'https://geotrackhr-api.onrender.com/api';
   ```

   (Always HTTPS — Android blocks plain HTTP.)

2. **Install the build tools** (one-time): Android Studio with the Android SDK
   + a JDK 17. Open `geotrackhr-mobile/android` in Android Studio and let
   Gradle sync finish (downloads Gradle + dependencies).

3. **Build the APK**:

   ```bash
   cd geotrackhr-mobile
   npm run build:apk:release        # standalone app-release.apk (JS bundled in)
   ```

   The APK lands in `android/app/build/outputs/apk/release/app-release.apk`.
   (Uses the debug keystore, so it installs on any phone without extra signing
   setup — fine for testing.)

4. **Share**: upload the APK to Google Drive / Dropbox and send the link. The
   reviewer downloads, allows "install unknown apps", and taps Install.

5. Reviewer logs in with one of the employee demo accounts and can check in /
   out using the seeded demo sites (their phone's GPS must be inside a site's
   geofence radius — NYC demo site is 150 m).

> **Debug vs release:** `npm run build:apk` (debug) needs a Metro dev server
> running on your machine, so don't share that one. Always share the release
> APK for standalone testing.

### iOS (optional, needs a Mac)
Open `geotrackhr-mobile/ios` in Xcode, run `pod install` in `ios/`, and build.
The Xcode project keeps the template folder name (`HelloWorld.xcodeproj`) —
harmless; the app name shown is "GeoTrackHR".

---

## Troubleshooting

- **Deploy fails at `knex/lib/migrations/util/import-file.js` with either
  `SyntaxError: Unexpected token '{'` or `The requested module 'knex' does
  not provide an export named 'Knex'`** — **root cause (finally):** knex's
  `DEFAULT_LOAD_EXTENSIONS` includes `'.ts'`, and `path.extname('foo.d.ts')`
  returns `'.ts'` — so the `.d.ts` declaration files tsc emitted next to
  each compiled migration were being loaded **as migrations** and
  `require()`d. Node falls back to its `.js` handler for a `.d.ts` file
  (the `Module._extensions..js` frame), sees TypeScript `import`/`export`
  syntax, and crashes. Both error messages were this same bug.
  Fixed with three layers:
  1. `geotrackhr-backend/tsconfig.json`: `"declaration": false` — tsc no
     longer emits `.d.ts` files at all (a server app doesn't need them);
  2. knexfile production config sets `loadExtensions: ['.cjs']` for both
     migrations and seeds, so knex can only ever load the compiled `.cjs`
     files;
  3. `scripts/to-cjs.js` (last step of the buildCommand) renames compiled
     `.js` → `.cjs` **and deletes** stale `.d.ts` / `.d.ts.map` / `.js.map`
     files from the migrations/seeds dirs.
  The migrate/seed runners log the exact migrations dir + file listing on
  boot (see the `[migrate]` lines), so any future failure shows the real
  server state in the deploy log. Development (`npm run db:migrate` via
  tsx) is unaffected (uses `ts` sources directly).
- **Service restarts in a loop — health checks return `429 Too Many
  Requests`** — the global `express-rate-limit` middleware (100 req/IP/15
  min by default) was registered **before** the `/api/health` route, and
  Render's health check fires every 5 s (~180 req/15 min) — so the health
  check alone exhausted the per-IP budget, the app returned 429s, Render
  classified the service as unhealthy and restarted it (SIGTERM), resetting
  the in-memory counter — repeat forever. Fixed by registering the health
  route **above** the rate limiter in `geotrackhr-backend/src/app.ts`, so
  health checks bypass it entirely. If you ever add another
  infrastructure-polled endpoint, register it before the limiter too.
- **Deploy fails with `DEPTH_ZERO_SELF_SIGNED_CERT`** — Render's Postgres
  uses a self-signed cert on its internal connection string; the blueprint
  sets `DB_SSL_REJECT_UNAUTHORIZED=false` to trust it. If you ever replace
  `DATABASE_URL` with another provider, remove that env var (or set it to
  `true`) so the CA is verified again.
- **Login fails / 401 loop** — confirm `JWT_SECRET`/`JWT_REFRESH_SECRET` are
  set on Render (the server refuses to start in production without them — the
  blueprint generates them, but check they exist in the Environment tab).
- **CORS errors in the browser console** — confirm `CORS_ORIGIN` on Render
  matches the exact Netlify URL (scheme + host, no trailing slash), then
  redeploy.
- **Login fails with `401 INVALID_CREDENTIALS` even with the seeded
  credentials** — the seed is idempotent and runs on **every** deploy inside
  `startCommand` (after migrations), so the next deploy after this change
  will populate the database automatically. If the API was already deployed
  and the DB is still empty, just trigger **Deploy → Deploy latest commit**
  (or push a new commit) and watch the log for `[seed] ... skipping` vs the
  `Seed files run:` line. To seed manually from your machine, use the
  **External Database URL** from the Render Postgres dashboard (the
  blueprint-injected `DATABASE_URL` is private-network only and unreachable
  from a laptop), and leave `NODE_ENV` unset so the runner uses the TS
  migration/seed files:
  ```bash
  cd geotrackhr-backend
  DATABASE_URL="postgres://...@..." npm run db:migrate
  DATABASE_URL="postgres://...@..." npm run db:seed
  ```
  (Add `-- --force` to `npm run db:seed` to wipe and re-seed.)
- **Empty dashboard data** — check that the deploy logs show the migrations
  and seed (`[migrate]` / `[seed]` lines) ran successfully inside
  `startCommand`, and confirm the `users` table isn't empty via the seed's
  "skipping" message on a redeploy.
- **Backend offline** — free Render instances sleep; just wait ~1 min on the
  first request of the day.
- **Netlify fails with `npm error Missing script: "build"`** — the root
  `package.json` has no `build` script (it only has `build:frontend`), so
  the build must run inside `geotrackhr-frontend`. The root `netlify.toml`
  forces this with `base = "geotrackhr-frontend"`. If the error reappears:
  (1) confirm the UI Base directory is empty or `geotrackhr-frontend`;
  (2) delete any leftover `geotrackhr-frontend/netlify.toml` so only the
  root config exists.
- **Netlify build fails with `tsc: command not found`** — don't set
  `NODE_ENV=production` in the Netlify environment variables: it makes npm
  skip devDependencies (`typescript`, `vite`) during install, so the build
  script cannot run.
- **Deep links 404 on Netlify** — make sure the root `netlify.toml` is
  deployed (the SPA redirect lives there).
- **Postgres deleted after 30 days** — free Render Postgres expires; upgrade
  the database plan or move `DATABASE_URL` to another provider (Neon) before
  it happens.
