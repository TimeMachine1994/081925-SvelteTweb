# Memorial to Event Refactor Plan

## Overview
This document outlines the complete refactoring plan to rename "memorial" terminology to "event" throughout the codebase, and remove memorial-specific content like the `celebration-of-life-for-` slug prefix.

**Scope:** ~2,173 occurrences across 184 files

---

## Phase 1: Slug Generation (Priority - Quick Win)

Remove the `celebration-of-life-for-` prefix from slug generation.

### Files to Update:

| File | Change |
|------|--------|
| `src/lib/utils/memorial-slug.ts:9` | Remove `celebration-of-life-for-` prefix from `generateBaseSlug()` |
| `src/lib/components/LiveUrlPreview.svelte:31` | Remove prefix from URL preview |
| `src/routes/api/admin/create-memorial/+server.ts:31` | Remove prefix from admin API |
| `src/lib/utils/memorial-slug.test.ts` | Update 14 test expectations |
| `src/lib/utils/integration.test.ts` | Update 5 test expectations |

---

## Phase 2: File Renames

### 2.1 Type Files
| Current | New |
|---------|-----|
| `src/lib/types/memorial.ts` | `src/lib/types/event.ts` |

### 2.2 Utility Files
| Current | New |
|---------|-----|
| `src/lib/utils/memorial-slug.ts` | `src/lib/utils/event-slug.ts` |
| `src/lib/utils/memorial-slug.test.ts` | `src/lib/utils/event-slug.test.ts` |
| `src/lib/utils/memorialAccess.ts` | `src/lib/utils/eventAccess.ts` |
| `src/lib/utils/memorialAccess.test.ts` | `src/lib/utils/eventAccess.test.ts` |
| `src/lib/utils/memorialAccess.admin.test.ts` | `src/lib/utils/eventAccess.admin.test.ts` |

### 2.3 Server Files
| Current | New |
|---------|-----|
| `src/lib/server/memorialMiddleware.ts` | `src/lib/server/eventMiddleware.ts` |
| `src/lib/server/memorialMiddleware.test.ts` | `src/lib/server/eventMiddleware.test.ts` |

### 2.4 Component Files
| Current | New |
|---------|-----|
| `src/lib/components/MemorialFollowButton.svelte` | `src/lib/components/EventFollowButton.svelte` |
| `src/lib/components/MemorialSlideshow.svelte` | `src/lib/components/EventSlideshow.svelte` |
| `src/lib/components/MemorialStreamDisplay.svelte` | `src/lib/components/EventStreamDisplay.svelte` |
| `src/lib/components/minimal-modern/MemorialCard.svelte` | `src/lib/components/minimal-modern/EventCard.svelte` |
| `src/lib/components/__tests__/MemorialCard.test.ts` | `src/lib/components/__tests__/EventCard.test.ts` |

---

## Phase 3: Route Directory Renames

### 3.1 Admin Routes
| Current | New |
|---------|-----|
| `src/routes/admin/services/memorials/` | `src/routes/admin/services/events/` |
| `src/routes/admin/services/memorials/[memorialId]/` | `src/routes/admin/services/events/[eventId]/` |
| `src/routes/admin/users/memorial-owners/` | `src/routes/admin/users/event-owners/` |

### 3.2 API Routes
| Current | New |
|---------|-----|
| `src/routes/api/admin/create-memorial/` | `src/routes/api/admin/create-event/` |
| `src/routes/api/admin/delete-memorial/` | `src/routes/api/admin/delete-event/` |
| `src/routes/api/admin/mvp/memorials/` | `src/routes/api/admin/mvp/events/` |
| `src/routes/api/admin/toggle-memorial-status/` | `src/routes/api/admin/toggle-event-status/` |
| `src/routes/api/debug/list-memorials/` | `src/routes/api/debug/list-events/` |
| `src/routes/api/debug/memorial/` | `src/routes/api/debug/event/` |
| `src/routes/api/funeral-director/create-customer-memorial/` | `src/routes/api/funeral-director/create-customer-event/` |
| `src/routes/api/funeral-director/create-memorial/` | `src/routes/api/funeral-director/create-event/` |
| `src/routes/api/funeral-director/memorials/` | `src/routes/api/funeral-director/events/` |
| `src/routes/api/memorial/` | `src/routes/api/event/` |
| `src/routes/api/memorials/` | `src/routes/api/events/` |
| `src/routes/api/memorials/[memorialId]/` | `src/routes/api/events/[eventId]/` |
| `src/routes/api/user/memorials/` | `src/routes/api/user/events/` |

### 3.3 Page Routes
| Current | New |
|---------|-----|
| `src/routes/memorial-example/` | `src/routes/event-example/` |
| `src/routes/memorials/` | `src/routes/events/` |
| `src/routes/schedule/[memorialId]/` | `src/routes/schedule/[eventId]/` |

---

## Phase 4: Variable/Function Renames (Global Find & Replace)

### 4.1 Type Names
| Current | New |
|---------|-----|
| `Memorial` (type) | `Event` (already exists, verify no conflicts) |

### 4.2 Function Names
| Current | New |
|---------|-----|
| `generateUniqueMemorialSlug` | `generateUniqueEventSlug` |
| `generateBaseSlug` | (keep as is, it's generic) |
| `checkSlugExists` | (keep as is, it's generic) |
| `checkMemorialAccess` | `checkEventAccess` |
| `getMemorialAccessLevel` | `getEventAccessLevel` |
| `canEditMemorial` | `canEditEvent` |
| `canViewMemorial` | `canViewEvent` |

### 4.3 Variable Names (High-Impact)
| Current | New |
|---------|-----|
| `memorialId` | `eventId` |
| `memorialRef` | `eventRef` |
| `memorialData` | `eventData` |
| `memorialDoc` | `eventDoc` |
| `memorialCount` | `eventCount` |
| `memorialsSnap` | `eventsSnap` |
| `memorialMiddleware` | `eventMiddleware` |

---

## Phase 5: Firestore Collection (Database)

**IMPORTANT:** The Firestore collection is named `memorials`. This requires a data migration strategy.

### Options:
1. **Keep collection name** - Less risky, just update code references
2. **Rename collection** - Requires migration script, more complete but risky

### Recommendation: Keep `memorials` collection name for now
- Update all code to use `events` terminology in variables/types
- Keep Firestore queries pointing to `memorials` collection
- Add a comment explaining the legacy collection name
- Plan a future migration when there's a maintenance window

---

## Phase 6: UI Text Updates

Update user-facing text from "memorial" to "event":

### Files with UI Text (Top Priority):
- `src/lib/components/Profile.svelte` (40 matches)
- `src/lib/components/portals/AdminPortal.svelte` (152 matches)
- `src/lib/components/portals/OwnerPortal.svelte` (37 matches)
- `src/lib/components/portals/ViewerPortal.svelte` (22 matches)
- `src/lib/components/portals/FuneralDirectorPortal.svelte` (22 matches)
- `src/routes/admin/mvp-dashboard/+page.svelte` (27 matches)
- `src/routes/schedule/+page.svelte` (21 matches)

### Text Replacements:
| Current | New |
|---------|-----|
| "Create Memorial" | "Create Event" |
| "memorial page" | "event page" |
| "Memorial created" | "Event created" |
| "your memorial" | "your event" |
| "this memorial" | "this event" |
| "Memorial Settings" | "Event Settings" |
| "Celebration of Life" | (remove or make optional) |

---

## Phase 7: Test Updates

All test files need to be updated to reflect new naming:

### Test Files:
- `src/lib/components/__tests__/MemorialCard.test.ts` (92 matches)
- `src/lib/components/__tests__/StripeCheckout.test.ts` (24 matches)
- `src/lib/components/__tests__/Calculator.test.ts` (21 matches)
- `src/lib/utils/memorial-slug.test.ts`
- `src/lib/utils/memorialAccess.test.ts`
- `src/lib/utils/memorialAccess.admin.test.ts`
- `src/lib/utils/integration.test.ts`
- `src/lib/server/memorialMiddleware.test.ts`
- `src/lib/components/slideshow/PhotoSlideshowCreator.test.ts`

---

## Execution Order

### Step 1: Quick Wins (Can do immediately)
1. Remove `celebration-of-life-for-` prefix from slug generation
2. Update `LiveUrlPreview.svelte` component

### Step 2: Type System
1. Update `Event` interface in `src/lib/types/memorial.ts`
2. Rename file to `event.ts`
3. Update all imports

### Step 3: Utility Functions
1. Rename utility files
2. Update function names
3. Update all imports

### Step 4: Routes
1. Rename route directories
2. Update internal references
3. Update any hardcoded URLs in frontend

### Step 5: Components
1. Rename component files
2. Update imports
3. Update component usage

### Step 6: Global Variable Rename
1. Use IDE find/replace for variable names
2. Run TypeScript compiler to catch errors
3. Run tests to verify

### Step 7: UI Text
1. Update user-facing strings
2. Review for consistency

### Step 8: Tests
1. Update test expectations
2. Run full test suite
3. Fix any failures

---

## Risk Mitigation

1. **Create a branch** - Do all work on a feature branch
2. **Incremental commits** - Commit after each phase
3. **Run tests frequently** - After each major change
4. **Keep Firestore collection name** - Avoid database migration risk
5. **Search for hardcoded URLs** - Check for any `/memorial/` or `/memorials/` URLs

---

## Estimated Effort

| Phase | Files | Estimated Time |
|-------|-------|----------------|
| Phase 1 (Slug) | 5 | 15 min |
| Phase 2 (File Renames) | 13 | 30 min |
| Phase 3 (Route Renames) | 19 | 45 min |
| Phase 4 (Variables) | 184 | 2-3 hours |
| Phase 5 (Firestore) | N/A | Decision only |
| Phase 6 (UI Text) | ~20 | 1 hour |
| Phase 7 (Tests) | ~15 | 1-2 hours |

**Total Estimated Time:** 5-7 hours

---

## Notes

- The `Event` type already exists in `src/lib/types/memorial.ts` - the interface is already named `Event`, not `Memorial`
- Some files have already been partially migrated (comments say "event" but code says "memorial")
- The Firestore collection `memorials` should remain unchanged to avoid data migration
