---
Status: Draft
Last verified: 2026-06-24
Owner: TBD
Sources: src/lib/** (components, ui, tpg, utils, composables, stores, config, design-tokens, admin, data)
---

# 13 — Component & Lib Inventory

Inventory of `src/lib/**` with reusability verdicts. The vast majority is **framework-native UI** that stays; the only work is flagging the few items coupled to Firebase.

## 1. `src/lib` directory map

| Dir | Count | Role | Verdict |
| :--- | :--- | :--- | :--- |
| `components/` | ~142 | feature + presentational Svelte components | **Keep** (audit for Firebase) |
| `ui/` | 8 | base UI primitives | **Keep** |
| `tpg/` | 15 | "TPG" themed components/templates | **Keep** (verify usage) |
| `composables/` | 5 | reactive logic (`.svelte.ts`) | **Keep** (repoint DB reads) |
| `stores/` | 3 | global stores | **Keep** |
| `config/` | 3 | `pricing` (`TIER_PRICES`), etc. | **Keep** |
| `design-tokens/` | 3 | colors/typography tokens | **Keep** |
| `styles/` | 1 | global styles | **Keep** |
| `data/` | 1 | static data | **Keep** (review) |
| `admin/` | 6 | `permissions.ts` (RBAC) + admin helpers | **Keep** |
| `types/` | 17 | TS types (see `02`) | **Migrate** (Turso column types) |
| `server/` | 21 | server services (see `07`) | mixed (see `07`) |
| `assets/` | 1 | static assets | **Keep** |
| `test-utils/` | 2 | test helpers | **Keep** |
| `auth.ts`, `firebase.ts`, `firebase-admin.ts` | — | auth store + Firebase init | store **Keep**; firebase init **Cut** |

## 2. Components needing attention (Firebase-coupled)

| Component / area | Coupling | Action |
| :--- | :--- | :--- |
| `MemorialStreamDisplay.svelte` | `firebase/firestore` `onSnapshot` (realtime) | **Rebuild** → SSE/polling (`09`) |
| Auth forms (login/register components) | client Firebase Auth | **Rebuild** (`04`) |
| Photo/slideshow upload components | client Firebase Storage | **Rebuild** → presigned URLs (`08`) |
| Any component importing `$lib/firebase` `db` | client Firestore reads | **Refactor** → fetch from endpoints |

> Initial scan: components are largely free of direct Firestore usage (only `MemorialStreamDisplay.svelte` matched `onSnapshot`). A full `from 'firebase/'` grep across `components/`, `composables/`, `stores/` is the definitive audit (tracked in `12`).

## 3. Third-party UI deps (Keep)

TailwindCSS v4, Skeleton (`@skeletonlabs/skeleton(-svelte)`), `lucide-svelte`/`@lucide/svelte`, `driver.js` + `shepherd.js` (product tours), `svelte-dnd-action` (block editor reorder), `mermaid` (showcase diagrams), `canvas-confetti`, `marked` (markdown). All framework-native; no migration impact.

## 4. Pricing config

`src/lib/config/pricing` (`TIER_PRICES`, `TIER_FEATURES`, `CustomPricing`) is the **canonical** pricing source; the `TIER_PRICING` in `types/livestream.ts` is **deprecated**. Keep config; remove the deprecated constant during cleanup.

## Migration verdict

- **Keep** essentially all of `src/lib` UI (components/ui/tpg/stores/composables/config/design-tokens).
- **Refactor** components/composables/stores that read Firestore directly to call server endpoints.
- **Rebuild** the handful of realtime/auth/upload components.
- **Cut** `firebase.ts`/`firebase-admin.ts` init after migration; remove deprecated `TIER_PRICING`.
- **Do**: run the definitive client-Firebase grep to finalize the affected-component list.
