# Firestore Data Model Schema

## 1. Purpose

This document details the structure of the application's data in Firestore **as actually read/written by the current SvelteKit codebase** (`frontend/src/routes`, `frontend/src/lib`). It replaces the earlier planning-stage schema, which described several collections (`userEventConfigurations`, `eventConfigs`, `blogPosts`, `auditLogs`, `mail`, `emailTemplates`, `userFiles`) that have **no references anywhere in the current code**.

## 2. Content

### Collections

#### `memorials`

Stores the primary content for each tribute page. Written by `register/loved-one/+page.server.ts` and `register/+page.server.ts`-style flows; read by `tributes/[fullSlug]/+page.server.ts` (queried by the `slug` field, not by document ID) and `/api/memorials/[memorialId]/*` endpoints.

*   **Document ID:** Auto-generated (NOT the slug — public pages query `where('slug', '==', ...)`)
*   **Fields actually written (`register/loved-one/+page.server.ts`):**
    *   `lovedOneName` (string)
    *   `slug` (string) — e.g. `celebration-of-life-for-john-doe`
    *   `fullSlug` (string) — e.g. `tributes/celebration-of-life-for-john-doe`
    *   `createdByUserId` (string): UID of the creating user.
    *   `creatorUid` (string): duplicate of `createdByUserId`, kept "for legacy compatibility".
    *   `creatorEmail` (string)
    *   `creatorName` (string)
    *   `familyContactEmail` (string)
    *   `isPublic` (boolean)
    *   `content` (string)
    *   `custom_html` (string | null)
    *   `createdAt` / `updatedAt` (Firestore `Timestamp`)
*   **Additional fields written by `register/funeral-director/+page.server.ts`** (note: this flow writes to `users/{uid}/memorials/{id}` instead — see "Known Inconsistency" below):
    *   `directorFullName`, `directorEmail`, `funeralHomeName`
    *   `memorialDate`, `memorialTime`, `memorialLocationName`, `memorialLocationAddress`
    *   `familyContactName`, `familyContactPhone`, `familyContactPreference` (`'phone' | 'email'`)
    *   `additionalNotes`
*   **Additional fields written by `/api/memorials/[memorialId]/update-details` (`PUT`):**
    *   `memorialDate`, `memorialTime`, `memorialLocationName`, `memorialLocationAddress`, `website`, `livestreamUrl`, `livestreamDate`, `livestreamTime`
    *   `lastUpdated` (ISO string), `updatedBy` (uid)
*   **Additional field written by `/api/bookings/[bookingId]/autosave`:**
    *   `livestreamConfig` (object): raw calculator payload, stored directly on the memorial doc (keyed by memorial/booking ID being the same value in this flow).
*   **Type reference:** `frontend/src/lib/types/memorial.ts` (`Memorial` interface) — the interface is broader than what any single write path populates and includes further optional fields (`imageUrl`, `birthDate`, `deathDate`, `livestream`, `photos`, `embeds`, `photoMetadata`, `website`, `locationName`/`locationAddress` aliases) that appear to be forward-looking/used only by some UI components.
*   **Subcollections:**
    *   `followers/{uid}`: `{ userId, followedAt }` — written by `/api/memorials/[memorialId]/follow` (`POST`/`DELETE`).
    *   `embeds/{embedId}`: `{ title, type: 'youtube' | 'vimeo', embedUrl, createdAt, updatedAt }` — managed via `/api/memorials/[memorialId]/embeds` (admin-only).

#### `users`

Stores user account information. Written by every registration/login flow, each with a slightly different field set.

*   **Document ID:** `{userId}` (Firebase Auth UID)
*   **Fields written by `register/+page.server.ts`:** `email`, `createdAt` (ISO string) — and `isAdmin: true` for the `registerAdmin` action.
*   **Fields written by `register/loved-one/+page.server.ts`:** `email`, `displayName`, `phone`, `role: 'owner'`, `createdAt` (Firestore `Timestamp`), `firstTimeMemorialVisit: true`.
*   **Fields written by `register/funeral-director/+page.server.ts`:** `email`, `displayName`, `phone`, `funeralHomeName`, `role: 'owner'`, `createdAt`, `directorEmail`, `directorName`, `familyContactName`, `familyContactPhone`, `contactPreference`.
*   **Fields updated elsewhere:** `firstTimeMemorialVisit` (bool, reset to `false` by `/api/user/mark-memorial-visit-complete`), `role` (updated by `/api/set-role-claim`).
*   **Note:** There is no single canonical shape for a `users` document — three different creation paths populate different subsets of fields.
*   **Subcollections actually used:**
    *   `bookings/{bookingId}`: see `Booking` type below — read/written by `/api/bookings/[bookingId]`, `/save-progress`, `/confirm`.
    *   `memorials/{memorialId}`: used only by the funeral-director registration flow (see inconsistency note).

#### `bookings`

Represents the livestream calculator/booking flow. Defined by the `Booking` interface (`frontend/src/lib/types/booking.ts`). **Primarily stored under `users/{uid}/bookings/{bookingId}`**, written by:
*   `/api/bookings/[bookingId]` (`PUT`) — updates a draft booking (rejects updates once `status !== 'draft'`).
*   `/api/bookings/[bookingId]/save-progress` (`POST`) — merges booking data (works for anonymous or authenticated users).
*   `/api/bookings/[bookingId]/confirm` (`POST`) — creates a Stripe PaymentIntent and sets `status: 'pending_payment'`, `paymentIntentId`.

*   **Fields:**
    *   `status` (`'draft' | 'pending_payment' | 'confirmed' | 'cancelled' | 'completed'`)
    *   `formData` (object, `CalculatorFormData`)
    *   `bookingItems` (array, `BookingItem[]`)
    *   `total` (number)
    *   `step` (number)
    *   `userId` (string | null)
    *   `memorialId` (string | null)
    *   `paymentIntentId` (string, optional)
    *   `createdAt` / `updatedAt` (`Timestamp`)
*   **Known inconsistency:** `login/+page.server.ts` associates an anonymous booking by updating a **top-level** `bookings/{bookingId}` document (`getAdminDb().collection('bookings').doc(bookingId)`), which does not match the `users/{uid}/bookings/{bookingId}` path used everywhere else. This looks like a bug/leftover from an earlier data shape.

#### `invitations`

Stores family-member invitations to a memorial. Written by `/api/memorials/[memorialId]/invite` (`POST`).

*   **Document ID:** Auto-generated
*   **Fields:** `memorialId`, `inviteeEmail`, `roleToAssign` (`'family_member'` only — validated), `status: 'pending'`, `invitedByUid`, `createdAt`, `updatedAt` (`Timestamp`).
*   **Note:** No email is actually sent on invitation creation — code has a `// TODO: ... send an email` comment.

## 3. Collections Referenced Only in Types, Not in Live Code Paths

The following live only as TypeScript interfaces (`frontend/src/lib/types/`) with no corresponding Firestore read/write found in `frontend/src/routes`: `follower.ts`, `invitation.ts` (superseded by the inline shape above), `slideshow.ts` (photo slideshow settings — likely stored as `photoMetadata` on the memorial doc, per component code, not a separate collection).

## 4. Collections From Earlier Planning Docs With No Code References

These do not appear anywhere in the current SvelteKit codebase (no `functions/` directory exists, and no `frontend/src` file references them): `userEventConfigurations`, `eventConfigs`, `privateNotes`, `mail`, `emailTemplates`, `blogPosts`, `auditLogs`, `receipts`, `userFiles`. Treat these as either fully deprecated or aspirational/never-built — verify against the live Firestore console before relying on them.

## 5. Key Question

**Are there any data modeling changes required for consistency?**

Yes — this is the most urgent data-model issue in the current codebase, not a future optimization:

*   **Unify memorial storage location.** Pick one of top-level `memorials` or `users/{uid}/memorials/{id}` and migrate the other. Currently the funeral-director registration path is writing memorials that the public `tributes/[fullSlug]` page can never find, since that page only queries the top-level `memorials` collection.
*   **Unify booking storage location.** `login/+page.server.ts`'s top-level `bookings` write should be changed to `users/{uid}/bookings/{bookingId}` to match every other booking endpoint, or the discrepancy will silently no-op (updating a document that nothing else reads).
*   **Consolidate `users` document shape.** Introduce a single shared helper for creating/merging user profiles so all three registration paths (`register`, `register/loved-one`, `register/funeral-director`) produce a consistent field set.
*   **Confirm and prune unused collections.** `userEventConfigurations`, `eventConfigs`, `blogPosts`, `auditLogs`, etc. should be confirmed as truly unused (or migrated) before writing new features against this schema doc.