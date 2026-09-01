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
