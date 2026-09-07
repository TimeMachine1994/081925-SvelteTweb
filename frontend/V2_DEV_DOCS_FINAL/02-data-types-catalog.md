---
Status: Draft
Last verified: 2026-06-24
Owner: TBD
Sources: frontend/src/lib/types/*.ts, src/app.d.ts, src/lib/auth.ts, src/lib/admin/permissions.ts, src/lib/config/pricing
---

# 02 — Data Types Catalog

Complete inventory of every TypeScript data type in the app, grouped by domain, with field shapes and a **proposed TursoDB column type** for each. This is the contract that `03-firestore-to-turso-schema.md` turns into SQL tables.

> Convention note: many types use Firestore `Timestamp`. In Turso these become **`INTEGER` (epoch millis)** or **`TEXT` (ISO-8601)** — pick one project-wide. This doc recommends **TEXT ISO-8601** for readability + portability, except where high-volume sorting suggests `INTEGER`. JSON-shaped sub-objects map to **`TEXT` (JSON)** unless promoted to their own table.

## Type module map (`src/lib/types/`)

| Module | Primary types | Backing collection |
| :--- | :--- | :--- |
| `memorial.ts` | `Memorial`, `ServiceDetails`, `CalculatorConfig`, `ManualPaymentInfo`, `Embed` | `memorials` |
| `stream.ts` | `Stream`, `MuxStreamConfig`, `StreamChatConfig`, `StreamAnalytics`, `MuxRecording` | `streams` |
| `livestream.ts` | `Tier`, `CalculatorFormData`, `BookingItem`, `TierInfo` | (embedded) |
| `booking.ts` | `Booking` | `bookings` |
| `invoice.ts` | `Invoice`, `InvoiceItem`, `InvoicePublicData` | `invoices` |
| `funeral-director.ts` | `FuneralDirector`, `FuneralDirectorMemorialRequest` | `funeral_directors` |
| `slideshow.ts` | `MemorialSlideshow`, `SlideshowPhoto`, `SlideshowSettings`, `SlideshowAudio` | `memorials/{id}/slideshows` |
| `chat.ts` | `ChatMessage`, `StreamChatMessage`, `ChatStats` | `memorials/{id}/chat`, stream chat |
| `memorial-blocks.ts` | `MemorialBlock`, `BlockConfig` (livestream/embed/text) | `memorials.contentBlocks` |
| `email-audit.ts` | `EmailAuditLog`, `EmailType`, `EmailStatus` | `email_audit` (or similar) |
| `follower.ts` | `Follower` | `memorials/{id}/followers` |
| `invitation.ts` | `Invitation` | `invitations` |
| `schedule-edit-request.ts` | `ScheduleEditRequest` | `schedule_edit_requests` |
| `admin.ts` | `AdminUser`, `UserManagementData`, `AdminAction`, `AdminDashboardStats` | `users`, `admin_actions` |
| `wiki.ts` | `WikiPage`, `WikiCategory`, `WikiPageVersion` | `wiki_pages`, `wiki_categories`, `wiki_page_versions` |
| `webmap.ts` | `FileNode`, `ProjectStats`, ... | none (dev tool — **Cut candidate**) |
| `(app.d.ts)` | `App.Locals.user`, `App.PageData.user` | derived from Auth claims |
| `(auth.ts)` | `User` (client store) | derived |

---

## Core: User & Auth identity

There is **no dedicated `user.ts`** — the user shape is defined in three places:

- `App.Locals.user` / `App.PageData.user` (`src/app.d.ts`): `{ uid, email, displayName?, role: 'admin'|'owner'|'funeral_director', isAdmin, adminRole? }`
- `src/lib/auth.ts` `User` (client store): adds `'viewer'` role + `isViewer`, `isOwner`, `hasPaidForMemorial`, `memorialCount`.
- Firestore `users/{uid}` document (written in `register/*` server actions): `name`, `email`, `role`, `memorialCount`, plus FD-created flags.

**Proposed `users` table (Turso):**

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` (PK) | TEXT | was Firebase UID; keep value during migration |
| `email` | TEXT UNIQUE | |
| `display_name` | TEXT NULL | |
| `role` | TEXT | `admin` \| `owner` \| `funeral_director` \| `viewer` |
| `admin_role` | TEXT NULL | 5-tier RBAC (`super_admin`...) — see `04` |
| `memorial_count` | INTEGER DEFAULT 0 | |
| `suspended` | INTEGER(bool) DEFAULT 0 | |
| `suspended_reason` | TEXT NULL | |
| `created_at` | TEXT | ISO |
| `last_login_at` | TEXT NULL | |
| `password_hash` | TEXT NULL | **NEW** — required for Turso-native auth (`04`) |

---

## `Memorial` (collection: `memorials`) — the central entity

Largest type (`memorial.ts`). Mixes structured service data, legacy flat fields, payment status, and a block-editor array. Key fields:

| Field | Type | Turso mapping |
| :--- | :--- | :--- |
| `id?` | string (doc ID) | `id TEXT PK` |
| `lovedOneName` | string | `loved_one_name TEXT` |
| `slug`, `fullSlug` | string | `slug TEXT`, `full_slug TEXT UNIQUE` (lookup key) |
| `ownerUid` | string | `owner_id TEXT FK→users` |
| `creatorEmail`, `creatorName` | string | columns |
| `directorFullName?`, `funeralHomeName?` | string | columns |
| `services` | `{ main: ServiceDetails; additional: AdditionalServiceDetails[] }` | **child table** `memorial_services` (see `03`) or JSON |
| `isPublic`, `isComplete` | boolean | `INTEGER(bool)` |
| `content`, `custom_html` | string / null | TEXT |
| `isLegacy?`, `createdByUserId?` | | columns |
| `createdAt` | Timestamp | `created_at TEXT` |
| `imageUrl?`, `photos?[]`, `embeds?[]` | string / arrays | `image_url TEXT`; `photos`→JSON or child table; `embeds`→child table |
| `familyContact*` | strings | columns (`family_contact_name`, etc.) |
| `isPaid?`, `paymentStatus?`, `paidAt?` | | `is_paid INTEGER`, `payment_status TEXT`, `paid_at TEXT` |
| `manualPayment?` | `ManualPaymentInfo` | JSON or columns |
| `calculatorConfig?` | `CalculatorConfig` | JSON (or `bookings` link) |
| `totalPrice?` | number | `total_price INTEGER` (cents recommended) |
| `customPricing?` | `CustomPricing` | JSON |
| `customTitle?` | string | column |
| `contentBlocks?[]` | `MemorialBlock[]` | **child table** `memorial_blocks` (see below) |
| `contentBlocksVersion?` | number | `content_blocks_version INTEGER` |
| `funeralDirectorUid?`, `funeralDirector?{}` | | `fd_id TEXT FK→funeral_directors` + denormalized cols |

**Deprecated/removed fields** (still on old docs, not loaded): `publicNote`, `emergencyEmbed`, `emergencyChatEmbed`, `videoFile`, and the flat `memorialDate/Time/LocationName/Address`. → **Do not migrate**; map to `contentBlocks` equivalents (text/embed blocks). Legacy flat service fields are superseded by `services`.

### Sub-types

- **`ServiceDetails`** `{ location: LocationInfo, time: TimeInfo, hours, streamId?, streamHash? }`
- **`AdditionalServiceDetails`** adds `type: 'location'|'day'`
- **`LocationInfo`** `{ name, address, isUnknown }`; **`TimeInfo`** `{ date, time, isUnknown }`
- **`ManualPaymentInfo`** `{ markedPaidBy, markedPaidAt, method: cash|check|venmo|zelle|manual, notes? }`
- **`CalculatorConfig`** `{ status?: draft|paid, isPaid?, paidAt?, bookingItems[], total?, paymentIntentId?, checkoutSessionId?, formData?, lastModified?, lastModifiedBy? }`
- **`Embed`** `{ id, title, type: youtube|vimeo, embedUrl, createdAt, updatedAt }`

---

## `MemorialBlock` (block editor; `memorials.contentBlocks`)

Discriminated union — `type: 'livestream' | 'embed' | 'text'`.

| Field | Type |
| :--- | :--- |
| `id` | string |
| `type` | `BlockType` |
| `order` | number |
| `enabled` | boolean |
| `createdAt`, `updatedAt` | string (ISO) |
| `config` | `LivestreamConfig` \| `EmbedConfig` \| `TextConfig` |

- `LivestreamConfig` `{ streamId }`; `EmbedConfig` `{ title, embedCode, embedType: video|chat|other }`; `TextConfig` `{ content, style: paragraph|heading|note, fontSize?, fontColor?, lineHeight?, textAlign? }`.

**Turso:** child table `memorial_blocks(id PK, memorial_id FK, type, order, enabled, created_at, updated_at, config_json TEXT)`. Keep `config` as JSON (variant shape).

---

## `Stream` (collection: `streams`)

| Field | Type | Notes |
| :--- | :--- | :--- |
| `id` | string | PK |
| `title`, `description?` | string | |
| `status` | `StreamStatus` = `scheduled\|ready\|live\|ended\|completed\|error` | |
| `visibility?` | `public\|hidden\|archived` | |
| `memorialId` | string | FK→memorials |
| `scheduledStartTime?` | string | ISO |
| `mux?` | `MuxStreamConfig` | JSON or columns |
| `chat?` | `StreamChatConfig` | JSON |
| `analytics?` | `StreamAnalytics` | JSON (cached) |
| `embed?` | `StreamEmbed` | JSON |
| `liveStartedAt?`, `liveEndedAt?` | string | |
| `createdAt`, `updatedAt`, `createdBy` | string | |
| legacy Cloudflare fields, `streamCredentials?` | | **Cut** (migration leftovers) |
| calculator link: `calculatorServiceType?`, `serviceHash?`, `syncStatus?` | | columns |

- **`MuxStreamConfig`**: `liveStreamId`, `playbackId`, `rtmpUrl`, `streamKey`, `assetId?`, `vodPlaybackId?`, `recordingReady`, `recordings?: MuxRecording[]`, `publishedRecordings?: string[]`, `streamingStatus: idle|active|disconnected`.
- **`MuxRecording`**: `{ assetId, vodPlaybackId, duration?, createdAt }` → child table `stream_recordings`.
- **`StreamAnalytics`**: viewer/watch metrics (note: `getMuxAnalytics` currently returns placeholders — Mux Data not configured).

---

## `Booking` (collection: `bookings`)

Unified draft→confirmed booking model (replaces legacy `livestreamConfigurations`/`calculatorState`).

`{ id, status: draft|pending_payment|confirmed|cancelled|completed, formData: CalculatorFormData, bookingItems: BookingItem[], total, step, userId|null, memorialId|null, createdAt, updatedAt, paymentIntentId? }`

- **`CalculatorFormData`**: `{ selectedTier: Tier, memorialId?, hours?, additionalLocation?, additionalDay?, addons:{ photography?, audioVisualSupport?, liveMusician?, woodenUsbDrives?, (legacy) usbDrive?, additionalHours? }, ... }`
- **`Tier`** = `record | live | legacy | standard | premium` (last two are aliases). Pricing lives in `$lib/config/pricing` (`TIER_PRICES`); `livestream.ts` `TIER_PRICING` is **deprecated**.

---

## `Invoice` (collection: `invoices`) — custom invoicing

`{ id, items: InvoiceItem[], total (cents), customerEmail, customerName?, status: pending|paid|expired|cancelled, createdAt, paidAt?, createdBy (admin uid), memorialId?, stripeSessionId?, paymentIntentId?, expiresAt? }`
- `InvoiceItem` `{ name, quantity, price (cents), total (cents) }`.
- `InvoicePublicData` = redacted public projection.

---

## `FuneralDirector` (collection: `funeral_directors`)

`{ id, companyName, contactPerson, email, phone, address:{ street, city, state, zipCode }, status: approved|suspended|inactive, createdAt, updatedAt }`

`FuneralDirectorMemorialRequest` is a **large form payload** (not a stored entity): nested `deceased`, `family` (spouse/children/parents/siblings arrays), `services` (viewing/funeral/burial/memorial), `funeralDirector`, `owner`, `memorial` config, `options`. Used by FD registration to create a `Memorial` + `users` doc. → Maps to form-input validation, not a table.

---

## `MemorialSlideshow` (subcollection: `memorials/{id}/slideshows`)

`{ id, title, memorialId, firebaseStoragePath, playbackUrl, thumbnailUrl?, status: ready|error|processing|local_only|unpublished, isFirebaseHosted, photos: SlideshowPhoto[], settings: SlideshowSettings, audio?: SlideshowAudio, embedCode?, createdBy, createdAt, updatedAt }`

- **Storage-coupled**: `firebaseStoragePath`, `playbackUrl`, and per-photo `url`/`storagePath` all point at Firebase Storage → must be **re-pathed to S3/R2** (see `08`). Field names mentioning "firebase" should be renamed (`storage_path`, `playback_url`).
- `SlideshowPhoto` `{ id, url, storagePath, caption?, duration? }`; `SlideshowSettings` `{ photoDuration, transitionType, videoQuality, aspectRatio, audioVolume?, audioFadeIn?, audioFadeOut? }`; `SlideshowAudio` `{ id, name, url?, storagePath?, duration, size, type }`.

---

## Chat: `ChatMessage` & `StreamChatMessage`

- **`ChatMessage`** (`memorials/{id}/chat`): `{ id, memorialId, userId, userName, userRole: admin|owner|funeral_director|viewer, message (≤500), timestamp, isEdited, editedAt?, isDeleted, deletedAt?, replyTo? }`. `SerializedChatMessage` = string-timestamp projection for the client.
- **`StreamChatMessage`** (stream chat): `{ id, streamId, userId?, userName, userAvatar?, userRole?: admin|guest, isAnonymous, message, timestamp, deleted, deletedBy?, deletedAt?, flagged, flagReason? }`.
- Note: Mux has no chat API → chat is **Firestore-only today**; on Turso it becomes a `chat_messages` table (or a realtime service — see `09`).

---

## Supporting types

- **`Follower`** (`memorials/{id}/followers/{uid}`): `{ uid, followedAt }` → join table `memorial_followers(memorial_id, user_id, followed_at)` (composite PK).
- **`Invitation`** (`invitations`): `{ id, memorialId, inviteeEmail, roleToAssign: 'owner', status: pending|accepted, invitedByUid, createdAt, updatedAt }`.
- **`ScheduleEditRequest`** (`schedule_edit_requests`): `{ id, memorialId, memorialName, requestedBy, requestedByEmail, requestDetails, status: pending|approved|denied|completed, createdAt, reviewedAt?, reviewedBy?, adminNotes?, currentConfig:{ tier, services, bookingItems[], total } }`.
- **`AdminAction`** (`admin_actions`): `{ id, adminId, action: user_created|user_suspended|user_deleted|role_changed, targetType: user|memorial|application, targetId, details: Record, timestamp, ipAddress? }`. (Audit logging — see `07`.)
- **`EmailAuditLog`** (`email_audit`): see `email-audit.ts` — tracks every send: `type` (15 `EmailType`s), `to/cc/from`, `subject`, `templateData`, `sentAt`, `triggeredBy*`, related entity IDs, `status: sent|failed|mocked`, `sendgridMessageId`, `environment`.
- **Wiki** (`wiki_pages`, `wiki_categories`, `wiki_page_versions`): admin knowledge base — `WikiPage` `{ id, slug, title, content, category, tags[], createdBy/At, updatedBy/At, version, viewCount, parentPageId, order }`, plus categories and version history. **Cut** (confirmed) — not migrated to Turso.
- **Blog** (`blog` collection — no dedicated type file; FireCMS-managed): **Cut** (confirmed). Drop the routes, rules, and tables.
- **`webmap.ts`**: types for a developer file-explorer tool (`/webmap` route). **Cut candidate** — not product functionality.

## Enumerations summary (for SQL CHECK constraints)

| Enum | Values |
| :--- | :--- |
| user role | `admin, owner, funeral_director, viewer` |
| admin role | `super_admin, content_admin, financial_admin, customer_support, readonly_admin` |
| memorial paymentStatus | `paid, unpaid` |
| manual payment method | `cash, check, venmo, zelle, manual` |
| Tier | `record, live, legacy, standard, premium` |
| booking status | `draft, pending_payment, confirmed, cancelled, completed` |
| invoice status | `pending, paid, expired, cancelled` |
| stream status | `scheduled, ready, live, ended, completed, error` |
| stream visibility | `public, hidden, archived` |
| FD status | `approved, suspended, inactive` |
| invitation status | `pending, accepted` |
| edit request status | `pending, approved, denied, completed` |
| block type | `livestream, embed, text` |
| email status | `sent, failed, mocked` |

## Migration verdict

- **Migrate** all entity types to Turso tables (`03`), promoting nested arrays (`recordings`, `photos`, `followers`, `blocks`, `services.additional`) to child tables where queried, JSON otherwise.
- **Rebuild** the user identity model — add `password_hash`/session tables (no equivalent exists today).
- **Cut** deprecated memorial fields, legacy stream Cloudflare *ingest* fields, `webmap.ts`, `wiki.ts` (confirmed), and the `blog` collection (confirmed).
- **Refactor** all storage-coupled field names in `slideshow.ts` away from "firebase".
