# Dev Mode Bar System - Files for Removal

**Purpose:** This document lists all files, functions, and references related to the Dev Mode bar system in preparation for complete removal.

**Date Created:** January 8, 2026

---

## Overview

The codebase contains **two dev/demo bar systems**:

1. **DevRoleSwitcher** - Red bar for local development with hardcoded test accounts
2. **DemoModeBanner** - Purple gradient bar for sandboxed demo sessions

---

## Files to Delete

### Primary Components

| File | Description |
|------|-------------|
| `src/lib/components/DevRoleSwitcher.svelte` | Main dev role switcher component (red bar) |
| `src/lib/components/DevRoleSwitcher.test.ts` | Unit tests for DevRoleSwitcher |
| `src/lib/components/demo/DemoModeBanner.svelte` | Demo mode banner component (purple bar) |

### API Routes

| File | Endpoint | Description |
|------|----------|-------------|
| `src/routes/api/demo/session/+server.ts` | `POST /api/demo/session` | Creates demo session with 4 users |
| `src/routes/api/demo/session/[id]/+server.ts` | `GET /api/demo/session/[id]` | Gets session status/time remaining |
| `src/routes/api/demo/switch-role/+server.ts` | `POST /api/demo/switch-role` | Switches roles within demo session |
| `src/routes/api/demo/cleanup/+server.ts` | `GET/POST /api/demo/cleanup` | Cleans up expired demo sessions |

### Type Definitions

| File | Description |
|------|-------------|
| `src/lib/types/demo.ts` | Core demo interfaces (DemoSession, DemoUser, SwitchRoleRequest, etc.) |
| `src/lib/types/demo-data.ts` | Demo data templates and scenario definitions |

### Server Utilities

| File | Description |
|------|-------------|
| `src/lib/server/demo/seedData.ts` | Demo data seeding functions for memorials, streams, condolences |

---

## Files to Modify

### Layout (Remove Imports & Component Usage)

**File:** `src/routes/+layout.svelte`

**Lines to remove:**
```svelte
// Line 6 - Import
import DevRoleSwitcher from '$lib/components/DevRoleSwitcher.svelte';

// Line 7 - Import
import DemoModeBanner from '$lib/components/demo/DemoModeBanner.svelte';

// Lines 32-35 - Demo banner conditional
{#if data.user?.isDemo}
  <DemoModeBanner />
{/if}

// Line 37 - DevRoleSwitcher component
<DevRoleSwitcher />

// Line 49 - CSS class reference
class:demo-mode={data.user?.isDemo}
```

### Logout Route (Remove Dev Flag Handling)

**File:** `src/routes/logout/+server.ts`

**Lines to remove (36-40):**
```typescript
// Check if this is from DevRoleSwitcher (no redirect needed)
const isDevRoleSwitcher = url.searchParams.get('dev') === 'true';
if (isDevRoleSwitcher) {
  return new Response('OK', { status: 200 });
}
```

### Navbar Test (Remove Dev Switcher Tests)

**File:** `src/lib/components/__tests__/Navbar.test.ts`

**Tests to remove (lines 212-232):**
```typescript
it('shows dev role switcher in development', () => { ... });
it('hides dev role switcher in production', () => { ... });
```

---

## Directories to Delete

| Directory | Description |
|-----------|-------------|
| `src/routes/api/demo/` | Entire demo API directory (4 subdirectories) |
| `src/lib/server/demo/` | Demo server utilities directory |
| `src/lib/components/demo/` | Demo components directory (if empty after DemoModeBanner removal) |

---

## Functions to Remove

### In `src/lib/server/demo/seedData.ts`

- `generateSlug(fullName: string): string`
- `seedDemoMemorial(template, sessionId, ownerId): Promise<string>`
- `seedDemoStreams(memorialId, templates, sessionId, createdById): Promise<string[]>`
- `seedDemoCondolences(memorialId, templates, sessionId): Promise<number>`
- `seedDemoScenario(scenario, sessionId, ownerId): Promise<{ memorialId, slug }>`
- `cleanupDemoData(sessionId): Promise<void>`

### In `src/routes/api/demo/session/+server.ts`

- `POST` request handler
- `createDemoUsers(sessionId, expiresAt): Promise<DemoUsers>`
- `getDemoDisplayName(role: string): string`

### In `src/routes/api/demo/session/[id]/+server.ts`

- `GET` request handler

### In `src/routes/api/demo/switch-role/+server.ts`

- `POST` request handler

### In `src/routes/api/demo/cleanup/+server.ts`

- `GET` request handler (scheduled cleanup)
- `POST` request handler (manual cleanup)

---

## Types/Interfaces to Remove

### From `src/lib/types/demo.ts`

- `DemoSession`
- `DemoUser`
- `DemoEntity`
- `DemoMemorial`
- `DemoStream`
- `DemoSlideshow`
- `DemoScenario`
- `CreateDemoSessionRequest`
- `CreateDemoSessionResponse`
- `DemoSessionStatus`
- `SwitchRoleRequest`
- `SwitchRoleResponse`
- `DemoCleanupResult`

### From `src/lib/types/demo-data.ts`

- `DemoMemorialTemplate`
- `DemoStreamTemplate`
- `DemoSlideshowPhoto`
- `DemoSlideshowTemplate`
- `DemoCondolence`
- `DemoScenarioData`
- `DEMO_SCENARIOS` constant

---

## Potential References to Check

Search for these terms to find any remaining references:

```bash
# Search commands
grep -r "DevRoleSwitcher" src/
grep -r "DemoModeBanner" src/
grep -r "isDemo" src/
grep -r "demoSessionId" src/
grep -r "/api/demo" src/
grep -r "demo-role" src/
grep -r "switch-role" src/
```

---

## Environment Variables to Remove

Check for and remove any demo-related environment variables:

- `DEMO_CLEANUP_SECRET` (used in cleanup API)

---

## Firestore Collections Affected

The following collections may contain demo data that needs cleanup:

- `demoSessions` - Demo session documents
- `memorials` - Documents with `isDemo: true` and `demoSessionId` fields
- `users` - Demo user documents with `isDemo: true`

---

## Removal Order (Recommended)

1. Remove component imports and usage from `+layout.svelte`
2. Delete component files (`DevRoleSwitcher.svelte`, `DemoModeBanner.svelte`)
3. Delete test files
4. Delete API routes (`src/routes/api/demo/`)
5. Delete server utilities (`src/lib/server/demo/`)
6. Delete type files (`src/lib/types/demo.ts`, `src/lib/types/demo-data.ts`)
7. Clean up remaining references in `logout/+server.ts` and navbar tests
8. Run grep searches to verify no remaining references
9. Clean up any Firestore demo data

---

## Notes

- The `DevRoleSwitcher` component references `/api/dev-role-switch` which doesn't exist (appears to be a bug - the actual endpoint is `/api/demo/switch-role`)
- Demo mode also affects CSS classes in the layout (`demo-mode` class)
- The demo system creates actual Firebase Auth users and Firestore documents that need cleanup
