---
Status: Draft
Last verified: 2026-06-24
Owner: TBD
Sources: src/routes/** , src/lib/firebase.ts, src/lib/stores/*, src/lib/composables/*, src/lib/components/MemorialStreamDisplay.svelte
---

# 12 — Frontend Routes & State

The SvelteKit frontend (routes, layouts, stores) is **kept**. The critical migration concern is **client-side Firebase coupling**: because Turso is server-only, every direct browser Firestore/Storage/Auth call must move behind server endpoints.

## 1. Route tree (top-level under `src/routes/`)

| Area | Routes | Notes |
| :--- | :--- | :--- |
| Marketing | `/`, `how-it-works`, `why-tributestream`, `for-families`, `for-funeral-directors`, `pricing`, `pricing-breakdown`, `partnership`, `contact`, `book-demo`, `emergency`, `search` | mostly static + `load` |
| Blog | `/blog/*` | **Cut** (blog removed) |
| Memorial (public) | `[fullSlug]`, `tributes/[fullSlug]`, `memorials` | server `load` from Firestore |
| Auth | `login`, `logout`, `register/*` (8), `reset-password`, `clear-session`, `auth` | **Rebuild** (04) |
| Family portal | `my-portal`, `profile`, `schedule/*` (8), `payment/*`, `pay/*`, `receipt` | authed `load` + actions |
| FD | `funeral-director`, `register/funeral-*` | FD flows |
| Admin | `admin/*` (45) | RBAC-guarded loaders/actions |
| Streaming | `stream`, `camera`, `hls`, `whep`, `test-stream`, `slideshow-generator` | Mux/Daily playback + ingest |
| Dev/demo | `showcase` (73), `theme-showroom`, `homepage-minimal-modern-example`, `memorial-example`, `debug`, `dev`, `sigma`, `tpg`, `webmap`, `admin-test` | **Cut candidates** (non-product) |
| API | `api/**` | see `06` |

> `showcase/` is an internal UI tour (not customer-facing) — keep as a dev aid or **Cut** for production.

## 2. Data loading pattern

- **Server `load`** (`+page.server.ts`) is the dominant pattern: reads Firestore via `adminDb` and returns serializable data. These are **Refactor** targets — swap `adminDb` for `locals.services.*` repositories. Behavior unchanged.
- **`App.PageData.user`** flows from `hooks.server.ts` → layouts; keep shape stable (`04`).
- **Form actions** handle mutations (register, schedule, admin ops) — refactor to repositories.

## 3. Client-side Firebase coupling (the risk)

Client `src/lib/firebase.ts` initializes Firebase **Auth + Firestore + Storage** in the browser (with emulator wiring) and exports `auth, db, storage`. Direct client DB usage is **limited but present**:

| Coupling | Where | Action |
| :--- | :--- | :--- |
| Realtime stream/chat (`onSnapshot`) | `components/MemorialStreamDisplay.svelte` | **Rebuild** → SSE/polling endpoint (`09`) |
| Client Auth sign-in | `login`, `register/*` | **Rebuild** → server actions (`04`) |
| Client Storage uploads | memorial photo / slideshow components | **Rebuild** → presigned URLs (`08`) |
| Any `db` (Firestore client) reads | audit needed across components/composables/stores | **Refactor** → fetch from server endpoints |

> **Action item**: a full grep of `from 'firebase/*'` across `src/lib/components`, `src/lib/composables`, `src/lib/stores`, and `src/routes/**/+page.svelte` is required to enumerate every client coupling before cutover. Initial scan shows components are mostly clean (only `MemorialStreamDisplay.svelte` uses `onSnapshot`), which is encouraging.

## 4. Stores & composables

- `src/lib/stores/*` (3), `src/lib/composables/*` (5): client reactive state. Likely **Keep**, but any that wrap Firestore reads must be repointed at server endpoints.
- `src/lib/auth.ts` `user` writable store: **Keep**, repopulate from `PageData.user`.

## 5. Post-migration data-flow rule

```
Browser → fetch(/api/...) or load() → SvelteKit server → services.* (repositories) → Turso/S3/Mux
```
No browser → database path exists after migration. This is the single most important structural change for the frontend.

## Migration verdict

- **Keep** the route structure, layouts, components, and most stores.
- **Refactor** all `+page.server.ts` loaders/actions to use `locals.services.*`.
- **Rebuild** the few client-side Firebase usages (realtime chat, auth, uploads) as server-mediated flows.
- **Cut** non-product routes (`debug`, `dev`, `sigma`, `webmap`, `*-example`, `theme-showroom`; `showcase` optional).
- **Do**: complete the client-Firebase-usage grep before cutover.
