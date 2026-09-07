# WBS Master Review & Codebase Cross-Reference

**Date:** February 17, 2026  
**Purpose:** Comprehensive review of all 7 WBS documents cross-referenced against the actual codebase. Identifies what is complete, incomplete, orphaned, missing, contradictory, and undocumented.

---

## 1. Document Inventory

| # | Document | Focus Area | Created | Last Updated |
|---|----------|------------|---------|--------------|
| 1 | `WBS_MEMORIAL_PAGE_PUBLIC.md` | Public memorial page — read-only Firestore interactions | Jan 22, 2026 | Jan 22, 2026 |
| 2 | `WBS_MEMORIAL_PAGE_ADMIN.md` | Admin memorial list + detail pages — full CRUD | Jan 22, 2026 | Jan 22, 2026 |
| 3 | `WBS_MEMORIAL_COMPARISON.md` | Side-by-side diff of Public vs Admin pages | Jan 22, 2026 | Jan 22, 2026 |
| 4 | `WBS_EMAIL_AUDIT_SYSTEM.md` | Email audit logging system | Jan 29, 2026 | Jan 29, 2026 |
| 5 | `WBS_CALCULATOR_SYSTEM.md` | Booking calculator / pricing wizard | Jan 30, 2026 | Jan 30, 2026 |
| 6 | `WBS_ADMIN_PROFILE_PAGE.md` | Admin profile page (proposed) | Jan 30, 2026 | Jan 30, 2026 |
| 7 | `WBS_ADMIN_MEMORIAL_DETAILS_SVELTE5_AUDIT.md` | Svelte 5 best-practices audit of admin detail page | Jan 22, 2026 | Jan 22, 2026 |

---

## 2. Subsystem Completion Status

### Legend
- ✅ **Complete** — code exists and matches WBS description
- ⚠️ **Partial** — some items built, others missing
- ❌ **Not Built** — code does not exist
- 📄 **Doc Only** — WBS document exists but is reference-only (no action items)
- 🔄 **Stale** — WBS document does not reflect current codebase state

| Subsystem | WBS Status Claim | Actual Codebase Status | Verdict |
|-----------|-----------------|----------------------|---------|
| Public Memorial Page | Documented as implemented | All files verified present | ✅ Complete |
| Admin Memorial List Page | Documented as implemented | All files verified present | ✅ Complete |
| Admin Memorial Detail Page | Documented as implemented | All files present + undocumented additions | ⚠️ Partial (doc outdated) |
| Public vs Admin Comparison | Reference document | N/A — no action items | 📄 Doc Only |
| Email Audit System | Phases 1–3 checkboxes updated | Phase 1 fully built, Phases 2–3 mostly built, Phase 4 not built | ⚠️ Partial |
| Calculator System | Documented as existing | All files verified present | ✅ Complete |
| Admin Profile Page | Proposed as new feature | Route does not exist | ❌ Not Built |
| Svelte 5 Migration | Audit complete, fixes proposed | Some fixes applied, most pending | ⚠️ Partial |

---

## 3. Public Memorial Page (Doc 1) — Codebase Cross-Reference

### Route Files

| WBS Reference | Expected Path | Exists | Notes |
|---------------|---------------|--------|-------|
| Server load | `src/routes/[fullSlug]/+page.server.ts` | ✅ | 279 lines, matches WBS description |
| Client page | `src/routes/[fullSlug]/+page.svelte` | ✅ | 861 lines |

### Components Referenced

| WBS Reference | Expected Path | Exists | Notes |
|---------------|---------------|--------|-------|
| MemorialStreamDisplay | `src/lib/components/MemorialStreamDisplay.svelte` | ✅ | Real-time `onSnapshot()` listeners |
| SlideshowSection | `src/lib/components/SlideshowSection.svelte` | ✅ | |
| MuxVideoPlayer | `src/lib/components/streaming/MuxVideoPlayer.svelte` | ✅ | |
| LiveChatWidget | `src/lib/components/streaming/LiveChatWidget.svelte` | ✅ | |
| CountdownVideoPlayer | `src/lib/components/CountdownVideoPlayer.svelte` | ✅ | 483-line standalone component. Displays a styled video placeholder with scheduled date/time when a livestream is scheduled. Used in `MemorialStreamDisplay.svelte` for the "Upcoming Service" section. |

### Server Load Operations — Verified Against Code

| WBS Task | WBS Description | Code Verification |
|----------|----------------|-------------------|
| 1.1 | Query `memorials` by `fullSlug` | ✅ `adminDb.collection('memorials').where('fullSlug', '==', fullSlug).limit(1).get()` |
| 1.2 | Query `streams` by `memorialId` | ✅ `adminDb.collection('streams').where('memorialId', '==', memorial.id).get()` |
| 1.3 | Filter `isDeleted !== true` | ✅ `.filter(doc => doc.data().isDeleted !== true)` |
| 1.4 | Filter `isVisible !== false` | ✅ `.filter(stream => stream.isVisible !== false)` |
| 1.5 | Query `slideshows` subcollection | ✅ `.collection('slideshows').orderBy('createdAt', 'desc').get()` |

### Permission Logic — Verified

```
WBS says:
  isPublic === true || userRole === 'admin' || ownerUid === userId || funeralDirectorUid === userId

Code says (line ~215-219 of +page.server.ts):
  memorial.isPublic === true || userRole === 'admin' || memorialData.ownerUid === userId || memorialData.funeralDirectorUid === userId
```
**Verdict: ✅ Exact match**
https://tributestream.com/celebration-of-life-for-myrna-l-szczepanski 
### Data Fields — Deviations Found

| WBS Field | In Code | Notes |
|-----------|---------|-------|
| All fields listed in WBS Section 3 | ✅ | Present in server load |
| `contentBlocks` | ✅ | **NOT in WBS** — added after doc was written |
| `contentBlocksVersion` | ✅ | **NOT in WBS** — added after doc was written |
| `emergencyChatEmbed` | ✅ | **NOT in WBS** — separate from `emergencyEmbed` |

### ~~Components NOT in WBS but Used in Public Page~~ ✅ Added to WBS (Feb 19, 2026)

All 4 components below are now documented in `WBS_MEMORIAL_PAGE_PUBLIC.md` Section 2 (Component Inventory):

| Component | Path | Purpose |
|-----------|------|---------|
| `BlockRenderer` | `src/lib/components/memorial/BlockRenderer.svelte` | Renders content blocks (replaces legacy layout) |
| `BookingReminderBanner` | `src/lib/components/BookingReminderBanner.svelte` | Displays booking reminder to memorial owners |
| `EmbedRenderer` | `src/lib/components/memorial/EmbedRenderer.svelte` | Renders embed blocks |
| `TextRenderer` | `src/lib/components/memorial/TextRenderer.svelte` | Renders text blocks |

### Public Page Summary

**WBS Accuracy: ~85%** — Core data flow is correct. Missing documentation for the content blocks system (`contentBlocks`, `BlockRenderer`) which appears to be the newer rendering path replacing legacy `custom_html`. The WBS data flow diagram still shows the old architecture.

---

## 4. Admin Memorial Pages (Doc 2) — Codebase Cross-Reference

### Route Files

| WBS Reference | Expected Path | Exists | Notes |
|---------------|---------------|--------|-------|
| List server | `src/routes/admin/services/memorials/+page.server.ts` | ✅ | 120 lines |
| List client | `src/routes/admin/services/memorials/+page.svelte` | ✅ | 303 lines |
| Detail server | `src/routes/admin/services/memorials/[memorialId]/+page.server.ts` | ✅ | 304 lines |
| Detail client | `src/routes/admin/services/memorials/[memorialId]/+page.svelte` | ✅ | 688 lines |

### API Endpoints

| WBS Reference | Expected Path | Exists | Notes |
|---------------|---------------|--------|-------|
| Bulk actions | `/api/admin/bulk-actions/+server.ts` | ✅ | |
| Display settings | `/api/admin/memorials/[id]/display-settings/+server.ts` | ✅ | |
| Custom pricing | `/api/admin/memorials/[id]/pricing/+server.ts` | ✅ | |
| Stream creation | `/api/memorials/[memorialId]/streams/+server.ts` | ✅ | |
| Emergency embed | `/api/memorials/[memorialId]/emergency-embed/+server.ts` | ⚠️ Deprecated | Marked deprecated Feb 19, 2026 — replaced by block editor embed blocks. File retained for backward compat. |
| Stream delete | `/api/streams/[streamId]/delete/+server.ts` | ✅ | |
| Chat toggle | `/api/streams/[streamId]/chat/toggle/+server.ts` | ✅ | |

### Detail Page Components — Verified

| WBS Component | Actual Component | Exists | Notes |
|---------------|-----------------|--------|-------|
| AdminLayout | `AdminLayout.svelte` | ✅ | |
| StreamCard | `streaming/StreamCard.svelte` | ✅ | |
| CustomPricingEditor | `admin/CustomPricingEditor.svelte` | ✅ | |
| Display Settings Form | Inline in `+page.svelte` | ✅ | Not a separate component |
| Stream Creation Form | — | ❌ → ✅ Removed | ~~WBS said it existed~~ — Old Section 3.3 removed from WBS. Streams created via block editor. `CreateStreamModal.svelte` (empty orphan) deleted. |
| Emergency Embed Form | — | ❌ → ✅ Removed | ~~WBS said it existed~~ — Old Section 3.4 removed from WBS. API endpoints `emergency-embed/`, `emergency-chat-embed/`, `video-file/` deprecated (files retained for backward compat). |

### ~~Components NOT in WBS but Used in Admin Detail Page~~ ✅ Added to WBS (Feb 19, 2026)

All components below are now documented in `WBS_MEMORIAL_PAGE_ADMIN.md` Section 3 (Component Inventory), with cross-references to `WBS_BLOCK_EDITOR_SYSTEM.md` and `1-22-26_CHAT_SYSTEM_WBS.md`.

| Component | Path | Purpose |
|-----------|------|---------|
| `MemorialBlockEditor` | `src/lib/components/admin/memorial-editor/MemorialBlockEditor.svelte` | WYSIWYG block editor for memorial content |
| `BlockItem` | `src/lib/components/admin/memorial-editor/BlockItem.svelte` | Individual block in editor |
| `BlockList` | `src/lib/components/admin/memorial-editor/BlockList.svelte` | Sortable block list |
| `BlockToolbar` | `src/lib/components/admin/memorial-editor/BlockToolbar.svelte` | Block editing toolbar |
| `AddBlockModal` | `src/lib/components/admin/memorial-editor/modals/AddBlockModal.svelte` | Add new block modal |
| `EditEmbedModal` | `src/lib/components/admin/memorial-editor/modals/EditEmbedModal.svelte` | Edit embed block |
| `EditLivestreamModal` | `src/lib/components/admin/memorial-editor/modals/EditLivestreamModal.svelte` | Edit livestream block |
| `EditTextModal` | `src/lib/components/admin/memorial-editor/modals/EditTextModal.svelte` | Edit text block |
| `AdminScheduleEditor` | `src/lib/components/admin/AdminScheduleEditor.svelte` | Schedule & billing editor |
| `AdminChatPanel` | `src/lib/components/admin/AdminChatPanel.svelte` | Chat moderation per stream |
| `FilterBuilder` | `src/lib/components/admin/FilterBuilder.svelte` | Dynamic filter UI for list page |
| `EmbedBlock` | `src/lib/components/admin/memorial-editor/blocks/EmbedBlock.svelte` | Embed block display in editor |
| `LivestreamBlock` | `src/lib/components/admin/memorial-editor/blocks/LivestreamBlock.svelte` | Livestream block display in editor |
| `TextBlock` | `src/lib/components/admin/memorial-editor/blocks/TextBlock.svelte` | Text block display in editor |

### Switcher Route (undocumented in WBS)

| Route | Path | Notes |
|-------|------|-------|
| Switcher server | `src/routes/admin/services/memorials/[memorialId]/switcher/+page.server.ts` | Video switcher page server |
| Switcher client | `src/routes/admin/services/memorials/[memorialId]/switcher/+page.svelte` | Video switcher page UI |

### ~~API Endpoints NOT in WBS but Exist~~ ✅ Added to WBS (Feb 19, 2026)

All active endpoints below are now documented in `WBS_MEMORIAL_PAGE_ADMIN.md` Sections 4.1–4.8, with cross-references to `WBS_BLOCK_EDITOR_SYSTEM.md` and `1-22-26_CHAT_SYSTEM_WBS.md`.

| Endpoint | Purpose |
|----------|---------|
| `/api/memorials/[memorialId]/force-refresh/+server.ts` | Force-reload memorial page for all viewers |
| `/api/memorials/[memorialId]/blocks/+server.ts` | CRUD for content blocks |
| `/api/memorials/[memorialId]/blocks/[blockId]/+server.ts` | Individual block operations |
| `/api/memorials/[memorialId]/blocks/livestream/+server.ts` | Livestream block management |
| `/api/memorials/[memorialId]/blocks/reorder/+server.ts` | Reorder blocks |
| `/api/memorials/[memorialId]/blocks/sync/+server.ts` | Sync blocks with streams |
| `/api/memorials/[memorialId]/emergency-chat-embed/+server.ts` | ⚠️ Deprecated Feb 19, 2026 — file retained for backward compat |
| `/api/memorials/[memorialId]/embeds/+server.ts` | Embed management |
| `/api/memorials/[memorialId]/slideshow/+server.ts` | Slideshow CRUD |
| `/api/memorials/[memorialId]/slideshow/[slideshowId]/+server.ts` | Individual slideshow operations |
| `/api/memorials/[memorialId]/slideshow-embed/+server.ts` | Slideshow embed |
| `/api/streams/[streamId]/analytics/+server.ts` | Stream analytics |
| `/api/streams/[streamId]/check-live/+server.ts` | Check if stream is live |
| `/api/streams/[streamId]/check-status/+server.ts` | Check stream status |
| `/api/streams/[streamId]/embed/+server.ts` | Stream embed URL |
| `/api/streams/[streamId]/schedule/+server.ts` | Stream schedule management |
| `/api/streams/[streamId]/status/+server.ts` | Update stream status |
| `/api/streams/[streamId]/title/+server.ts` | Update stream title |
| `/api/streams/[streamId]/visibility/+server.ts` | Toggle stream visibility |
| `/api/streams/[streamId]/chat/lock/+server.ts` | Lock/unlock chat |
| `/api/streams/[streamId]/chat/messages/+server.ts` | Chat messages API |
| `/api/streams/[streamId]/chat/messages/[messageId]/+server.ts` | Individual chat message operations |
| `/api/memorials/[memorialId]/chat/+server.ts` | Memorial-level chat API |
| `/api/memorials/[memorialId]/chat/[chatId]/+server.ts` | Individual chat operations |
| `/api/memorials/[memorialId]/follow/+server.ts` | Memorial follow/unfollow |
| `/api/memorials/[memorialId]/assign/+server.ts` | Assign memorial to user |
| `/api/memorials/[id]/+server.ts` | Memorial by ID (generic) |
| `/api/memorials/search/+server.ts` | Memorial search |
| `/api/memorials/[memorialId]/video-file/+server.ts` | ⚠️ Deprecated — video file upload, retained for backward compat |

### ~~Deprecated Features Still in WBS~~ ✅ RESOLVED (Feb 19, 2026)

All deprecated code and WBS references have been cleaned up:
- `emergencyEmbed`, `emergencyChatEmbed`, `videoFile` — removed from server loads, API endpoint files deprecated (marked with `// DEPRECATED` header, retained for backward compat)
- `publicNote` — removed from server loads and display settings GET response
- Type definitions retained in `memorial.ts` with `@deprecated REMOVED` markers for Firestore backward compat
- `WBS_MEMORIAL_PAGE_ADMIN.md` updated — deprecated sections removed, data fields cleaned

### Admin Pages Summary

**WBS Accuracy: ~95% (updated Feb 19, 2026)** — Component inventory (Section 3), full API endpoint listing (Sections 4.1–4.8), data flow diagram, and data fields are now current. Block editor documented via cross-reference to `WBS_BLOCK_EDITOR_SYSTEM.md`. Deprecated flows removed.

---

## 5. Public vs Admin Comparison (Doc 3) — Cross-Reference

**WBS Accuracy: ~95% (updated Feb 19, 2026)** — All 4 gaps resolved:

| Issue | Resolution |
|-------|------------|
| ~~Missing `contentBlocks`~~ | ✅ Added `contentBlocks` + `contentBlocksVersion` to field comparison, replaced `emergencyEmbed`/`publicNote` |
| ~~Component trees outdated~~ | ✅ Both trees updated — public now shows `BlockRenderer` → `EmbedRenderer`/`TextRenderer`/`MemorialStreamDisplay`; admin now shows `MemorialBlockEditor`, `AdminScheduleEditor`, `AdminChatPanel` |
| ~~API list incomplete~~ | ✅ Admin API table expanded from 7 to ~20 routes (blocks, streams, slideshows, force-refresh, pricing, chat) |
| ~~Real-time features~~ | ✅ Clarified: `AdminChatPanel` uses `fetch()` polling, not `onSnapshot()` — admin has no real-time listeners |

---

## 6. Email Audit System (Doc 4) — Codebase Cross-Reference

### ⚠️ PARTIALLY STALE — Implementation Schedule checkboxes updated (Phase 1–3 checked), but Phase 1 task tables still use non-checkbox format

### Phase 1: Data Model & Core Logging

| WBS Task | Status | Codebase Evidence |
|----------|--------|-------------------|
| **1.1.1** Define `email_audit_logs` collection schema | ✅ **DONE** | Collection is written to in `emailAudit.ts` |
| **1.1.2** Create TypeScript interface for EmailAuditLog | ✅ **DONE** | `src/lib/types/email-audit.ts` — 105 lines |
| **1.1.3** Add Firestore indexes for common queries | ❓ **Unknown** | Would need to check `firestore.indexes.json` |
| **1.2.1** Create `src/lib/server/emailAudit.ts` service | ✅ **DONE** | 235 lines, fully implemented |
| **1.2.2** Implement `logEmailSent()` function | ✅ **DONE** | Lines 82-117 |
| **1.2.3** Implement `logEmailFailed()` function | ✅ **DONE** | Lines 122-159 |
| **1.2.4** Implement `logEmailMocked()` function | ✅ **DONE** | Lines 164-195 |
| **1.2.5** Add helper to sanitize sensitive data | ✅ **DONE** | `sanitizeForLog()` — lines 19-68 |

### Phase 1.3: Integration into email.ts

All 14 email functions have audit logging integrated:

| WBS Task | Email Function | Integrated | Evidence |
|----------|---------------|------------|---------|
| **1.3.1** | `sendEnhancedRegistrationEmail()` | ✅ | `buildLogParams('enhanced_registration', ...)` |
| **1.3.2** | `sendRegistrationEmail()` | ✅ | `buildLogParams('basic_registration', ...)` |
| **1.3.3** | `sendFuneralDirectorRegistrationEmail()` | ✅ | `buildLogParams('funeral_director_registration', ...)` |
| **1.3.4** | `sendInvitationEmail()` | ✅ | `buildLogParams('invitation', ...)` |
| **1.3.5** | `sendEmailChangeConfirmation()` | ✅ | `buildLogParams('email_change_confirmation', ...)` |
| **1.3.6** | `sendPaymentConfirmationEmail()` | ✅ | `buildLogParams('payment_confirmation', ...)` |
| **1.3.7** | `sendPaymentActionRequiredEmail()` | ✅ | `buildLogParams('payment_action_required', ...)` |
| **1.3.8** | `sendPaymentFailureEmail()` | ✅ | `buildLogParams('payment_failure', ...)` |
| **1.3.9** | `sendPasswordResetEmail()` | ✅ | `buildLogParams('password_reset', ...)` |
| **1.3.10** | `sendOwnerWelcomeEmail()` | ✅ | `buildLogParams('owner_welcome', ...)` |
| **1.3.11** | `sendFuneralDirectorWelcomeEmail()` | ✅ | `buildLogParams('funeral_director_welcome', ...)` |
| **1.3.12** | `sendContactFormEmails()` | ✅ | `buildLogParams('contact_form_support', ...)` + `buildLogParams('contact_form_confirmation', ...)` |
| **1.3.13** | `sendInvoiceEmail()` | ✅ | `buildLogParams('invoice', ...)` |
| **1.3.14** | `sendInvoiceReceiptEmail()` | ✅ | `buildLogParams('invoice_receipt', ...)` |

### ~~Additional Implementation Detail Not in WBS~~ ✅ Added to WBS (Feb 19, 2026)

Both items below have been added to `WBS_EMAIL_AUDIT_SYSTEM.md`:

- **`buildLogParams()`** helper function — now documented in WBS (simplifies integration across all 14 email functions)
- **`sanitizeForLog()` expanded masking** — `confirmationUrl` and `calculatorMagicLink` token masking now documented in WBS

### Phase 2: Admin API Endpoints

| WBS Task | Status | Notes |
|----------|--------|-------|
| **2.1.1** `GET /api/admin/email-logs` (list) | ✅ **BUILT** (Feb 19, 2026) | Pagination, filters (type, status, to, memorialId, date range) |
| **2.1.2** `GET /api/admin/email-logs/[id]` (detail) | ✅ **BUILT** (Feb 19, 2026) | Returns full `EmailAuditLog` with serialized timestamps |
| **2.1.3** `POST /api/admin/email-logs/[id]/resend` | ✅ **BUILT** (Feb 19, 2026) | Type→function dispatch, optional recipient override, admin audit logged |
| **2.1.4** `GET /api/admin/email-logs/stats` | ⏭️ **SKIPPED** | Stats computed inline in page server load instead |

### Phase 3: Admin UI

| WBS Task | Status | Notes |
|----------|--------|-------|
| **3.1.1-3.1.7** Email logs list page | ✅ **BUILT** (Feb 19, 2026) | `DataGrid` + `FilterBuilder` + stats bar + pagination at `/admin/system/email-logs` |
| **3.2.1-3.2.6** Email log detail view | ✅ **BUILT** (Feb 19, 2026) | `EmailLogDetail.svelte` modal — JSON viewer, related entity links, resend with confirmation |
| **3.3.1** Email logs link in admin nav | ✅ **BUILT** (Feb 19, 2026) | 📧 Email Logs added to System domain in sidebar |
| **3.3.2-3.3.3** Integration with memorial/user detail | ⏭️ **DEFERRED** | Can add "Email History" sections later |

### Phase 4: Testing & Documentation

| WBS Task | Status | Notes |
|----------|--------|-------|
| **4.1.1-4.1.5** All tests | ❌ **NOT BUILT** | |
| **4.2.1-4.2.3** Documentation updates | ❌ **NOT BUILT** | |

### Types — Comparison: WBS Spec vs Actual Code

The actual `email-audit.ts` types file includes two interfaces NOT in the WBS:

| Type | In WBS | In Code | Notes |
|------|--------|---------|-------|
| `EmailAuditLog` | ✅ | ✅ | Match — code uses `Record<string, unknown>` instead of `Record<string, any>` |
| `EmailType` | ✅ | ✅ | Exact match — same 14 types |
| `LogEmailParams` | ❌ | ✅ | **Not in WBS** — extracted as separate interface |
| `EmailAuditLogListItem` | ❌ | ✅ | **Not in WBS** — prepared for future list API |
| `EmailAuditStats` | ❌ | ✅ | **Not in WBS** — prepared for future stats API |
| `EmailStatus` | ❌ | ✅ | **Not in WBS** — extracted as type alias |
| `EmailEnvironment` | ❌ | ✅ | **Not in WBS** — extracted as type alias |

### Email Audit Summary

**WBS Accuracy: ~75% (updated Feb 19, 2026)** — Phase 1 is 100% complete, Phases 2–3 mostly built. The WBS Implementation Schedule checkboxes are now checked for Phase 1, 2.1, 3.1–3.3.1. Phase 3.3.2–3.3.3 deferred. Phase 4 (testing & docs) genuinely not built. Additional types/helpers (`buildLogParams`, expanded `sanitizeForLog`) documented in WBS.

---

## 7. Calculator System (Doc 5) — Codebase Cross-Reference

### UI Components

| WBS Reference | Expected Path | Exists | WBS Lines | Notes |
|---------------|---------------|--------|-----------|-------|
| Calculator.svelte | `src/lib/components/calculator/Calculator.svelte` | ✅ | 628 | Main orchestrator |
| TierSelector.svelte | `src/lib/components/calculator/TierSelector.svelte` | ✅ | 77 | Tier selection |
| BookingForm.svelte | `src/lib/components/calculator/BookingForm.svelte` | ✅ | 332 | Service details |
| Summary.svelte | `src/lib/components/calculator/Summary.svelte` | ✅ | 129 | Pricing summary |
| StripeCheckout.svelte | `src/lib/components/calculator/StripeCheckout.svelte` | ✅ | 162 | Payment |

### Route Files

| WBS Reference | Expected Path | Exists | Notes |
|---------------|---------------|--------|-------|
| Calculator page | `src/routes/app/calculator/+page.svelte` | ✅ | |
| Calculator server | `src/routes/app/calculator/+page.server.ts` | ✅ | |
| Schedule landing | `src/routes/schedule/+page.svelte` | ✅ | |
| Schedule memorial | `src/routes/schedule/[memorialId]/+page.svelte` | ✅ | |
| Schedule memorial server | `src/routes/schedule/[memorialId]/+page.server.ts` | ✅ | |

### Additional Route Files NOT in WBS

| Path | Purpose |
|------|---------|
| `src/routes/schedule/[memorialId]/_components/EditRequestModal.svelte` | Edit request modal |
| `src/routes/schedule/[memorialId]/_components/ScheduleReceipt.svelte` | Schedule receipt display |
| `src/routes/schedule/new/+page.svelte` | New schedule page |

### API Endpoints

| WBS Reference | Expected Path | Exists |
|---------------|---------------|--------|
| Schedule save | `/api/memorials/[memorialId]/schedule/+server.ts` | ✅ |
| Auto-save | `/api/memorials/[memorialId]/schedule/auto-save/+server.ts` | ✅ |
| Sync calculator | `/api/memorials/[memorialId]/sync-calculator/+server.ts` | ✅ |
| Stream creation | `/api/memorials/[memorialId]/streams/+server.ts` | ✅ |
| Payment intent | `/api/create-payment-intent/+server.ts` | ✅ |

### Additional API NOT in WBS

| Path | Purpose |
|------|---------|
| `/api/memorials/[memorialId]/schedule/request-edit/+server.ts` | Schedule edit request workflow |

### Type Definitions

| WBS Reference | Expected Path | Exists |
|---------------|---------------|--------|
| livestream.ts | `src/lib/types/livestream.ts` | ✅ |
| memorial.ts | `src/lib/types/memorial.ts` | ✅ |
| stream.ts | `src/lib/types/stream.ts` | ✅ |

### Configuration & Utilities

| WBS Reference | Expected Path | Exists |
|---------------|---------------|--------|
| pricing.ts | `src/lib/config/pricing.ts` | ✅ |
| streamMapper.ts | `src/lib/utils/streamMapper.ts` | ✅ |
| useAutoSave.ts | `src/lib/composables/useAutoSave.ts` | ✅ |

### Test Files

| WBS Reference | Expected Path | Exists |
|---------------|---------------|--------|
| Calculator.test.ts | `src/lib/components/calculator/Calculator.test.ts` | ✅ |
| Calculator.simple.test.ts | `src/lib/components/calculator/Calculator.simple.test.ts` | ✅ |
| schedule page test | `src/routes/schedule/page.test.ts` | ✅ |
| schedule test | `src/routes/schedule/schedule.test.ts` | ✅ |

### Additional Files NOT in WBS

| Path | Purpose |
|------|---------|
| `src/lib/composables/useAutoSave.test.ts` | Auto-save unit tests |
| `src/lib/composables/useFormAutoSave.ts` | Form-specific auto-save variant |
| `src/lib/types/schedule-edit-request.ts` | Schedule edit request types |

### Calculator Known Issues — Verified Against Code

| WBS Issue | Still Present | Evidence |
|-----------|--------------|---------|
| Duplicated tier data in TierSelector | ✅ Yes | TierSelector has hardcoded tier data |
| Legacy type aliases (standard/premium) | ❓ Needs verification | `Tier` type definition in livestream.ts |
| Stream deletion disabled | ❓ Needs verification | streamMapper.ts commented code |
| Multiple payment flows overlap | ✅ Yes | "Pay Now" vs "Continue to Payment" in Calculator.svelte |
| Verbose console.log statements | ✅ Yes | Throughout Calculator.svelte |
| Basic form validation | ✅ Yes | Simple checks, no visual feedback |

### Calculator Summary

**WBS Accuracy: ~95%** — Most comprehensive and accurate WBS document. Minor omissions: `EditRequestModal`, `ScheduleReceipt`, `useFormAutoSave.ts`, and the schedule edit request flow.

---

## 8. Admin Profile Page (Doc 6) — Codebase Cross-Reference

### ❌ ENTIRE FEATURE IS NOT BUILT

| WBS Item | Expected | Exists |
|----------|----------|--------|
| Route `/admin/profile` | `src/routes/admin/profile/` | ❌ **Directory does not exist** |
| `+page.svelte` | `src/routes/admin/profile/+page.svelte` | ❌ |
| `+page.server.ts` | `src/routes/admin/profile/+page.server.ts` | ❌ |
| `AdminProfileHeader.svelte` | `src/lib/components/admin/profile/AdminProfileHeader.svelte` | ❌ |
| `PersonalInfoForm.svelte` | `src/lib/components/admin/profile/PersonalInfoForm.svelte` | ❌ |
| `RolePermissions.svelte` | `src/lib/components/admin/profile/RolePermissions.svelte` | ❌ |
| `SecuritySettings.svelte` | `src/lib/components/admin/profile/SecuritySettings.svelte` | ❌ |
| `ActivityLogPanel.svelte` | `src/lib/components/admin/profile/ActivityLogPanel.svelte` | ❌ |
| `NotificationPrefs.svelte` | `src/lib/components/admin/profile/NotificationPrefs.svelte` | ❌ |
| `GET /api/admin/profile` | API endpoint | ❌ |
| `PATCH /api/admin/profile` | API endpoint | ❌ |
| `POST /api/admin/profile/password` | API endpoint | ❌ |
| `GET /api/admin/profile/activity` | API endpoint | ❌ |
| `admin_preferences` collection | Firestore collection | ❌ |

### Dependencies — Status Verified

| Dependency | WBS Claim | Actual Status |
|------------|-----------|---------------|
| Admin auth system | ✅ Ready | ✅ Confirmed — `locals.user.role === 'admin'` pattern used throughout |
| Admin permissions | ✅ Ready | ✅ Confirmed — `src/lib/admin/permissions.ts` exists |
| Admin stores | ✅ Ready | ✅ Confirmed — `src/lib/stores/adminUser.ts` exists |
| Firebase Admin SDK | ✅ Ready | ✅ Confirmed — `src/lib/server/firebase.ts` used everywhere |
| Lucide icons | ✅ Ready | ✅ Confirmed — imported in public page components |
| Tailwind CSS | ✅ Ready | ✅ Confirmed — used throughout codebase |

### Admin Profile Summary

**WBS Accuracy: N/A (unbuilt)** — The document is a spec for a feature that has not been started. All dependencies exist as claimed. The feature is ready to be built.

---

## 9. Svelte 5 Audit (Doc 7) — Codebase Cross-Reference

### Admin Detail Page (`+page.svelte`) — Current State

The WBS audit was done when the file was 860 lines. It is now **688 lines**, indicating significant refactoring has occurred since the audit.

### Already Migrated (WBS says ✅, Code confirms ✅)

| Item | WBS Claim | Code Verification |
|------|-----------|-------------------|
| `$state` for reactive variables | ✅ | ✅ `$state` used for `streams`, `isEditingDisplay`, `isSavingDisplay`, etc. |
| `$props()` destructuring | ✅ | ✅ `let { data } = $props()` |
| `onclick` syntax | ✅ | ✅ All event handlers use `onclick` |
| TypeScript enabled | ✅ | ✅ `<script lang="ts">` |

### Migration Items — Current Status

| WBS Item | WBS Status | Actual Status | Evidence |
|----------|-----------|---------------|---------|
| Replace `location.reload()` with `invalidateAll()` | ❌ Unfixed | ⚠️ **Partially fixed** | Detail page: 0 `location.reload()` calls, uses `invalidateAll()` for display settings and pricing. **List page still has 3 `location.reload()` calls** |
| Replace `alert()`/`confirm()` with UI components | ❌ Unfixed (14 instances) | ⚠️ **Still present** | Detail page: 6 `alert()` + 3 `confirm()`. List page: 3 `alert()` + 1 `confirm()`. Calculator: ~9 `alert()` + 1 `confirm()`. Public page: 1 `alert()` |
| Type the `$props()` interface | ❌ Unfixed | ❌ **Still untyped** | `let { data } = $props()` — no interface |
| Add `$derived` for computed values | ❌ Unfixed | ⚠️ **Partially done** | `publicUrl` is still a plain `const`, not `$derived`. But `filteredMemorials` on list page uses `$derived.by()` |
| Add `$effect` for side effects | ❌ Unfixed | ❌ **Not added** | No `$effect` on admin detail page |
| Add `<svelte:boundary>` error handling | ❌ Unfixed | ❌ **Not added** | |
| Add keyboard handlers | ❌ Unfixed | ❌ **Not added** | No Escape key handling for forms |
| Improve accessibility | ❌ Unfixed | ❌ **Not added** | No ARIA live regions, no focus management |

### WBS File Structure — Outdated

The WBS (Section 1.1) says the detail page is **860 lines**. The actual file is now **688 lines**. The reduction is because:
- Stream creation form was removed (now handled via block editor)
- Emergency embed form was removed (now deprecated, replaced by embed blocks)
- The `MemorialBlockEditor` component absorbs much of the previous inline functionality

### WBS Components — Changes

| WBS Component | WBS Status | Actual Status |
|--------------|-----------|---------------|
| AdminLayout | ✅ Used | ✅ Still used |
| StreamCard | ✅ Used | ✅ Still used (read-only display) |
| CustomPricingEditor | ✅ Used | ✅ Still used |
| Stream creation form | ✅ Inline | ❌ **Removed** — replaced by block editor |
| Emergency embed form | ✅ Inline | ❌ **Removed** — deprecated, replaced by embed blocks |
| MemorialBlockEditor | — | ✅ **Added** — not in WBS |
| AdminScheduleEditor | — | ✅ **Added** — not in WBS |
| AdminChatPanel | — | ✅ **Added** — not in WBS |

### New Functions Not in WBS

| Function | Purpose | Lines |
|----------|---------|-------|
| `handleForceRefresh()` | Force-reload memorial page for all viewers | ~135-160 |
| `handleSaveDisplaySettings()` | Save custom title (replaces publicNote flow) | ~98-129 |
| `cancelDisplayEdit()` | Cancel display settings editing | ~162-166 |
| `clearDisplaySettings()` | Clear custom title | ~168-199 |

### Svelte 5 Audit Summary

**WBS Accuracy: ~50%** — The audit identified real issues, but the page has been significantly refactored since the audit was written. The file is 172 lines shorter. Several inline forms (stream creation, emergency embed) no longer exist. Some `location.reload()` calls were fixed on the detail page but persist on the list page. The `alert()`/`confirm()` issue remains across both pages.

---

## 10. Contradictions & Deviations Across Documents

### 10.1 Audit Log Collection Naming — 4 Different Names

| Document | Collection Name | Context |
|----------|----------------|---------|
| Doc 2 (Admin) | `admin_audit_logs` | Bulk actions logging |
| Doc 2 (Admin) | `auditLogs` | Display settings logging |
| Doc 4 (Email) | `email_audit_logs` | Email audit logging |
| Doc 6 (Profile) | `audit_logs` | Admin activity logging |

**Codebase reality:**
- `admin_audit_logs` — used in `/api/admin/bulk-actions/+server.ts`
- `auditLogs` — used in `/api/admin/memorials/[id]/display-settings/+server.ts`
- `email_audit_logs` — used in `src/lib/server/emailAudit.ts`
- `audit_logs` — proposed only, not built (Doc 6 is unbuilt)
- An `audit-logs` **API route** exists at `/api/admin/audit-logs/+server.ts` (not documented in any WBS)

**Impact:** No unified audit strategy. Three separate collections for the same concept.

### 10.2 Emergency Embed — ~~WBS says active, Code says deprecated~~ ✅ RESOLVED (Feb 17, 2026)

| Document | Claim | Resolution |
|----------|-------|------------|
| Doc 1 (Public) | `emergencyEmbed` field is read and displayed | ✅ Deprecation notice added to doc header |
| Doc 2 (Admin) | Emergency Embed API is an active feature (Section 3.4) | ✅ Deprecation notice added to doc header |
| Doc 3 (Comparison) | Lists emergency embed as active write operation | ✅ Deprecation notice added to doc header |
| Doc 7 (Audit) | Audits emergency embed create/remove handlers | ✅ Deprecation notice added to doc header |

**Migration completed:**
- `emergencyEmbed` and `emergencyChatEmbed` **removed** from public page server load (`[fullSlug]/+page.server.ts`)
- **Removed** from admin detail page server load (`[memorialId]/+page.server.ts`)
- **Removed** from `MemorialStreamDisplay.svelte` (props, interfaces, rendering, CSS)
- Type definitions in `memorial.ts` marked `@deprecated REMOVED`
- Deprecated API endpoints (`emergency-embed/`, `emergency-chat-embed/`, `video-file/`) marked deprecated Feb 19, 2026 (files retained for backward compat until all memorials migrated)
- All 4 WBS docs updated with deprecation notices pointing to `WBS_BLOCK_EDITOR_SYSTEM.md`

### 10.3 Stream Creation — ~~WBS says inline form, Code uses block editor~~ ✅ RESOLVED (Feb 17, 2026)

| Document | Claim | Resolution |
|----------|-------|------------|
| Doc 2 (Admin Section 3.3) | Stream Creation Form exists inline in detail page | ✅ Deprecation notice added to doc header |
| Doc 7 (Audit Section 3.1) | Audits `handleCreateStream()` function | ✅ Deprecation notice added to doc header |

**Migration completed:** Stream creation is now exclusively handled through the block editor:
1. `MemorialBlockEditor` → `AddBlockModal` → `POST /api/memorials/{id}/blocks/livestream`
2. This atomically creates a Mux live stream + a livestream block
3. Documented in `WBS_BLOCK_EDITOR_SYSTEM.md` Section 5.1

### 10.4 Timestamp Handling Inconsistency

| Location | Format |
|----------|--------|
| Stream creation API (Doc 2 code) | `new Date().toISOString()` (string) |
| Audit log entries (Doc 2 code) | `new Date()` (Date object) |
| Email audit logs (emailAudit.ts) | `new Date()` (Date object) |
| Memorial fields (server load) | Firestore Timestamps → converted via `convertTimestamp()` |

No document addresses this inconsistency. The `convertTimestamp()` helper in the admin detail page server load handles the mismatch by normalizing everything to ISO strings.

### 10.5 Stream Visibility — Boolean vs String

| Document | Field | Type |
|----------|-------|------|
| Doc 1 (Public) | `isVisible` | boolean — used as filter |
| Doc 2 (Admin) | `visibility` | string — described as visibility setting |

**Codebase reality:** Both fields exist on stream documents:
- `isVisible` (boolean) — used for filtering: `.filter(stream => stream.isVisible !== false)`
- `visibility` (string, e.g. `'public'`) — stored on creation: `visibility: 'public'`

These are **two separate fields** serving different purposes, not a contradiction. But no WBS document explains the relationship.

### 10.6 Custom Pricing vs Calculator Config

| Document | Field | Description |
|----------|-------|-------------|
| Doc 5 (Calculator) | `memorial.customPricing` | Per-memorial custom pricing overrides |
| Doc 2 (Admin) | `calculatorConfig.totalPrice` | Payment/calculator state |

**Codebase reality:** Both exist as separate concerns:
- `customPricing` — admin-set pricing overrides (managed by `CustomPricingEditor`)
- `calculatorConfig` — user's booking state (tier, addons, totals, payment status)

The admin detail page loads both:
```typescript
calculatorConfig: cleanCalculatorConfig(memorialData.calculatorConfig),
customPricing: cleanCustomPricing(memorialData.customPricing),
```

Not contradictory, but the relationship is not explained in any WBS document.

### 10.7 publicNote — ~~WBS says active, Code says deprecated~~ ✅ RESOLVED (Feb 17, 2026)

| Document | Claim | Resolution |
|----------|-------|------------|
| Doc 1 (Public) | `publicNote` is read and displayed | ✅ Deprecation notice added to doc header |
| Doc 2 (Admin) | `publicNote` is managed via display settings API | ✅ Deprecation notice added to doc header |
| Doc 3 (Comparison) | `publicNote` listed as shared field | ✅ Deprecation notice added to doc header |

**Migration completed:**
- `publicNote` **removed** from public page server load (`[fullSlug]/+page.server.ts`)
- **Removed** from admin detail page server load (`[memorialId]/+page.server.ts`)
- **Removed** from display-settings GET response
- Type in `memorial.ts` marked `@deprecated REMOVED`
- Replacement: text blocks with `style: 'note'` via the block editor

---

## 11. Cross-Cutting Gaps

### 11.1 No Unified Toast/Notification System

**Referenced in:** Doc 7 (recommends replacing 14 `alert()` calls)  
**Exists in code:** No — `alert()` and `confirm()` are still used  

Current violations:
- Admin detail page: 6 `alert()`, 3 `confirm()`
- Admin list page: 3 `alert()`, 1 `confirm()`
- Public page: 1 `alert()` (copy link)
- Calculator: ~9 `alert()` (stream creation, validation errors, save feedback, payment errors) + 1 `confirm()` (auto-save restore)

### 11.2 No Unified API Wrapper

**Referenced in:** Doc 7 (recommends `apiRequest<T>()` utility)  
**Exists in code:** No — each component has its own `fetch()` + error handling pattern  

### 11.3 No Error Boundary Strategy

**Referenced in:** Doc 7 (recommends `<svelte:boundary>`)  
**Exists in code:** No `<svelte:boundary>` usage found  

### 11.4 No Unified Testing Strategy

**Referenced in:** Docs 4, 5, 6, 7 each mention testing independently  
**Test files found:**
- `Calculator.test.ts`, `Calculator.simple.test.ts`
- `schedule/page.test.ts`, `schedule/schedule.test.ts`
- `useAutoSave.test.ts`
- `api/admin/audit-logs/server.test.ts`

No unified test plan or coverage goals documented.

### 11.5 Security: Emergency Embed XSS

**Referenced in:** Doc 7 (Section 10.2) flags `{@html memorial.emergencyEmbed.embedCode}` as unsafe  
**Current state:** The public page uses `{@html (memorial as any).custom_html}` for legacy content rendering. The emergency embed system is deprecated but the `custom_html` rendering has the same XSS risk pattern with no sanitization documented.

### 11.6 Block Editor System — ~~Completely Undocumented~~ ✅ RESOLVED (Feb 17, 2026)

**`WBS_BLOCK_EDITOR_SYSTEM.md` created** — comprehensive documentation covering:
- 11 admin editor components, 3 public renderers, 6 API endpoints
- Type definitions, 20+ utility functions, sanitization allowlist
- 6 key data flows (add, reorder, toggle, edit, delete, public render)
- Migration mapping from each legacy system to block equivalents
- Security considerations (XSS, concurrency), 8 known issues
- Architecture diagram showing admin → API → Firestore → public rendering pipeline

---

## 12. Undocumented Components & APIs

### Admin Components Without WBS Documentation

| Component | Path | Used In |
|-----------|------|---------|
| `AdminScheduleEditor` | `src/lib/components/admin/AdminScheduleEditor.svelte` | Admin detail page |
| `AdminChatPanel` | `src/lib/components/admin/AdminChatPanel.svelte` | Admin detail page |
| `DataGrid` | `src/lib/components/admin/DataGrid.svelte` | Admin list page |
| `BulkActionBar` | `src/lib/components/admin/BulkActionBar.svelte` | Admin list page |
| `FilterBuilder` | `src/lib/components/admin/FilterBuilder.svelte` | Admin list page |

### Streaming Components Without WBS Documentation

| Component | Path | Notes |
|-----------|------|-------|
| `ChatModerationPanel` | `src/lib/components/streaming/ChatModerationPanel.svelte` | Related to AdminChatPanel |
| `CreateStreamModal` | `src/lib/components/streaming/CreateStreamModal.svelte` | ❌ Deleted Feb 19, 2026 — was empty orphan |
| `StreamAnalyticsDashboard` | `src/lib/components/streaming/StreamAnalyticsDashboard.svelte` | Analytics display |

### Additional Admin API Routes Without WBS Documentation

| Route | Purpose |
|-------|---------|
| `/api/admin/audit-logs/+server.ts` | Audit log API (has test file) |
| `/api/admin/blog/+server.ts` | Blog management |
| `/api/admin/cleanup-expired/+server.ts` | Cleanup expired data |
| `/api/admin/create-memorial/+server.ts` | Create memorial |
| `/api/admin/delete-funeral-director/+server.ts` | Delete funeral director |
| `/api/admin/delete-memorial/+server.ts` | Delete memorial (separate from bulk-actions) |
| `/api/admin/delete-user/+server.ts` | Delete user |
| `/api/admin/invoices/+server.ts` | Invoice management |
| `/api/admin/receipts/[receiptId]/note/+server.ts` | Receipt notes |
| `/api/admin/stats/+server.ts` | Admin dashboard stats |
| `/api/admin/switcher/broadcast/+server.ts` | Video switcher broadcast |
| `/api/admin/switcher/invite/+server.ts` | Video switcher invite |
| `/api/admin/toggle-memorial-status/+server.ts` | Toggle memorial status |
| `/api/admin/toggle-payment-status/+server.ts` | Toggle payment status |
| `/api/admin/update-funeral-director/+server.ts` | Update funeral director |
| `/api/admin/users/+server.ts` | Users API |
| `/api/admin/users/[uid]/activate/+server.ts` | Activate user |
| `/api/admin/users/[uid]/suspend/+server.ts` | Suspend user account |

### Additional Composables Without WBS Documentation

| File | Purpose |
|------|---------|
| `src/lib/composables/useFormAutoSave.ts` | Form-specific auto-save |
| `src/lib/composables/useOptimizedData.ts` | Data optimization |
| `src/lib/composables/usePreloader.ts` | Data preloading |

### Additional Type Files Without WBS Documentation

| File | Purpose |
|------|---------|
| `src/lib/types/admin.ts` | Admin types |
| `src/lib/types/chat.ts` | Chat types |
| `src/lib/types/follower.ts` | Follower types |
| `src/lib/types/funeral-director.ts` | Funeral director types |
| `src/lib/types/invitation.ts` | Invitation types |
| `src/lib/types/invoice.ts` | Invoice types |
| `src/lib/types/memorial-blocks.ts` | Memorial block types |
| `src/lib/types/schedule-edit-request.ts` | Schedule edit request types |
| `src/lib/types/slideshow.ts` | Slideshow types |
| `src/lib/types/webmap.ts` | Web map types |
| `src/lib/types/wiki.ts` | Wiki types |
| `src/lib/types/index.ts` | Barrel export file |

---

## 13. Recommended Actions

### Priority 1: Update Stale Documents
1. **Update `WBS_EMAIL_AUDIT_SYSTEM.md`** — Check off all Phase 1 tasks, note additional types
2. ~~**Update `WBS_MEMORIAL_PAGE_ADMIN.md`** — Document block editor, deprecate emergency embed/publicNote sections~~ ✅ **DONE (Feb 17, 2026)** — Deprecation notice added
3. ~~**Update `WBS_ADMIN_MEMORIAL_DETAILS_SVELTE5_AUDIT.md`** — Reflect reduced file size, removed forms, partial fixes~~ ✅ **DONE (Feb 17, 2026)** — Deprecation notice added

### Priority 2: Create Missing WBS Documents
4. ~~**Create `WBS_BLOCK_EDITOR_SYSTEM.md`** — Document the 11 admin components, 3 public renderers, 6 API endpoints, types, and utilities~~ ✅ **DONE (Feb 17, 2026)** — Comprehensive 400+ line document created
5. **Create `WBS_ADMIN_STREAMING_SYSTEM.md`** — Document StreamCard, ChatModerationPanel, StreamAnalyticsDashboard, and all stream API endpoints

### Priority 3: Resolve Contradictions
6. **Unify audit log collections** — Decide on naming convention across `admin_audit_logs`, `auditLogs`, `email_audit_logs`
7. **Clarify `isVisible` vs `visibility`** — Document the relationship between these two stream fields
8. **Address `{@html}` XSS risk** — Add DOMPurify sanitization to `EmbedRenderer.svelte` and `block-utils.ts` (see `WBS_BLOCK_EDITOR_SYSTEM.md` Section 6.3)

### Priority 4: Build Missing Features
9. ~~**Email Audit Phases 2-3** — Admin UI for viewing/searching email logs~~ ✅ **DONE (Feb 19, 2026)** — Phases 2–3 built (API endpoints + admin UI at `/admin/system/email-logs`)
10. **Admin Profile Page** — All dependencies are ready
11. **Remaining Svelte 5 fixes** — Toast system, remove alert/confirm, $derived usage

---

*Document Version: 1.2*  
*Generated: February 17, 2026*  
*Updated: February 19, 2026 — Full audit pass: deprecated endpoint status corrected (files retained, not deleted), 10 missing API endpoints added to Section 4, 3 block sub-components added, switcher route documented, line counts corrected, Email Audit accuracy updated (30%→75%), alert/confirm counts corrected, Section 12 updated with suspend endpoint and types/index.ts*  
*Cross-referenced against: 7 WBS documents + full codebase scan*
