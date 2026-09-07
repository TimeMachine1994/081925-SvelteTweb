---
Status: Draft
Last verified: 2026-06-24 (against frontend @ TimeMachine1994/081925-SvelteTweb)
Owner: TBD
Sources: frontend/ (SvelteKit app)
---

# V2_DEV_DOCS_FINAL — Authoritative System Documentation

This master folder documents **how the current Tributestream application actually works** — every data type, Firestore collection, API endpoint, integration, and component — and specifies the concrete plan to re-platform the backend while keeping the SvelteKit frontend.

It is the **single source of truth** for the migration. It supersedes the older `frontend/technical-design/` set (see "Deprecated docs" below).

## Why this exists

We are migrating the backend infrastructure. The framework (**SvelteKit 2 / Svelte 5**) stays; the backend services change:

| Concern | Current | Target |
| :--- | :--- | :--- |
| Database | Firestore (NoSQL documents) | **TursoDB** (libSQL / SQLite, relational) |
| Auth | Firebase Auth + custom claims | **Turso-native** (Lucia / Auth.js) — users, sessions, roles in SQL |
| File storage | Firebase Storage | **S3 / R2** (S3-compatible API) |
| Video / livestream | Mux + Daily.co | **Mux + Daily.co** (both kept) |
| Email | SendGrid | **SendGrid** (keep) |
| Payments | Stripe | **Stripe** (keep) |
| Search | Algolia | **Algolia** (reindex from Turso) |
| CDN / last-mile | (Vercel/Firebase) | **Cloudflare** (last-mile HLS delivery + S3 object CDN) |
| Hosting | Vercel | **Vercel** (kept) |
| Query layer | Firestore SDK | **Drizzle ORM** (over libSQL) |

The guiding principle is **abstraction-first**: every backend service is wrapped behind a provider interface (see `05-abstraction-layer-architecture.md`) so providers stay swappable and the migration can proceed incrementally.

## How to read these docs

- Start with `01-system-overview.md` for the big picture.
- `02` and `03` are the data foundation (all types + the Firestore→Turso schema). Read these before any backend work.
- `05` defines the abstraction layer that the rest of the migration builds on.
- `15` is the consolidated decision matrix + sequencing — read it last, act from it.

## Document index

| # | File | What it covers |
| :--- | :--- | :--- |
| 00 | `00-README.md` | This index, verdict legend, doc status |
| 01 | `01-system-overview.md` | Current vs target architecture, stack, migration thesis |
| 02 | `02-data-types-catalog.md` | Every TypeScript type + proposed Turso column types |
| 03 | `03-firestore-to-turso-schema.md` | Collections → SQL schema, ERD, data migration |
| 04 | `04-auth-migration.md` | Firebase Auth + RBAC → Turso-native auth |
| 05 | `05-abstraction-layer-architecture.md` | Provider interfaces (DB/Auth/Storage/Email/Payment/Video) |
| 06 | `06-api-endpoints-catalog.md` | Full `src/routes/api/**` inventory |
| 07 | `07-server-services-and-integrations.md` | `src/lib/server/*` + external integration matrix |
| 08 | `08-storage-migration.md` | Firebase Storage → S3/R2 |
| 09 | `09-media-and-streaming-pipeline.md` | Mux/Daily/Cloudflare stream lifecycle |
| 10 | `10-payments-invoicing-and-email.md` | Stripe + SendGrid + invoices/receipts |
| 11 | `11-search-and-indexing.md` | Algolia indexing |
| 12 | `12-frontend-routes-and-state.md` | Route tree, load/+server, client Firebase coupling |
| 13 | `13-component-and-lib-inventory.md` | `src/lib` components/utils/stores |
| 14 | `14-config-env-and-deployment.md` | Env vars, configs, CI, scripts |
| 15 | `15-migration-decision-matrix.md` | Keep/Migrate/Cut/Rebuild + sequencing |

## Verdict legend

Every doc tags components with one of these:

- **Keep** — framework-native (frontend/UI); no change needed.
- **Migrate** — port data/logic to the new backend with equivalent behavior.
- **Refactor** — keep but decouple from Firebase-specific APIs (route through a provider).
- **Cut** — dead/experimental/duplicate; do not carry forward.
- **Rebuild** — replace with a new implementation on the target stack.

## Doc conventions

- Each doc opens with a front-matter block (`Status`, `Last verified`, `Owner`, `Sources`).
- File paths are cited so docs stay verifiable against source.
- Mermaid diagrams are used for architecture, ERDs, and state machines.
- Each doc ends with a **Migration verdict** section.

## Deprecated docs (retired by this set)

`frontend/technical-design/01..10` are **stale**: they describe a *Next.js → SvelteKit* migration that has already happened (the app is already SvelteKit). Treat them as historical. Where still useful, their content is absorbed here:

- `03-data-model-schema.md` → superseded by `02` + `03` here.
- `04-authentication-authorization-flow.md` → superseded by `04` here.
- `05-api-service-contract.md` → superseded by `06` here.
- `06-component-inventory-migration-plan.md` → superseded by `13` here.

The scattered `frontend/DevDocs/*.md` are point-in-time fix notes, not architecture; not retired, but not authoritative.

## Decisions (confirmed 2026-06-24)

- **Hosting**: **Vercel** (unchanged).
- **Daily.co**: **Keep** — part of a later migration session (multi-cam switcher).
- **Cloudflare**: **Keep** for **last-mile HLS streaming delivery + serving S3 objects** (CDN role, not ingest).
- **Blog + Wiki**: **Cut** for now.
- **Turso query layer**: **Drizzle ORM**.
- **Scope**: the `frontend/` app is the entire system (no separate backend repo).

## Open questions (remaining)

- **reCAPTCHA → Turnstile**: candidate, not committed.
