# Tributestream

Memorial livestreaming platform — https://tributestream.com

## Repository layout

| Path | Purpose |
| --- | --- |
| `frontend/` | The SvelteKit application (public site, family/FD portals, admin dashboard, API routes). This is what gets deployed. |
| `scripts/` | One-off operational scripts (memorial imports, migrations, admin setup). Has its own `package.json`. |
| `wiki/` | Curated technical documentation (auth flow, data models, livestream integration, admin dashboard). Start here. |
| `docs/` | Setup guides (reCAPTCHA, testing). `docs/archive/` holds historical planning/implementation notes — reference only, not maintained. |
| `firebase.json`, `firestore.rules`, `firestore.indexes.json` | Firebase project config (project: `fir-tweb`). |

## Stack

SvelteKit 2 / Svelte 5 · Tailwind 4 + Skeleton · Firebase Auth + Firestore + Storage · Mux (live video) · Daily.co (multi-camera switcher) · Stripe · SendGrid · Algolia · Vercel (hosting)

## Development

```sh
cd frontend
cp .env.example .env      # fill in credentials
npm install
npm run dev
```

## Verification

Run from `frontend/`:

| Command | What it does |
| --- | --- |
| `npm run check` | svelte-check type checking |
| `npm run lint` | prettier + eslint |
| `npm run audit:links` | Fails if any internal `href`/`goto`/`redirect` points at a route that doesn't exist |
| `npm run test:unit` | vitest unit tests |
| `npm run test:e2e` | Playwright against a local dev server |
| `npm run test:smoke` | Playwright smoke tests against production (also runs every 6h via GitHub Actions) |
| `npm run build` | Production build |

## Deployment

Vercel builds `frontend/` from the production branch (`main`). Firebase rules are deployed separately with `firebase deploy --only firestore:rules,storage`.

Rollback reference: tag `prod-pre-cleanup-2026-09-01` marks the last production commit before the September 2026 cleanup.
