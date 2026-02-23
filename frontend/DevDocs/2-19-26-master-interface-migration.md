# Master Interface Migration — Work Breakdown Structure

**Date:** February 19, 2026  
**Purpose:** Comprehensive WBS for migrating the entire TributeStream frontend to Svelte 5 best practices, replacing browser-native dialogs with a unified UI system, hardening security, and improving accessibility.  
**Scope:** 128 Svelte components, 49 route pages, ~30 API server files  
**Source Audit:** `2-17-26-markdown-review.md` v1.2, full codebase grep scan Feb 19 2026

---

## Baseline Metrics (Current State)

| Metric | Count | Files Affected |
|--------|-------|----------------|
| `alert()` calls | **108** | 28 `.svelte` files |
| `confirm()` calls | **18** | 12 `.svelte` files |
| `location.reload()` calls | **20** | 11 `.svelte` files |
| `{@html}` (XSS risk) | **15** | 9 `.svelte` files |
| `console.log` in components | **342** | 49 `.svelte` files |
| `<svelte:boundary>` usage | **0** | — |
| Untyped `$props()` | ~40+ | ~40+ `.svelte` files |

### Target State (Post-Migration)

| Metric | Target |
|--------|--------|
| `alert()` calls | **0** — all replaced by toast/modal system |
| `confirm()` calls | **0** — all replaced by ConfirmDialog component |
| `location.reload()` calls | **0** — all replaced by `invalidateAll()` |
| `{@html}` without sanitization | **0** — all wrapped with DOMPurify |
| `console.log` in production components | **0** — replaced by conditional logger |
| `<svelte:boundary>` usage | **1 per route page** minimum |
| Untyped `$props()` | **0** — all typed with interfaces |

---

## Phase 1: Foundation Infrastructure

> Build the shared utilities that every subsequent phase depends on. **No feature files are touched yet.**

### 1.1 Toast / Notification System

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 1.1.1 | Create `src/lib/components/ui/Toast.svelte` — single toast component | HIGH | Medium | Variants: `success`, `error`, `warning`, `info`. Auto-dismiss with configurable duration. |
| 1.1.2 | Create `src/lib/components/ui/ToastContainer.svelte` — stacked toast host | HIGH | Low | Renders at layout root. Stacks up to 5 toasts. |
| 1.1.3 | Create `src/lib/stores/toast.ts` — toast store with `addToast()`, `removeToast()` | HIGH | Low | Svelte 5 `$state`-based store. Exports `toast.success()`, `toast.error()`, `toast.info()`, `toast.warning()`. |
| 1.1.4 | Mount `ToastContainer` in `src/routes/+layout.svelte` | HIGH | Low | Single mount point for entire app. |
| 1.1.5 | Write unit test for toast store | MEDIUM | Low | Verify add, auto-remove, max stack. |

### 1.2 Confirm Dialog System

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 1.2.1 | Create `src/lib/components/ui/ConfirmDialog.svelte` — modal confirmation | HIGH | Medium | Props: `title`, `message`, `confirmLabel`, `cancelLabel`, `variant` (danger/warning/info). Returns Promise<boolean>. |
| 1.2.2 | Create `src/lib/stores/confirmDialog.ts` — imperative `confirmDialog()` function | HIGH | Low | `const ok = await confirmDialog({ title, message })`. Resolves on user action. |
| 1.2.3 | Mount `ConfirmDialog` in `src/routes/+layout.svelte` | HIGH | Low | Single global instance. |
| 1.2.4 | Write unit test for confirm dialog store | MEDIUM | Low | |

### 1.3 API Request Wrapper

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 1.3.1 | Create `src/lib/utils/api.ts` — `apiRequest<T>(url, options)` | HIGH | Medium | Typed fetch wrapper. Handles JSON parsing, error extraction, toast-on-error. Returns `{ data, error }`. |
| 1.3.2 | Add `ApiError` class with status code and message | HIGH | Low | |
| 1.3.3 | Write unit tests for apiRequest | MEDIUM | Low | Success, 4xx, 5xx, network failure. |

### 1.4 Conditional Logger

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 1.4.1 | Create `src/lib/utils/logger.ts` — `log`, `warn`, `error` wrappers | MEDIUM | Low | No-op in production unless `?debug=true` query param. Preserves emoji prefixes. |
| 1.4.2 | Export named loggers: `logger.memorial()`, `logger.stream()`, `logger.calculator()`, etc. | MEDIUM | Low | Scoped by feature area. |

### 1.5 Error Boundary Strategy

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 1.5.1 | Create `src/lib/components/ui/ErrorFallback.svelte` — error UI for `<svelte:boundary>` | HIGH | Medium | Shows user-friendly message, optional "retry" button, logs error to console/server. |
| 1.5.2 | Define error boundary placement strategy (document in code comment) | HIGH | Low | One per route `+page.svelte` wrapping main content; one per heavy component (block editor, calculator, stream display). |

### 1.6 DOMPurify XSS Sanitizer

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 1.6.1 | Install `dompurify` + `@types/dompurify` | HIGH | Low | |
| 1.6.2 | Create `src/lib/utils/sanitize.ts` — `sanitizeHtml(raw: string): string` | HIGH | Low | Wraps DOMPurify with project-specific allowlist (iframes for embeds, basic formatting tags). |
| 1.6.3 | Write unit tests for sanitizer | HIGH | Low | Test XSS payloads, valid embed iframes, basic HTML. |

---

## Phase 2: Admin Pages — Core CRUD Flows

> Highest-traffic admin paths. Each task replaces `alert()`/`confirm()`/`location.reload()` and adds error boundaries.

### 2.1 Admin Memorial Detail Page

**File:** `src/routes/admin/services/memorials/[memorialId]/+page.svelte` (688 lines)  
**Current:** 6 `alert()`, 3 `confirm()`, 0 `location.reload()`, 4 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 2.1.1 | Replace 3 `confirm()` → `confirmDialog()` | HIGH | Low | `handleDelete`, `handleForceRefresh`, `clearDisplaySettings` |
| 2.1.2 | Replace 6 `alert()` → `toast.success()` / `toast.error()` | HIGH | Low | Delete success/failure, force refresh failure |
| 2.1.3 | Replace `fetch()` calls → `apiRequest()` | MEDIUM | Medium | 4 fetch calls (delete, display settings, force refresh, clear display) |
| 2.1.4 | Type `$props()` — add `PageData` interface | MEDIUM | Low | `let { data }: { data: PageData } = $props()` |
| 2.1.5 | Convert `publicUrl` to `$derived` | LOW | Low | `let publicUrl = $derived(...)` |
| 2.1.6 | Wrap page content with `<svelte:boundary>` | MEDIUM | Low | |
| 2.1.7 | Replace 4 `console.log` → `logger.memorial()` | LOW | Low | |

### 2.2 Admin Memorial List Page

**File:** `src/routes/admin/services/memorials/+page.svelte` (303 lines)  
**Current:** 4 `alert()`, 1 `confirm()`, 3 `location.reload()`, 1 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 2.2.1 | Replace 3 `location.reload()` → `invalidateAll()` | HIGH | Low | After archive, toggle status, bulk actions |
| 2.2.2 | Replace 1 `confirm()` → `confirmDialog()` | HIGH | Low | Bulk delete confirmation |
| 2.2.3 | Replace 4 `alert()` → `toast` | HIGH | Low | Action completion messages |
| 2.2.4 | Replace `fetch()` calls → `apiRequest()` | MEDIUM | Medium | |
| 2.2.5 | Wrap page content with `<svelte:boundary>` | MEDIUM | Low | |

### 2.3 Admin Dashboard

**File:** `src/routes/admin/+page.svelte` (441 lines)  
**Current:** 2 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 2.3.1 | Replace 2 `console.log` → `logger.admin()` | LOW | Low | |
| 2.3.2 | Wrap page content with `<svelte:boundary>` | MEDIUM | Low | |

### 2.4 Admin Blog Page

**File:** `src/routes/admin/content/blog/+page.svelte`  
**Current:** 4 `alert()`, 1 `confirm()`, 3 `location.reload()`, 1 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 2.4.1 | Replace 3 `location.reload()` → `invalidateAll()` | HIGH | Low | |
| 2.4.2 | Replace 1 `confirm()` → `confirmDialog()` | HIGH | Low | |
| 2.4.3 | Replace 4 `alert()` → `toast` | HIGH | Low | |
| 2.4.4 | Wrap page content with `<svelte:boundary>` | MEDIUM | Low | |

### 2.5 Admin User Pages

**Files:** `admin/users/memorial-owners/+page.svelte`, `admin/users/funeral-directors/+page.svelte`  
**Current:** 1 `location.reload()` each

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 2.5.1 | Replace `location.reload()` → `invalidateAll()` in memorial-owners | HIGH | Low | |
| 2.5.2 | Replace `location.reload()` → `invalidateAll()` in funeral-directors | HIGH | Low | |
| 2.5.3 | Wrap both pages with `<svelte:boundary>` | MEDIUM | Low | |

### 2.6 Admin Switcher Page

**File:** `src/routes/admin/services/memorials/[memorialId]/switcher/+page.svelte`  
**Current:** 3 `alert()`, 7 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 2.6.1 | Replace 3 `alert()` → `toast` | HIGH | Low | |
| 2.6.2 | Replace 7 `console.log` → `logger.stream()` | LOW | Low | |
| 2.6.3 | Wrap page content with `<svelte:boundary>` | MEDIUM | Low | |

---

## Phase 3: Public Pages

### 3.1 Public Memorial Page

**File:** `src/routes/[fullSlug]/+page.svelte` (861 lines)  
**Current:** 1 `alert()`, 1 `location.reload()` (force refresh listener), 6 `console.log`, 1 `{@html}` XSS risk

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 3.1.1 | Replace `alert('Link copied…')` → `toast.success()` | HIGH | Low | |
| 3.1.2 | Sanitize `{@html (memorial as any).custom_html}` with `sanitizeHtml()` | HIGH | Low | XSS fix — line 364 |
| 3.1.3 | Replace 6 `console.log` → `logger.memorial()` | LOW | Low | |
| 3.1.4 | Wrap page content with `<svelte:boundary>` | MEDIUM | Low | |
| 3.1.5 | Note: `location.reload()` in force-refresh `onSnapshot` listener is **intentional** — do NOT replace | — | — | Documented exception |

### 3.2 Blog Pages

**Files:** `blog/+page.svelte`, `blog/[slug]/+page.svelte`  
**Current:** 1 `alert()` (copy link), 2 `{@html}` (blog content), 1 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 3.2.1 | Replace `alert()` → `toast.success()` in blog detail | HIGH | Low | Copy link |
| 3.2.2 | Sanitize 2 `{@html}` in blog templates | HIGH | Low | Blog post body HTML |
| 3.2.3 | Wrap pages with `<svelte:boundary>` | MEDIUM | Low | |

### 3.3 Search Page

**File:** `src/routes/search/+page.svelte`  
**Current:** 6 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 3.3.1 | Replace 6 `console.log` → `logger.memorial()` | LOW | Low | |
| 3.3.2 | Wrap page with `<svelte:boundary>` | MEDIUM | Low | |

---

## Phase 4: Calculator & Booking Flow

### 4.1 Calculator Component

**File:** `src/lib/components/calculator/Calculator.svelte` (628 lines)  
**Current:** 9 `alert()`, 1 `confirm()`, 35 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 4.1.1 | Replace 1 `confirm()` → `confirmDialog()` | HIGH | Low | Auto-save restore prompt |
| 4.1.2 | Replace 9 `alert()` → `toast` | HIGH | Medium | Stream creation feedback, validation errors, save confirmations, payment errors |
| 4.1.3 | Replace 35 `console.log` → `logger.calculator()` | MEDIUM | Medium | Extensive logging throughout |
| 4.1.4 | Replace `fetch()` calls → `apiRequest()` | MEDIUM | Medium | |
| 4.1.5 | Wrap Calculator with `<svelte:boundary>` | HIGH | Low | Complex component — high failure risk |

### 4.2 Calculator Sub-Components

**Files:** `TierSelector.svelte`, `BookingForm.svelte`, `Summary.svelte`, `StripeCheckout.svelte`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 4.2.1 | Replace `console.log` in TierSelector (2) | LOW | Low | |
| 4.2.2 | Replace `console.log` in Summary (7) | LOW | Low | |
| 4.2.3 | Replace `location.reload()` in StripeCheckout (1) | HIGH | Low | After payment completion |
| 4.2.4 | Type `$props()` interfaces for all 4 sub-components | MEDIUM | Low | |

### 4.3 Schedule Pages

**Files:** `schedule/+page.svelte`, `schedule/[memorialId]/+page.svelte`, `schedule/new/+page.svelte`  
**Current:** 3 `alert()` (schedule), 3 `alert()` (new), 14+5 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 4.3.1 | Replace 6 `alert()` → `toast` across schedule pages | HIGH | Low | |
| 4.3.2 | Replace ~19 `console.log` → `logger.calculator()` | MEDIUM | Low | |
| 4.3.3 | Wrap each schedule page with `<svelte:boundary>` | MEDIUM | Low | |

---

## Phase 5: Streaming & Media Components

### 5.1 StreamCard Component

**File:** `src/lib/components/streaming/StreamCard.svelte` (29KB)  
**Current:** 17 `alert()`, 2 `confirm()`, 6 `location.reload()`, 8 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 5.1.1 | Replace 6 `location.reload()` → `invalidateAll()` or callback prop | HIGH | Medium | Heaviest single file for reload calls |
| 5.1.2 | Replace 2 `confirm()` → `confirmDialog()` | HIGH | Low | |
| 5.1.3 | Replace 17 `alert()` → `toast` | HIGH | Medium | Largest single file for alert calls |
| 5.1.4 | Replace 8 `console.log` → `logger.stream()` | MEDIUM | Low | |
| 5.1.5 | Replace `fetch()` calls → `apiRequest()` | MEDIUM | High | Many fetch calls for stream operations |
| 5.1.6 | Wrap with `<svelte:boundary>` | MEDIUM | Low | |

### 5.2 MemorialStreamDisplay

**File:** `src/lib/components/MemorialStreamDisplay.svelte` (35KB)  
**Current:** 1 `alert()`, 7 `console.log`, 6 `{@html}`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 5.2.1 | Sanitize 6 `{@html}` with `sanitizeHtml()` | HIGH | Medium | Multiple embed rendering points |
| 5.2.2 | Replace 1 `alert()` → `toast` | HIGH | Low | |
| 5.2.3 | Replace 7 `console.log` → `logger.stream()` | LOW | Low | |

### 5.3 MuxVideoPlayer

**File:** `src/lib/components/streaming/MuxVideoPlayer.svelte`  
**Current:** 17 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 5.3.1 | Replace 17 `console.log` → `logger.stream()` | MEDIUM | Low | Heavy logging for video debug |

### 5.4 Chat Components

**Files:** `ChatModerationPanel.svelte`, `AdminChatPanel.svelte`, `ChatPanel.svelte`, `LiveChatWidget.svelte`  
**Current:** 1 `alert()` + 1 `confirm()` (moderation), 1 `confirm()` (admin), 1 `confirm()` (chat), 11+9 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 5.4.1 | Replace `alert()`/`confirm()` in ChatModerationPanel | HIGH | Low | |
| 5.4.2 | Replace `confirm()` in AdminChatPanel | HIGH | Low | |
| 5.4.3 | Replace `confirm()` in ChatPanel | HIGH | Low | |
| 5.4.4 | Replace ~20 `console.log` → `logger.chat()` across all 4 files | MEDIUM | Low | |

### 5.5 Stream Analytics Dashboard

**File:** `src/lib/components/streaming/StreamAnalyticsDashboard.svelte`  
**Current:** 13 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 5.5.1 | Replace 13 `console.log` → `logger.stream()` | MEDIUM | Low | |

---

## Phase 6: Slideshow & Media Creation

### 6.1 PhotoSlideshowCreator

**File:** `src/lib/components/slideshow/PhotoSlideshowCreator.svelte` (93KB — largest component)  
**Current:** 24 `alert()`, 4 `confirm()`, 69 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 6.1.1 | Replace 4 `confirm()` → `confirmDialog()` | HIGH | Medium | |
| 6.1.2 | Replace 24 `alert()` → `toast` | HIGH | High | Largest single-file alert count |
| 6.1.3 | Replace 69 `console.log` → `logger.slideshow()` | MEDIUM | Medium | Largest single-file console.log count |
| 6.1.4 | Wrap with `<svelte:boundary>` | HIGH | Low | Very complex component |

### 6.2 PhotoSlideshowGenerator

**File:** `src/lib/components/slideshow/PhotoSlideshowGenerator.svelte` (32KB)  
**Current:** 5 `alert()`, 2 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 6.2.1 | Replace 5 `alert()` → `toast` | HIGH | Low | |
| 6.2.2 | Replace 2 `console.log` → `logger.slideshow()` | LOW | Low | |

### 6.3 AudioUploader & SlideshowSection

**Files:** `AudioUploader.svelte`, `SlideshowSection.svelte`  
**Current:** 3 `alert()` (audio), 2 `alert()` + 1 `confirm()` (section), 1 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 6.3.1 | Replace 5 `alert()` + 1 `confirm()` across both files | HIGH | Low | |
| 6.3.2 | Replace `console.log` → `logger.slideshow()` | LOW | Low | |

### 6.4 SlideshowPlayer

**File:** `src/lib/components/SlideshowPlayer.svelte`  
**Current:** 1 `{@html}` (caption rendering)

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 6.4.1 | Sanitize `{@html}` in SlideshowPlayer | HIGH | Low | Caption/description HTML |

---

## Phase 7: Block Editor & Modals

### 7.1 Block Editor Modals

**Files:** `AddBlockModal.svelte`, `EditEmbedModal.svelte`, `EditTextModal.svelte`, `MemorialBlockEditor.svelte`  
**Current:** 3 `alert()` (add), 1 `alert()` + 1 `{@html}` (embed), 1 `alert()` (text), 1 `confirm()` (editor)

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 7.1.1 | Replace 5 `alert()` → `toast` across modals | HIGH | Low | |
| 7.1.2 | Replace 1 `confirm()` → `confirmDialog()` in MemorialBlockEditor | HIGH | Low | |
| 7.1.3 | Sanitize `{@html}` in EditEmbedModal preview | HIGH | Low | Embed preview |

### 7.2 EmbedRenderer (Public)

**File:** `src/lib/components/memorial/EmbedRenderer.svelte`  
**Current:** 1 `{@html}`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 7.2.1 | Sanitize `{@html}` with `sanitizeHtml()` — allow iframe embeds | HIGH | Low | Critical public-facing XSS fix |

### 7.3 Wiki Components

**Files:** `WikiEditor.svelte`, `admin/wiki/[slug]/+page.svelte`  
**Current:** 1 `{@html}` each

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 7.3.1 | Sanitize `{@html}` in WikiEditor preview | MEDIUM | Low | |
| 7.3.2 | Sanitize `{@html}` in wiki detail page | MEDIUM | Low | |

---

## Phase 8: Remaining Components & Pages

### 8.1 Profile Component

**File:** `src/lib/components/Profile.svelte` (32KB)  
**Current:** 2 `alert()`, 1 `location.reload()`, 2 `console.log`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 8.1.1 | Replace 1 `location.reload()` → `invalidateAll()` | HIGH | Low | After profile update |
| 8.1.2 | Replace 2 `alert()` → `toast` | HIGH | Low | |
| 8.1.3 | Replace 2 `console.log` → `logger` | LOW | Low | |

### 8.2 Admin Sub-Components

**Files:** `CustomPricingEditor.svelte`, `AdminScheduleEditor.svelte`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 8.2.1 | Replace 1 `confirm()` in CustomPricingEditor | HIGH | Low | |
| 8.2.2 | Type `$props()` for both components | MEDIUM | Low | |

### 8.3 Registration Pages

**Files:** `register/funeral-director/+page.svelte`, `register/funeral-home/+page.svelte`  
**Current:** 1 `alert()` each

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 8.3.1 | Replace 2 `alert()` → `toast` across registration pages | MEDIUM | Low | |

### 8.4 ErrorBoundary Component

**File:** `src/lib/components/ErrorBoundary.svelte`  
**Current:** 1 `location.reload()`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 8.4.1 | Keep `location.reload()` — intentional for full error recovery | — | — | Documented exception |

### 8.5 Mobile Stream & Camera Pages

**Files:** `stream/mobile/[streamId]/+page.svelte`, `camera/[roomName]/+page.svelte`  
**Current:** 3 `alert()` (mobile), 12 `console.log` (mobile), 1 `location.reload()` (camera)

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 8.5.1 | Replace 3 `alert()` → `toast` in mobile stream | MEDIUM | Low | |
| 8.5.2 | Replace 12 `console.log` → `logger.stream()` in mobile stream | MEDIUM | Low | |
| 8.5.3 | Replace `location.reload()` → `invalidateAll()` in camera page | MEDIUM | Low | |

### 8.6 Dev/Test Pages (Low Priority)

**Files:** `dev/+page.svelte`, `test-emails/+page.svelte`, `test/slideshow/+page.svelte`

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 8.6.1 | Replace `alert()` in dev/test pages | LOW | Low | 6 total across 3 files. Non-production code. |

---

## Phase 9: $props() Typing Pass

> Systematic pass through all 128 `.svelte` files that use `$props()`. Focus on files that currently have untyped or partially typed props.

### 9.1 Route Page Props

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 9.1.1 | Type `$props()` in all `+page.svelte` files that use `let { data } = $props()` without `PageData` | MEDIUM | Medium | ~15 files: search, schedule, blog, admin pages, camera, receipt, etc. |
| 9.1.2 | Type `$props()` in all `+layout.svelte` files | MEDIUM | Low | 3 files |

### 9.2 Component Props

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 9.2.1 | Audit and type props for all `admin/` components | MEDIUM | Medium | ~20 components |
| 9.2.2 | Audit and type props for all `streaming/` components | MEDIUM | Medium | 5 components |
| 9.2.3 | Audit and type props for all `calculator/` components | MEDIUM | Low | 5 components |
| 9.2.4 | Audit and type props for all `chat/` components | MEDIUM | Low | 8 components |
| 9.2.5 | Audit and type props for all `memorial/` components | MEDIUM | Low | 3 components |
| 9.2.6 | Audit and type props for all `slideshow/` components | MEDIUM | Low | 4 components |
| 9.2.7 | Audit and type props for all standalone components | MEDIUM | Medium | ~15 components |

---

## Phase 10: Accessibility Pass

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 10.1 | Add ARIA live regions to toast notifications | HIGH | Low | `aria-live="polite"` on toast container |
| 10.2 | Add focus management to ConfirmDialog | HIGH | Low | Focus trap, return focus on close |
| 10.3 | Add keyboard handlers (Escape to close) to all modals | MEDIUM | Medium | Block editor modals, confirm dialog, share popup |
| 10.4 | Add `aria-label` to icon-only buttons across admin pages | MEDIUM | Medium | Particularly stream controls, bulk action buttons |
| 10.5 | Add skip-to-content link in main layout | LOW | Low | |
| 10.6 | Audit color contrast on admin components | LOW | Medium | DataGrid, FilterBuilder, status badges |

---

## Phase 11: Server-Side Console.log Cleanup

> Optional but recommended for production readiness.

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| 11.1 | Replace `console.log` in `+page.server.ts` files → structured logger | LOW | Medium | ~30 server load files |
| 11.2 | Replace `console.log` in API `+server.ts` files → structured logger | LOW | High | ~60 API endpoint files |
| 11.3 | Create server-side `src/lib/server/logger.ts` with log levels | LOW | Medium | `info`, `warn`, `error` with structured JSON output |

---

## Documented Exceptions (Do NOT Migrate)

These `location.reload()` calls are **intentional** and should be preserved:

| File | Line | Reason |
|------|------|--------|
| `[fullSlug]/+page.svelte` | ~73 | Force-refresh `onSnapshot` listener — admin triggers full page reload for all viewers |
| `ErrorBoundary.svelte` | — | Full error recovery — needs clean browser state |

---

## Implementation Schedule

### Week 1: Foundation (Phase 1)
- [ ] **Day 1**: Phase 1.1 (Toast system — component, store, mount)
- [ ] **Day 2**: Phase 1.2 (Confirm dialog — component, store, mount)
- [ ] **Day 3**: Phase 1.3 (API wrapper) + Phase 1.4 (Logger)
- [ ] **Day 4**: Phase 1.5 (Error boundary) + Phase 1.6 (DOMPurify)
- [ ] **Day 5**: Integration testing — verify all foundation pieces work together

### Week 2: Admin Core (Phase 2)
- [ ] **Day 1**: Phase 2.1 (Memorial detail page)
- [ ] **Day 2**: Phase 2.2 (Memorial list page) + Phase 2.3 (Dashboard)
- [ ] **Day 3**: Phase 2.4 (Blog) + Phase 2.5 (User pages)
- [ ] **Day 4**: Phase 2.6 (Switcher) + regression testing
- [ ] **Day 5**: QA pass on all admin flows

### Week 3: Public + Calculator (Phases 3–4)
- [ ] **Day 1**: Phase 3.1 (Public memorial — XSS fix is critical path)
- [ ] **Day 2**: Phase 3.2–3.3 (Blog, search) + Phase 4.1 (Calculator main)
- [ ] **Day 3**: Phase 4.2–4.3 (Calculator sub-components + schedule pages)
- [ ] **Day 4**: Regression testing all public flows
- [ ] **Day 5**: Regression testing all booking flows

### Week 4: Streaming + Media (Phases 5–6)
- [ ] **Day 1**: Phase 5.1 (StreamCard — largest streaming migration)
- [ ] **Day 2**: Phase 5.2–5.5 (Stream display, video player, chat, analytics)
- [ ] **Day 3**: Phase 6.1 (PhotoSlideshowCreator — largest component)
- [ ] **Day 4**: Phase 6.2–6.4 (Remaining slideshow components)
- [ ] **Day 5**: Regression testing all streaming and media flows

### Week 5: Block Editor + Remaining + Polish (Phases 7–10)
- [ ] **Day 1**: Phase 7 (Block editor + renderers — XSS fixes)
- [ ] **Day 2**: Phase 8 (Profile, admin sub-components, registration, mobile)
- [ ] **Day 3**: Phase 9 ($props typing pass)
- [ ] **Day 4**: Phase 10 (Accessibility)
- [ ] **Day 5**: Final QA, update documentation, close out

---

## Success Criteria

| Criteria | Measurement |
|----------|-------------|
| Zero `alert()` in production components | `grep -r "alert(" src/ --include="*.svelte"` returns 0 (excluding dev/test) |
| Zero `confirm()` in production components | `grep -r "confirm(" src/ --include="*.svelte"` returns 0 |
| Zero unintentional `location.reload()` | Only 2 documented exceptions remain |
| Zero unsanitized `{@html}` | All 15 instances wrapped with `sanitizeHtml()` |
| All route pages have `<svelte:boundary>` | Spot check + grep |
| All `$props()` typed | `grep -r "= \$props()" src/ --include="*.svelte"` — all have type annotations |
| Console.log reduced to 0 in `.svelte` | Logger wrapper used everywhere |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Toast/confirm dialog breaks existing flows | HIGH | Build Phase 1 with 100% test coverage, then migrate one file at a time |
| `invalidateAll()` doesn't refresh all needed data | MEDIUM | Test each `location.reload()` replacement individually — some may need `goto()` with `invalidate` |
| DOMPurify strips legitimate embed iframes | HIGH | Test allowlist with all known embed types (YouTube, Vimeo, Mux, custom) before deploying |
| 93KB PhotoSlideshowCreator is too complex to migrate safely | MEDIUM | Migrate in sub-phases: alerts first, then console.log, then error boundary |
| StreamCard 29KB has deeply nested fetch/reload patterns | MEDIUM | Consider refactoring StreamCard into smaller components alongside migration |

---

*Document Version: 1.0*  
*Created: February 19, 2026*  
*Total Tasks: ~120*  
*Estimated Duration: 5 weeks*  
*Cross-referenced against: `2-17-26-markdown-review.md` v1.2, full codebase grep audit*
