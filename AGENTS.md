# Agent notes for this repo

- The deployable app is `frontend/`. Run all npm commands from there.
- Verification: `npm run check`, `npm run lint`, `npm run audit:links`, `npm run test:unit`, `npm run build`.
  - `npm run check` has a large pre-existing error baseline (~460). Compare counts before/after rather than expecting zero; do not introduce new errors in files you touch.
  - `npm run audit:links` must report zero missing routes. The root `[fullSlug]` catch-all means typos in static top-level links would otherwise 404 silently at load time.
- Admin routes (`/admin/**`) are guarded by `requireAdmin()` from `$lib/server/adminGuard.ts`; API routes under `/api/admin/**` must check `locals.user` + `hasPermission()` from `$lib/admin/permissions.ts` themselves.
- Never add unauthenticated routes that read the filesystem or mutate Firebase Auth claims (this has happened before — see git history for `/debug/*` and `/webmap/*`).
- Firebase project is `fir-tweb`. Production deploys from `main` via Vercel.
- Docs: `wiki/` is the maintained documentation. `docs/archive/` is historical and may describe code that no longer exists.
- Do not commit database dumps, `.env*` files, `*-debug.log`, or service-account JSON.

## Database (Firestore -> Turso migration in progress)

- Turso/libSQL via Drizzle ORM. Schema: `frontend/src/lib/server/db/schema/*.ts`; migrations: `frontend/drizzle/`; client: `$lib/server/db/client.ts` (`getDb()`).
- Commands (from `frontend/`): `npm run db:migrate` (apply to `TURSO_DATABASE_URL`, default `file:local.db`), `npm run db:seed` (local only), `npm run db:generate` (after schema edits), `npm run test:db` (node-env vitest suite against a temp SQLite file).
- Hand-written SQL (FTS5, triggers) goes in a custom migration: `npx drizzle-kit generate --custom --name <name>` then edit the file.
- Backend selection: `DB_BACKEND=firestore|turso` with per-table `DB_BACKEND_<TABLE>` overrides (`$lib/server/db/backend.ts`). Firebase Auth and Firebase Storage are NOT being replaced.
- Data access should go through `$lib/server/db/repos/*`; do not add new direct `adminDb` call sites. `.svelte` files must not change as part of the migration.
