# Firestore Collection Analysis (2025-09-02)

This document provides a comprehensive overview of the Firestore collections used in the Tributestream application. It details each collection's purpose, where CRUD (Create, Read, Update, Delete) operations occur, and highlights potential issues, inconsistencies, and recommendations for improvement.

---

## Executive Summary

The application utilizes several core collections to manage memorials, users, and livestream configurations. The data model is generally well-structured, with sub-collections used effectively for related data like followers and embeds.

However, several areas could be improved for better data integrity, consistency, and maintainability:

1.  **Redundant Logging:** The `photoUploads`, `auditLogs`, and `uploadAttempts` collections appear to log similar events. Consolidating these into a single, structured `auditLogs` collection would simplify data management and querying.
2.  **Configuration Storage:** The `livestreamConfigurations` collection is stored at the root level but is directly tied to `memorials`. Moving it to a sub-collection (`memorials/{memorialId}/configuration`) could improve data locality and simplify security rules.
3.  **Schema Synchronization:** The `memorials` collection schema is defined in FireCMS but is also manipulated extensively throughout the SvelteKit frontend. It is critical to maintain synchronization between these two to prevent data inconsistencies.
4.  **Legacy Fields:** The presence of legacy fields in the `memorials` schema (`title`, `description`, `creatorUid`) suggests a migration has occurred. A plan should be in place to either fully migrate and remove these fields or ensure they are handled consistently to avoid confusion.

---

## 1. `memorials`

This is the primary collection for storing all tribute and memorial information.

-   **Path:** `memorials/{memorialId}`
-   **Schema Definition:** [`firecms/src/collections/memorials.tsx`](firecms/src/collections/memorials.tsx)
-   **Sub-collections:** `followers`, `embeds`, `familyMembers`

### CRUD Locations

-   **Create:**
    -   [`frontend/src/routes/register/loved-one/+page.server.ts`](frontend/src/routes/register/loved-one/+page.server.ts)
    -   [`frontend/src/routes/register/funeral-director/+page.server.ts`](frontend/src/routes/register/funeral-director/+page.server.ts)
    -   [`frontend/src/routes/my-portal/tributes/new/+page.server.ts`](frontend/src/routes/my-portal/tributes/new/+page.server.ts)
-   **Read:**
    -   Widespread reads across many server-side files for displaying memorial data. Key locations include `[fullSlug]/+page.server.ts`, `my-portal/+page.server.ts`, and various API routes.
-   **Update:**
    -   [`frontend/src/routes/my-portal/tributes/[memorialId]/edit/+page.server.ts`](frontend/src/routes/my-portal/tributes/[memorialId]/edit/+page.server.ts)
    -   [`frontend/src/routes/my-portal/tributes/[memorialId]/livestream/new/+page.server.ts`](frontend/src/routes/my-portal/tributes/[memorialId]/livestream/new/+page.server.ts)
    -   [`frontend/src/routes/api/memorials/[memorialId]/assign/+server.ts`](frontend/src/routes/api/memorials/[memorialId]/assign/+server.ts)
-   **Delete:**
    -   No direct deletion operations were found in the codebase search.

### Potential Issues & Recommendations

-   **Inconsistency (Legacy Fields):** The FireCMS schema defines legacy fields (`title`, `description`, `creatorUid`) that map to newer fields (`lovedOneName`, `content`, `createdByUserId`).
    -   **Recommendation:** Ensure all new code writes to the new fields exclusively. Create a migration script to update any remaining old documents and then remove the legacy fields from the schema and security rules to reduce complexity.
-   **Data Integrity (Orphaned Data):** There are no clear deletion pathways for memorials. If a memorial were to be deleted, its associated data in sub-collections and other root collections (`livestreamConfigurations`, `invitations`) could be orphaned.
    -   **Recommendation:** Implement a Cloud Function triggered on memorial deletion to clean up all associated data across the database and storage.

---

## 2. `users`

Stores user profile information, roles, and application-specific state.

-   **Path:** `users/{userId}`

### CRUD Locations

-   **Create/Update:**
    -   Primarily handled during user registration and profile updates.
    -   [`frontend/src/routes/register/+page.server.ts`](frontend/src/routes/register/+page.server.ts)
    -   [`frontend/src/routes/profile/+page.server.ts`](frontend/src/routes/profile/+page.server.ts)
    -   [`frontend/src/routes/api/set-role-claim/+server.ts`](frontend/src/routes/api/set-role-claim/+server.ts) (Updates role)
-   **Read:**
    -   [`frontend/src/routes/+layout.server.ts`](frontend/src/routes/+layout.server.ts) (On every server-side page load for auth)
    -   [`frontend/src/routes/profile/+page.server.ts`](frontend/src/routes/profile/+page.server.ts)

### Potential Issues & Recommendations

-   **Issue:** The collection is referenced in the `firecms/src/collections/demo.tsx` file (`client` property), but a full schema definition for FireCMS is not present.
    -   **Recommendation:** If you intend to manage users through FireCMS, create a `users.tsx` collection definition file similar to `memorials.tsx` to ensure a consistent interface and validation.

---

## 3. `livestreamConfigurations`

Stores configuration details for livestreams, generated from the calculator/booking form.

-   **Path:** `livestreamConfigurations/{memorialId}`

### CRUD Locations

-   **Create/Update:**
    -   [`frontend/src/routes/app/calculator/+page.server.ts`](frontend/src/routes/app/calculator/+page.server.ts)
-   **Read:**
    -   [`frontend/src/routes/app/checkout/success/+page.server.ts`](frontend/src/routes/app/checkout/success/+page.server.ts)
    -   [`frontend/src/routes/my-portal/+page.server.ts`](frontend/src/routes/my-portal/+page.server.ts)

### Potential Issues & Recommendations

-   **Inconsistency (Data Model):** This collection is at the root level but has a one-to-one relationship with a `memorial` document (it uses the `memorialId` as its own document ID). This pattern is valid but can be less intuitive than using a sub-collection.
    -   **Recommendation:** Consider refactoring this into a sub-collection: `memorials/{memorialId}/configuration/{configId}`. This would group all data related to a single memorial under one document path, potentially simplifying security rules and data fetching logic.

---

## 4. `invitations`

Manages invitations for users to collaborate on or view memorials.

-   **Path:** `invitations/{invitationId}`

### CRUD Locations

-   **Create:**
    -   [`frontend/src/routes/api/memorials/[memorialId]/invite/+server.ts`](frontend/src/routes/api/memorials/[memorialId]/invite/+server.ts)
-   **Read:**
    -   [`frontend/src/routes/my-portal/+page.server.ts`](frontend/src/routes/my-portal/+page.server.ts)
    -   [`frontend/src/routes/my-portal/tributes/[memorialId]/invite/+page.server.ts`](frontend/src/routes/my-portal/tributes/[memorialId]/invite/+page.server.ts)
-   **Delete:**
    -   [`frontend/src/routes/api/memorials/[memorialId]/invite/[invitationId]/+server.ts`](frontend/src/routes/api/memorials/[memorialId]/invite/[invitationId]/+server.ts)

### Potential Issues & Recommendations

-   **Scalability:** The query in `my-portal/+page.server.ts` (`invitationsRef.where('inviteeEmail', '==', locals.user.email)`) will require a Firestore index to perform efficiently as the collection grows.
    -   **Recommendation:** Ensure that the necessary composite index on `(inviteeEmail, status)` is created in your `firestore.indexes.json` file.

---

## 5. Logging Collections (`photoUploads`, `auditLogs`, `uploadAttempts`)

These collections are used for logging and auditing user actions, specifically around photo uploads.

-   **Paths:** `photoUploads/{logId}`, `auditLogs/{logId}`, `uploadAttempts/{logId}`

### CRUD Locations

-   **Create:**
    -   All three are written to in [`frontend/src/routes/my-portal/tributes/[memorialId]/upload/+server.ts`](frontend/src/routes/my-portal/tributes/[memorialId]/upload/+server.ts)

### Potential Issues & Recommendations

-   **Duplicate/Redundant Data:** A single successful photo upload action writes to both `photoUploads` and `auditLogs`. An upload attempt also writes to `uploadAttempts`. This creates data redundancy and makes comprehensive auditing more complex than necessary.
    -   **Recommendation:** Consolidate all logging into the `auditLogs` collection. Create a structured log format with fields like `type` (e.g., 'photo_upload_success', 'photo_upload_attempt', 'photo_upload_failure'), `userId`, `memorialId`, `timestamp`, and a `details` map for context-specific information. This creates a single source of truth for all auditable events.

---

## 6. FireCMS Collections (`demo`, `products`)

These collections are defined for use within the FireCMS admin panel.

-   **Paths:** `demo/{demoId}`, `products/{productId}`
-   **Schema Definitions:**
    -   [`firecms/src/collections/demo.tsx`](firecms/src/collections/demo.tsx)
    -   [`firecms/src/collections/products.tsx`](firecms/src/collections/products.tsx)

### Potential Issues & Recommendations

-   **Issue (Demo Code):** The `demo` collection appears to be example code.
    -   **Recommendation:** If this collection is not used in production, consider removing it to simplify the codebase and reduce potential confusion.