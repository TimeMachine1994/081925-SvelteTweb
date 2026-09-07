---
Status: Draft
Last verified: 2026-06-24
Owner: TBD
Sources: src/lib/server/algolia.ts, src/lib/server/algolia-indexing.ts, scripts/backfill-algolia.ts, src/routes/api/memorials/search, src/routes/search
---

# 11 — Search & Indexing (Algolia)

Algolia powers memorial search; it is **kept**. The only change is that index records are sourced from **Turso** instead of Firestore, and indexing triggers fire from repositories.

## 1. Current setup

- `algolia.ts`: creates the Algolia v5 `client` from env (`ALGOLIA_APP_ID`, admin/search keys). Gracefully `null` if unconfigured (indexing no-ops).
- `algolia-indexing.ts`: index name **`memorials`**.
  - `indexMemorial(memorial)` → saves `{ objectID: id, lovedOneName, fullSlug, createdAt }`.
  - `removeMemorialFromIndex(id)` → deletes object.
- Triggers: called from memorial create/update/delete flows (e.g. `register/loved-one`, admin memorial ops).
- Query surface: `routes/search` (UI) + `api/memorials/search` (proxy); public memorial discovery.
- Backfill: `scripts/backfill-algolia.ts` re-indexes all memorials.

## 2. Indexed fields

Minimal record today: `objectID`, `lovedOneName`, `fullSlug`, `createdAt`. (Comment in code notes "add other searchable fields" — currently not done.)

## 3. Migration impact

- **`SearchProvider`** (`05`) wraps `indexMemorial`/`removeMemorialFromIndex`.
- **Trigger relocation**: repositories call `services.search.index(memorial)` on create/update and `.remove(id)` on delete — instead of ad-hoc calls scattered across endpoints. This guarantees the index stays in sync with Turso.
- **Backfill rewrite**: `backfill-algolia.ts` reads from **Turso** (`services.memorials.listAll()`) instead of Firestore.
- **No data migration** for Algolia itself — just re-run backfill after the Turso cutover.
- Algolia is **optional/graceful** today; keep that resilience (no-op if keys absent).

## 4. Alternatives (not required, informational)

If consolidating providers later: Turso/SQLite has **FTS5** full-text search built in, which could replace Algolia for simple name/slug search at lower cost. Given Algolia works and is low-coupling, **keep it for now**; revisit FTS5 only if cost/consolidation matters.

## Migration verdict

- **Keep** Algolia; wrap in `SearchProvider`.
- **Refactor** indexing triggers into repositories; **rewrite** backfill to source from Turso.
- **Optional/Future**: evaluate SQLite FTS5 to drop the Algolia dependency.
