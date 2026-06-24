---
Status: Draft
Last verified: 2026-06-24
Owner: TBD
Sources: .env.example, svelte.config.js, vercel.json, apphosting.emulator.yaml, .firebaserc, firestore.rules, storage.rules, .github/workflows/test.yml, scripts/, package.json
---

# 14 — Config, Env & Deployment

Configuration, environment variables, and deployment surface — and what re-platforming touches.

## 1. Environment variables

### Current (`.env.example` + code)

| Var | Used by | Fate |
| :--- | :--- | :--- |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | `firebase-admin.ts` | **Remove** |
| `PUBLIC_FIREBASE_*` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) | client `firebase.ts` | **Remove** |
| `PUBLIC_USE_PRODUCTION`, `PUBLIC_NODE_ENV` | client Firebase toggle | **Remove/replace** |
| `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET` | `mux.ts` | **Keep** |
| `STRIPE_SECRET_KEY` (+ publishable, webhook secret) | `stripe.ts`, webhooks | **Keep** |
| `SENDGRID_API_KEY`, `FROM_EMAIL`, `SENDGRID_TEMPLATE_*` (9) | `email.ts` | **Keep** |
| `ALGOLIA_APP_ID`, `ALGOLIA_*_KEY` | `algolia.ts` | **Keep** |
| `PRIVATE_DAILY_API_KEY`, `PUBLIC_DAILY_DOMAIN` | `daily.ts` | **Keep** (Daily.co retained) |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Cloudflare CDN (last-mile HLS + S3 object serving) | **Keep** |
| `CLOUDFLARE_WEBHOOK_SECRET` | legacy Cloudflare Stream ingest | **Cut** |
| `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` | reviews | **Keep** if used |
| `PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` | forms | **Keep** / → Turnstile |

### New (target)

| Var | For |
| :--- | :--- |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | TursoDB / libSQL |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | S3 / R2 |
| `SESSION_SECRET` (or Lucia/Auth.js config) | Turso-native sessions |
| `DB_DRIVER`, `STORAGE_DRIVER` | provider factory selection during cutover (`05`) |
| `S3_PUBLIC_BASE_URL` / Cloudflare CDN domain | resolving public object URLs via Cloudflare in front of S3/R2 |

## 2. Build & framework config

- `svelte.config.js`: `@sveltejs/adapter-vercel`, `maxDuration: 60` (for video upload endpoints). If hosting changes (Cloudflare), swap adapter → `adapter-cloudflare`; note **edge runtime constraints** (Node APIs, `Buffer`, AWS SDK compatibility) for providers.
- `vite.config.ts`, `postcss.config.js`, `tailwind.config.js`, `tsconfig.json`: standard; **Keep**.
- `vitest.config.ts`, `playwright.config.ts` (+ production variant): tests; **Keep** (update for Turso).

## 3. Firebase-specific config (retire)

- `.firebaserc`, `firestore.rules`, `storage.rules`, `apphosting.emulator.yaml`, `firebase-debug.log`, `firestore-debug.log` → **Cut** after migration. The **rules logic** must be ported to server-side authz first (`03 §5`, `04`).
- **Blog + Wiki are Cut**: drop their routes (`/blog`, admin blog), `blog`/`wiki_*` rules blocks, FireCMS config, `wiki.ts` types, and skip their tables in the Turso schema.

## 4. Hosting

- **Decision: stay on Vercel** (`adapter-vercel`, `vercel.json`) — confirmed. Vercel works with Turso (libSQL over HTTP) + S3/R2.
- **Cloudflare** is used as the **CDN / last-mile** layer in front of HLS delivery and S3/R2 objects (DNS/CDN config), **not** as the application host. No SvelteKit adapter change needed.
- Keep `maxDuration: 60` for upload endpoints (or move large uploads to presigned direct-to-bucket, see `08`).

## 5. CI/CD

- `.github/workflows/test.yml`: runs the test suite. Update to provision a Turso test DB (or libSQL local file) instead of Firebase emulators.
- Firebase emulator usage (`test:emulator`, `apphosting.emulator.yaml`, emulator wiring in `firebase.ts`) → **Cut**; replace with a local libSQL file / Turso branch for tests.

## 6. Scripts (`scripts/` + root)

Many one-off Firebase scripts exist (`backfill-algolia.ts`, `create-admin*`, `seed-dev-users.js`, `clean-test-data.js`, `add-test-memorials.js`, plus numerous root `.js`/`.sh` debug/setup files). Verdicts:
- `backfill-algolia.ts` → **Rewrite** to source from Turso (`11`).
- admin/seed scripts → **Rewrite** against Turso + new auth.
- Firebase/Cloudflare debug shell scripts (`check-*.sh`, `test-*.sh`, `fix-*.js`, `debug-*.js`) → **Cut**.
- **NEW** scripts needed: Firestore→Turso export/transform/load (`03 §6`), Storage→S3/R2 copier (`08`), Firebase user export → users table (`04`).

## Migration verdict

- **Keep** build/test framework configs (update adapters/test DB).
- **Remove** all Firebase + (likely) Daily/Cloudflare env vars; **add** Turso + S3/R2 + session vars.
- **Cut** Firebase rules/emulator config (after porting authz server-side) and obsolete debug scripts.
- **Decide** hosting (Vercel vs Cloudflare) — affects adapter + edge constraints.
