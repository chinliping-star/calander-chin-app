# Deployment Guide — Railway (backend) + Vercel (frontend)

Reusable checklist built from every bug hit on this project. Run through it
**before** and **after** each deploy. Order matters.

---

## 0. Architecture

```
Browser ──HTTPS──> Vercel (React/Vite static)  ──HTTPS──> Railway (NestJS API) ──> MongoDB Atlas
```

- Frontend: Vercel, built from `Frontend/`
- Backend: Railway, built from `Backend/`
- DB: MongoDB Atlas (cloud)

---

## 1. Backend code requirements (NestJS on Railway)

### 1.1 Listen on Railway's port + all interfaces
`Backend/src/main.ts` MUST be:
```ts
const port = Number(process.env.PORT) || 3000;
await app.listen(port, '0.0.0.0');   // 0.0.0.0, NOT localhost / 127.0.0.1
```
- `0.0.0.0` → Railway can reach the container. `localhost` = 502.
- `process.env.PORT` → Railway injects its own port; never hardcode.

### 1.2 Build must always emit `dist/main.js`
`Backend/tsconfig.json`:
```json
"incremental": false
```
**Why:** with `incremental: true`, `nest build` runs `deleteOutDir` (wipes `dist/`),
then tsc reads the cached `tsconfig.build.tsbuildinfo`, decides "nothing changed,"
and emits NOTHING → no `dist/main.js` → `Cannot find module '/app/dist/main'` crash.
Railway caches build artifacts between deploys, so the stale tsbuildinfo survives.
Keeping incremental off guarantees a full emit every build.

### 1.3 CORS must allow the Vercel origin
`main.ts` — allow your Vercel domain (and preview deploys):
```ts
app.enableCors({
  origin: (origin, cb) => {
    const allowed = (process.env.CLIENT_URL ?? '').split(',').map(o => o.trim());
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) cb(null, true);
    else cb(null, false);
  },
  credentials: true,
});
```
> Note: a 502 from Railway returns NO CORS header, so the browser shows a
> **fake "blocked by CORS policy"** error. If you see CORS errors, FIRST check
> the backend is actually up (curl it) — it's usually a 502 in disguise.

### 1.4 railway.json
```json
{
  "build":  { "builder": "NIXPACKS", "buildCommand": "npm install && npm run build" },
  "deploy": { "startCommand": "npm run start:prod",
              "restartPolicyType": "ON_FAILURE",
              "restartPolicyMaxRetries": 10 }
}
```
- `start:prod` = `node dist/main`
- Retries 10 (not 3): a transient DB hiccup shouldn't permanently kill the app.
  If retries are exhausted, the deploy stays DEAD until you **manually Redeploy**.

---

## 2. Railway dashboard config

### 2.1 Public domain target port — MUST match the app port  ⚠️ #1 gotcha
Railway → service → **Settings → Networking → Public Networking** → domain → ✏️ edit:
- Set the domain's **target port** = the port the app logs on boot
  (`HelloXXX Backend running on port XXXX`).
- If app boots on `8080` but the domain points at `3000` → **502** even though
  the app is "Active / Online". Match them.

### 2.2 Environment variables (Variables tab)
Railway does NOT inherit your local `.env`. Set ALL of these manually:
```
MONGODB_URI            mongodb+srv://...
JWT_SECRET             ...
JWT_REFRESH_SECRET     ...
CLIENT_URL             https://<your-app>.vercel.app   ← exact Vercel URL, for CORS
CLOUDINARY_CLOUD_NAME  ...
CLOUDINARY_API_KEY     ...
CLOUDINARY_API_SECRET  ...
STRIPE_SECRET_KEY      ...        (any service constructed at boot)
CLERK_SECRET_KEY       ...
```
> A single missing var that a service reads at startup (Stripe/Clerk/Mongo)
> throws → boot crash → 502. Check Deploy Logs for the thrown error.

### 2.3 After any env / Atlas change → **Redeploy manually**
Changing a variable or the Atlas whitelist does NOT restart a crashed deploy.
Deployments → newest → ⋮ → **Redeploy**.

---

## 3. MongoDB Atlas

### 3.1 Whitelist Railway  ⚠️ #2 gotcha
Atlas → **Network Access** → **+ ADD IP ADDRESS** → **ALLOW ACCESS FROM ANYWHERE**
→ `0.0.0.0/0` → wait status **Active**.
- Railway IPs are not static, so you can't whitelist one specific IP.
- Symptom if missing: `MongooseServerSelectionError ... IP that isn't whitelisted`
  in Deploy Logs → app crashes on boot → 502.
- `0.0.0.0/0` is fine; the DB is still protected by the user/password in `MONGODB_URI`.

### 3.2 Connection string
`MONGODB_URI` must include the db name and correct user/password. Test boot logs
for `Nest application successfully started`.

---

## 4. Frontend config (Vercel)

### 4.1 vercel.json (repo root) — keep it
```json
{
  "buildCommand": "npm --prefix Frontend install && npm --prefix Frontend run build",
  "outputDirectory": "Frontend/dist",
  "rewrites": [ { "source": "/(.*)", "destination": "/index.html" } ]
}
```
- `rewrites` → SPA deep links (`/friends` refresh) don't 404.
- `buildCommand`/`outputDirectory` → tells Vercel how to build the monorepo subdir.
- Deleting this file breaks routing on refresh and/or the build.

### 4.2 Vercel env var — `VITE_API_URL` MUST end in `/api`  ⚠️ #3 gotcha
Vercel → Project → **Settings → Environment Variables**:
```
VITE_API_URL = https://<your-railway-app>.up.railway.app/api
```
- Must be the Railway URL, NOT `localhost`.
- Must include the `/api` suffix (the NestJS global prefix). Without it every
  call 404s.
- Vite inlines env vars at **build time** → after changing it you MUST
  **redeploy** the frontend (a rebuild), not just save.

---

## 5. Auth / routing (Clerk)

- Never hardcode `redirectUrlComplete: '/onboarding'`. Send post-login to a
  protected route (`/friends`) and let `AuthGuard` decide: existing profile →
  app, no profile → `/onboarding`.
- `/onboarding` must self-guard: on mount, fetch `/users/me/profile`; if a
  profile exists, redirect to the app. Otherwise returning users see the setup
  form again after logout→login.
- Production Clerk: swap the `pk_test_...` dev key for a production instance key
  (dev keys have strict usage limits + the console warning).

---

## 6. Pre-deploy checklist (run every time)

Backend:
- [ ] `main.ts`: `app.listen(process.env.PORT, '0.0.0.0')`
- [ ] `tsconfig.json`: `"incremental": false`
- [ ] `nest build` locally → `dist/main.js` exists
- [ ] CORS allows the Vercel origin / `.vercel.app`
- [ ] `railway.json` start = `node dist/main`, retries 10

Railway:
- [ ] All env vars set (esp. `MONGODB_URI`, `CLIENT_URL`, JWT, 3rd-party keys)
- [ ] Networking domain **target port = app boot port**
- [ ] Latest deploy status **Active**, logs show `successfully started`

Atlas:
- [ ] Network Access has `0.0.0.0/0` **Active**

Vercel:
- [ ] `VITE_API_URL` = Railway URL **+ `/api`**
- [ ] `vercel.json` present (rewrites + build)
- [ ] Redeployed after any env change

---

## 7. Post-deploy verification

```bash
# Backend up? want 200 + JSON, not 502
curl -s -o /dev/null -w "%{http_code}\n" https://<railway>.up.railway.app/api/users/check/anyname

# CORS preflight ok? want 204/200 + access-control-allow-origin header
curl -i -X OPTIONS \
  -H "Origin: https://<your>.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  https://<railway>.up.railway.app/api/users/me/profile
```
Then open the Vercel site, hard-refresh (`Ctrl+Shift+R`) on a deep link
(`/friends`), and confirm the network tab shows `200`s to the Railway `/api`.

---

## 8. Symptom → cause quick table

| Symptom | Real cause | Fix |
|---|---|---|
| `Cannot find module dist/main` | incremental build skipped emit | `incremental: false`, redeploy |
| 502 `x-railway-fallback: true`, app "Active" | domain target port ≠ app port | match ports in Networking |
| 502 + `IP that isn't whitelisted` in logs | Atlas blocks Railway | add `0.0.0.0/0` in Atlas, redeploy |
| Browser "blocked by CORS" but backend down | 502 fallback has no CORS header | fix the 502 first, not CORS |
| Frontend hits `localhost:3000` on prod | `VITE_API_URL` wrong/missing | set Railway URL `+ /api`, redeploy |
| Deep-link refresh 404 on Vercel | missing SPA rewrites | keep `vercel.json` rewrites |
| Crashed deploy never recovers after fix | retry policy exhausted | manual **Redeploy** |
| Existing user sees onboarding after login | hardcoded onboarding redirect / unguarded `/onboarding` | redirect to `/friends`, guard onboarding |
