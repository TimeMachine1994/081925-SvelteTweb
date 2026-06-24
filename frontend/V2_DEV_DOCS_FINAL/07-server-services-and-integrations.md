---
Status: Draft
Last verified: 2026-06-24
Owner: TBD
Sources: src/lib/server/*.ts, .env.example, package.json
---

# 07 — Server Services & External Integrations

Inventory of `src/lib/server/*` modules and the external services they wrap, each mapped onto the provider interfaces from `05` with an env-var matrix and verdict.

## 1. `src/lib/server/*` module inventory

| Module | Role | Maps to provider | Verdict |
| :--- | :--- | :--- | :--- |
| `firebase.ts` | exports `adminDb`, `adminAuth`, `adminStorage` (Admin SDK init) | DB/Auth/Storage (current impls) | **Cut** after migration |
| `adminDatabase.ts` (10 KB) | higher-level Firestore data-access helpers | `db` repositories | **Rebuild** on Turso |
| `mux.ts` | Mux live-stream create/get/delete, analytics, webhook verify | `VideoProvider` | **Keep** |
| `daily.ts` | Daily.co rooms + meeting tokens (multi-cam switcher) | `VideoProvider` (alt) | **Keep** (later session) |
| `stripe.ts` | lazy Stripe client (Proxy), apiVersion `2025-08-27.basil` | `PaymentProvider` | **Keep** |
| `email.ts` (58 KB) | SendGrid templates + all transactional sends | `EmailProvider` | **Keep / Refactor** (large) |
| `emailAudit.ts` | writes `email_audit` records | `db` (email_audit repo) | **Refactor** |
| `emailConfirmation.ts` | email-change confirmation tokens | `db` + email | **Refactor** |
| `algolia.ts` + `algolia-indexing.ts` | Algolia client + `indexMemorial`/`removeMemorialFromIndex` (index `memorials`) | `SearchProvider` | **Keep / Refactor** |
| `auditLogger.ts` + `auditMiddleware.ts` | user-action audit (currently **disabled** in hooks) | `db` (admin_actions) | **Refactor** (decide re-enable) |
| `adminGuard.ts` | RBAC route guards | — (uses `locals`) | **Keep** |
| `rate-limiter.ts` | in-memory/(?) rate limiting | — | **Keep** (verify on new host) |
| `geo-filter.ts` | region/geo gating | — | **Keep** if used |
| `*.test.ts` | unit tests for admin/audit/memorial middleware | — | **Keep** (update for Turso) |

## 2. External integration matrix

| Service | Used for | Key client/init | Env vars | Coupling | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Firebase Admin** | DB, Auth, Storage | `firebase-admin.ts` (`projectId: 'fir-tweb'`, `FIREBASE_SERVICE_ACCOUNT_KEY` or ADC) | `FIREBASE_SERVICE_ACCOUNT_KEY` | Deep (everywhere) | **Cut** (replaced by Turso/S3) |
| **Firebase Web SDK** | client auth + Firestore reads | `src/lib/firebase.ts` | `PUBLIC_FIREBASE_*` | Client-side reads | **Cut** post-migration |
| **TursoDB** | NEW database | libSQL/Drizzle | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (NEW) | target | **Rebuild** |
| **S3 / R2** | NEW storage | AWS SDK / S3-compatible | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (NEW) | target | **Migrate** |
| **Mux** | live stream + VOD | `mux.ts` (`@mux/mux-node`) | `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET` | Medium | **Keep** |
| **Daily.co** | multi-cam switcher rooms | `daily.ts` | `PRIVATE_DAILY_API_KEY`, `PUBLIC_DAILY_DOMAIN` | Low (switcher only) | **Keep** (later session) |
| **Cloudflare** | **last-mile HLS delivery + S3 object CDN** | CDN config (not in app code yet) | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | CDN edge | **Keep** (CDN role) |
| Cloudflare Stream (legacy ingest fields) | legacy `Stream` fields | (refs in `stream.ts`) | `CLOUDFLARE_WEBHOOK_SECRET` | Legacy | **Cut** (legacy fields only) |
| **Stripe** | payments, invoices | `stripe.ts` | `STRIPE_SECRET_KEY`, (publishable + webhook secret) | Medium | **Keep** |
| **SendGrid** | transactional email | `email.ts` | `SENDGRID_API_KEY`, `FROM_EMAIL`, `SENDGRID_TEMPLATE_*` (9 templates) | Medium | **Keep** |
| **Algolia** | memorial search | `algolia.ts` | `ALGOLIA_APP_ID`, `ALGOLIA_*_KEY` | Low | **Keep** |
| **Google Places** | business reviews | `api/google-reviews` | `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` | Low | **Keep** if used |
| **reCAPTCHA v3** | bot protection | forms | `PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` | Low | **Keep** / → Turnstile |

## 3. Notable implementation details

- **Lazy init pattern**: `mux.ts`, `stripe.ts` lazily construct clients via getters/Proxy reading `$env/dynamic/private`. Good — replicate for new providers (works well on serverless/edge).
- **Mux specifics**: live streams created with `playback_policy: ['public']`, auto-recording (`new_asset_settings.mp4_support: 'standard'`), `reconnect_window` default 60s, `reduced_latency`. RTMP ingest `rtmps://global-live.mux.com:443/app`. Webhook verify via `mux.webhooks.verifySignature` (throws on invalid).
- **Mux Data analytics NOT configured** — `getMuxAnalytics` returns placeholders; `StreamAnalytics` is aspirational.
- **Chat is Firestore-only** (Mux has no chat API) — biggest realtime gap when leaving Firestore (see `09`).
- **Daily.co** creates rooms with `enable_recording: 'cloud'`, `owner_only_broadcast: true` — used by the admin multi-cam switcher. **Kept** (its own migration session); wrap behind `VideoProvider` alongside Mux.
- **Cloudflare** will serve as the **CDN/last-mile** layer: HLS segment delivery and S3 object serving sit behind Cloudflare. This is infra config (DNS/CDN), not app code — Mux remains the live ingest, S3/R2 the origin.
- **Algolia** indexes only `{ objectID, lovedOneName, fullSlug, createdAt }` for the `memorials` index; gracefully no-ops if unconfigured.
- **email.ts is large (58 KB)** — contains all templates/logic; a prime **Refactor** target to split per `EmailType`.

## Migration verdict

- **Keep & wrap** Mux, **Daily.co**, Stripe, SendGrid, Algolia behind thin providers (`05`).
- **Keep** Cloudflare as the CDN/last-mile layer (HLS delivery + S3 object serving).
- **Cut** Firebase Admin/Web SDK and legacy Cloudflare **Stream ingest** fields only.
- **Rebuild** `adminDatabase.ts` as Turso (Drizzle) repositories; **Refactor** `email.ts`/`emailAudit.ts`/audit modules to use repositories.
- **Decide**: re-enable audit middleware? swap reCAPTCHA→Turnstile?
