# GeoTrackHR — Deployment & Testing Guide

This guide deploys the system to free tiers so you can share a live link for
review:

| Piece | Where | Cost | Notes |
|-------|-------|------|-------|
| PostgreSQL | **Neon** | Free | Persistent, no expiry (0.5 GB / 100 CU-hrs) |
| Backend API | **Render** web service | Free | Spins down after 15 min idle (~1 min cold start) |
| Admin dashboard | **Vercel** | Free | Static Vite build |
| Mobile app | Debug/Release APK | Free | Built on your machine, shared as a file |

Demo logins (seeded):

- Admin: `admin@geotrackhr.com` / `Admin@123`
- Employees: `james.wilson@demo.com`, `maria.garcia@demo.com`, `robert.chen@demo.com` — all `Employee@123`

---

## 1. Database — Neon (Postgres)

1. Create a free account at <https://neon.tech> and create a **project**.
2. In **Connection Details**, copy the **connection string**, e.g.
   `postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`
3. Run the migrations + seed **from your machine** (the code now supports
   `DATABASE_URL`):

   ```bash
   cd geotrackhr-backend
   export DATABASE_URL="postgresql://user:password@ep-xxx...neondb?sslmode=require"
   npm run db:migrate
   npm run db:seed
   ```

   You should see the migrations apply and `Seed files run: [ '001_bootstrap.ts' ]`.

> Keep `DATABASE_URL` — you'll paste it into Render next.

## 2. Backend — Render (web service)

1. Create a free account at <https://render.com>.
2. **New → Web Service** → connect your GitHub repo.
3. Settings:
   - **Root Directory:** `geotrackhr-backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** Free
4. **Environment variables**:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = *(from Neon)*
   - `JWT_SECRET` = a long random string
   - `JWT_REFRESH_SECRET` = a different long random string
   - `CORS_ORIGIN` = `https://<your-frontend>.vercel.app` (add after step 3)
5. Deploy. You'll get a URL like `https://geotrackhr-api.onrender.com`.
   - Verify: open `https://geotrackhr-api.onrender.com/api/health` → `"healthy"`.

> **Notes:** free instances spin down after 15 min idle — the first request
> after a pause takes ~1 min. Uploaded files (photos, leave documents) live on
> an ephemeral disk and are wiped on redeploy/restart — fine for a demo.

## 3. Frontend — Vercel

1. Create a free account at <https://vercel.com>.
2. **Add New → Project** → import the same repo.
3. **Root Directory:** `geotrackhr-frontend`
4. **Build Command:** `npm run build` — **Output Directory:** `dist`
5. **Environment variable**: `VITE_API_BASE_URL` = `https://<your-backend>.onrender.com/api`
6. Deploy → you get `https://<project>.vercel.app`.

The dashboard now calls your live backend (CORS is already configured server-side
via `CORS_ORIGIN`). Log in with the admin demo account and send the link to
your reviewer.

## 4. Mobile app — build a shareable APK

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

- **Login fails / 401 loop** — confirm `JWT_SECRET`/`JWT_REFRESH_SECRET` are set
  on Render (the server refuses to start in production without them).
- **CORS errors in the browser console** — confirm `CORS_ORIGIN` on Render
  matches the exact Vercel URL (scheme + host, no trailing slash).
- **Empty dashboard data** — re-run `db:migrate` + `db:seed` against
  `DATABASE_URL` after creating the Neon project.
- **Backend offline** — free Render instances sleep; just wait ~1 min on the
  first request of the day.
