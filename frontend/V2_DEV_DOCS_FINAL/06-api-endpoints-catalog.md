---
Status: Draft
Last verified: 2026-06-24
Owner: TBD
Sources: src/routes/api/** (+server.ts), src/routes/**/+page.server.ts (actions)
---

# 06 — API Endpoints Catalog

Inventory of the server API surface under `src/routes/api/**` (~116 directory entries; the rest of server logic lives in `+page.server.ts` `load`/`actions`). Each group lists purpose, auth, data touched, external calls, and the **provider abstraction** it should route through post-migration (`05`).

> Auth model today: `event.locals.user` from `hooks.server.ts`; admin endpoints additionally gate on `role==='admin'` / `adminGuard`. Post-migration the same `locals.user` populates from Turso sessions.

## Group: `api/admin/*` (27 entries) — **Refactor**

Admin operations, all require `role==='admin'` (+ RBAC where applicable).

| Endpoint | Purpose | Data | External |
| :--- | :--- | :--- | :--- |
| `admin/stats` | dashboard counts | users, memorials | — |
| `admin/users`, `users/[uid]/suspend`, `[uid]/activate` | user mgmt | users, admin_actions | adminAuth |
| `admin/create-memorial`, `delete-memorial`, `toggle-memorial-status` | memorial mgmt | memorials | — |
| `admin/memorials/[id]/pricing`, `display-settings` | overrides | memorials | — |
| `admin/memorials/[memorialId]/streams/[streamId]/recordings` | manage VOD list | streams | Mux |
| `admin/toggle-payment-status` | mark paid/unpaid | memorials | — |
| `admin/invoices` | list/create invoices | invoices | Stripe |
| `admin/receipts/[receiptId]/note` | receipt notes | memorials/invoices | — |
| `admin/delete-funeral-director`, `update-funeral-director` | FD mgmt | funeral_directors | adminAuth |
| ~~`admin/blog`~~ | blog CRUD | blog | — | **Cut** (blog removed) |
| `admin/audit-logs`, `email-logs`, `email-logs/[id]`, `[id]/resend` | logs | admin_actions, email_audit | SendGrid (resend) |
| `admin/bulk-actions`, `cleanup-expired` | batch ops | various | — |
| `admin/database` | raw DB admin (`adminDatabase.ts`) | all | — |
| `admin/switcher/broadcast`, `switcher/invite` | multi-cam switcher | streams | Daily.co — **Keep** (later session) |
| `admin/set-admin-claim`, `set-role-claim` (under api/) | claims | adminAuth | **Rebuild (04)** |

→ Route through `services.users` / `services.memorials` / `services.invoices` / `services.video` / `services.email`. Switcher endpoints depend on Daily.co — **Keep** (Daily.co retained; migrated in a later session). `admin/blog` is **Cut** (blog removed).

## Group: `api/memorials/*` (27 entries) — **Refactor**

`memorials/[memorialId]/**` (25 sub-entries) covers the memorial detail operations: blocks (CRUD/reorder — see `memorial-blocks.ts`), schedule, payment, slideshows, streams, followers, chat, embeds. Plus `memorials/[id]`, `memorials/search`.

| Representative | Purpose | Provider target |
| :--- | :--- | :--- |
| `[memorialId]/blocks` (+ `[blockId]`, `reorder`) | block editor CRUD | `services.memorials` (memorial_blocks) |
| `[memorialId]/streams` | list/create streams | `services.streams` + `services.video` |
| `[memorialId]/slideshows` | slideshow CRUD | `services.memorials` + `services.storage` |
| `[memorialId]/followers` | follow/unfollow | `services.memorials` |
| `[memorialId]/payment` / `paid` | payment status | `services.payment` |
| `memorials/search` | search proxy | `services.search` (Algolia) |

## Group: `api/streams/[streamId]/*` (13 entries) — **Refactor/Keep**

Stream lifecycle + chat. Includes Mux live-stream control, status, recordings, and **chat messages** (Firestore-backed today since Mux has no chat API).

| Representative | Purpose | External |
| :--- | :--- | :--- |
| `[streamId]` | get/update stream | — |
| `[streamId]/start`, `stop`, `status` | lifecycle | Mux |
| `[streamId]/recordings` | VOD list | Mux |
| `[streamId]/chat/messages` (+ moderation) | live chat | Firestore→Turso/realtime |

→ Stream control via `services.video` (Mux). Chat via `services.chat` (needs realtime strategy — see `09`).

## Group: `api/webhooks/*` (3) — **Keep (rewire)**

| Endpoint | Source | Action |
| :--- | :--- | :--- |
| `webhooks/mux` | Mux | verify signature (`verifyMuxWebhookSignature`), update stream/recording status |
| `webhooks/stripe` | Stripe | verify signature, mark invoices/memorials paid |
| `webhooks/test-live` | internal test | **Cut** candidate |

→ Keep handlers; swap their DB writes to repositories. Webhook signature verification stays (Mux/Stripe).

## Group: payments — **Keep**

| Endpoint | Purpose | External |
| :--- | :--- | :--- |
| `api/create-payment-intent` | Stripe PaymentIntent | Stripe |
| `api/check-payment-status` | poll status | Stripe |
| `api/invoices`, `invoices/[...]` | invoice create/fetch | Stripe |

## Group: email — **Keep**

`api/send-confirmation-email`, `send-action-required-email`, `send-failure-email`, `confirm-email-change`, `contact`, `book-demo` → SendGrid via `server/email.ts`; all should log to `email_audit`.

## Group: auth — **Rebuild** (see `04`)

`api/session`, `api/set-admin-claim`, `api/set-role-claim`, `api/password-reset`, `api/validate-reset-token`, `api/reset-password-confirm`.

## Group: funeral-director (6) — **Refactor**

FD registration/management endpoints → `services.users` + `services.memorials`.

## Group: slideshow (6) — **Refactor**

Slideshow generation/upload endpoints → `services.storage` (S3/R2) + `services.memorials`.

## Group: blog — **Cut**

`admin/blog` (+ any `/blog` content endpoints) → **Cut**; the blog feature is removed.

## Group: misc / dev — **Cut candidates**

| Endpoint | Note |
| :--- | :--- |
| `api/debug/*` (5) | debugging — **Cut** in prod |
| `api/dev/*` (1) | dev-only — **Cut** |
| `api/proxy` | generic proxy — review/**Cut** |
| `api/google-reviews` | Google Places reviews — **Keep** if used on marketing pages |
| `api/upload-image` | admin image upload to Firebase Storage → **Migrate** to S3/R2 |
| `api/user/*` (2) | profile ops — **Refactor** |

## Cross-cutting concerns

- **Rate limiting**: `src/lib/server/rate-limiter.ts` — applies to some endpoints (contact, auth). Keep; ensure it works on the new host.
- **Audit**: `auditLogger.ts`/`auditMiddleware.ts` exist but audit middleware is **disabled** in `hooks.server.ts` (only `authHandle` is active). Decide whether to re-enable post-migration.
- **Geo-filter**: `server/geo-filter.ts` — region gating; keep if used.

## Migration verdict

- **Refactor** all data-touching endpoints to call repositories/providers instead of `adminDb`/`adminStorage` directly (mechanical once `05` exists).
- **Rebuild** the auth/session/claims endpoints on Turso.
- **Keep** payment/email/webhook/search endpoints; only swap their persistence + rewire webhook DB writes.
- **Keep** Daily.co switcher endpoints (`admin/switcher/*`) — Daily.co is retained (later migration session).
- **Cut** `debug/*`, `dev/*`, `webhooks/test-live`, and the blog endpoints (`admin/blog`).
