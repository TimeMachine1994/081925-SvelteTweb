# Lawyer Dashboard WBS Review - 1/19/2026

## Executive Summary
The WBS is comprehensive but contains a major architectural inconsistency regarding the SPA goal versus the current file structure usage. It also risks over-complexity in component creation where reuse would be more efficient.

## Critical Inconsistencies

### 1. SPA Architecture vs. Server Files
- **Issue**: The document targets a "Fully functional SPA" but lists `+page.server.ts` files as "Files to Modify".
- **Why it's inconsistent**: In a pure SvelteKit SPA (adapter-static), `+page.server.ts` files should generally be replaced by `+page.ts` (universal load) or client-side fetching (in `onMount` or effects) to avoid server-side rendering of pages. Using `+page.server.ts` implies a Hybrid/SSR approach.
- **Recommendation**: 
  - Change "Files to Modify" to explicitly state **migrating** logic from `+page.server.ts` to `+server.ts` (API endpoints) and using client-side stores/`+page.ts` for data loading.
  - Verify if `adapter-static` is strictly enforced. If so, `+page.server.ts` will break the build if it contains non-prerenderable dynamic data.

### 2. "Complete" Status vs. Reality
- **Issue**: The referenced `SPA_IMPLEMENTATION_COMPLETE.md` suggests the refactor is done, but the filesystem still contains `+page.server.ts` files in the dashboard routes.
- **Recommendation**: Acknowledge that the migration is likely partial. The WBS should explicitly include tasks to "Convert Server Loaders to Client Fetchers".

## Complexity Review

### 1. Modal Proliferation (High Complexity)
- **Observation**: The plan calls for creating ~10-12 separate modal component files (e.g., `ArchiveCaseModal.svelte`, `DeleteDocumentConfirmation`, etc.).
- **Critique**: This is over-engineered. Many of these (Archive, Delete Document, Delete Invoice) are simple "Are you sure?" dialogs.
- **Recommendation**: 
  - **Consolidate**: Eliminate `ArchiveCaseModal.svelte` and other simple deletion modals. Use the generic `ConfirmDialog.svelte` directly in the parent component.
  - **Keep**: Complex modals like `CreateCaseModal` (forms), `UploadDocumentModal` (drag-drop logic), and `UncategorizedThreadModal` (complex logic) justify their own components.

### 2. Layout Changes (Unnecessary Complexity)
- **Observation**: Phase 7.2 suggests "Replace 2-column layout with tabs".
- **Critique**: The current 2-column layout (Info/Stats on left, Content on right or split) is often superior for wide screens (Desktops) typical of dashboard usage. Switching to Tabs forces more clicks to see information that could be visible simultaneously.
- **Recommendation**: Mark 7.2 as **Low Priority** or **Optional**. Focus on making the existing 2-column layout responsive instead of rewriting it.

### 3. Store Granularity
- **Observation**: Separate stores for `cases`, `invoices`, `messages`, `documents`.
- **Critique**: This is good, but ensure they share a common pattern for "loading" and "error" states to avoid boilerplate code in the UI.
- **Recommendation**: Create a `createStore` factory or base class in `src/lib/utils/store.svelte.ts` to handle common fetch/load/error logic for standard CRUD resources.

## Missing Elements

### 1. Error Boundary
- **Issue**: No mention of global or section-specific error handling UI. In an SPA, if an API call fails, we need to show a toast or alert, not crash the page.
- **Recommendation**: Add a task to implement a global `Toast` notification system for API success/error messages.

### 2. Form State Management
- **Issue**: Svelte 5 runes make state easy, but handling form validation/dirty states for 5+ different modals can get repetitive.
- **Recommendation**: Standardize on a simple form handler pattern (e.g., `superforms` or a custom rune-based form helper) to reduce complexity in `CreateCaseModal`, `EditCaseModal`, etc.

## Refined Action Plan

1. **Update WBS**: 
   - Remove dedicated files for simple confirmation modals.
   - Add "Migrate +page.server.ts to API" tasks.
   - Add "Toast Notification System" task.
2. **First Implementation Step**: 
   - Create `Modal.svelte` and `ConfirmDialog.svelte` (Foundation).
   - Create `api/users` endpoint (Blocker for Create Case).
   - Implement `CreateCaseModal` using the new Modal base.
