# Firestore Refactoring Plan: Unifying Data Models

## 1. Objective

The goal of this refactoring is to consolidate the existing `users`, `memorials`, and `bookings` Firestore collections into a single, unified data model. This will simplify the application's data logic, improve data integrity, and make it easier to manage user-related information.

## 2. Proposed Unified Schema

We will use a single top-level `users` collection. Each document in this collection will represent a user and will contain their profile information, as well as subcollections for their memorials and bookings.

### `users` Collection

-   **Document ID**: `userId` (from Firebase Authentication)

| Field | Type | Description |
| :--- | :--- | :--- |
| `displayName` | `string` | The user's name. |
| `email` | `string` | The user's email address. |
| `phone` | `string` | The user's phone number. |
| `role` | `string` | The user's role (e.g., 'owner', 'admin'). |
| `createdAt` | `Timestamp` | The timestamp of when the user was created. |
| `...other user fields` | `any` | All other fields from the existing `users` collection. |

### `memorials` Subcollection

-   **Path**: `users/{userId}/memorials/{memorialId}`

This subcollection will contain all the fields from the current `memorials` collection.

### `bookings` Subcollection

-   **Path**: `users/{userId}/bookings/{bookingId}`

This subcollection will contain all the fields from the current `bookings` collection.

## 3. Data Migration Strategy

A migration script will be required to move the data from the old collections to the new unified structure. This script should perform the following steps:

1.  **Iterate through `memorials`**: Loop through each document in the `memorials` collection.
2.  **Find the Owner**: For each memorial, identify the owner using the `createdByUserId` field.
3.  **Move Memorial**: Copy the memorial document to the `memorials` subcollection of the corresponding user in the `users` collection (`users/{createdByUserId}/memorials/{memorialId}`).
4.  **Iterate through `bookings`**: Loop through each document in the `bookings` collection.
5.  **Find the User**: For each booking, identify the user using the `userId` field.
6.  **Move Booking**: Copy the booking document to the `bookings` subcollection of the corresponding user (`users/{userId}/bookings/{bookingId}`).
7.  **Verification**: After the migration is complete, verify that the data has been moved correctly.
8.  **Cleanup**: Once verified, the old `memorials` and `bookings` collections can be deleted.

## 4. Code Refactoring Plan

All parts of the codebase that interact with the `memorials` and `bookings` collections will need to be updated. This will involve changing all Firestore queries to use the new subcollection paths.

### Key Areas for Modification:

-   **Registration Flows**:
    -   `frontend/src/routes/register/funeral-director/+page.server.ts`: Update the logic to create memorials in the user's `memorials` subcollection.
    -   `frontend/src/routes/register/loved-one/+page.server.ts`: Update the logic to create memorials in the user's `memorials` subcollection.

-   **Calculator Page**:
    -   `frontend/src/routes/app/calculator/+page.server.ts`: Update the logic to fetch and create bookings from the user's `bookings` subcollection.
    -   `frontend/src/routes/api/bookings/**`: Update all API routes related to bookings to use the new subcollection paths.

-   **My Portal**:
    -   `frontend/src/routes/my-portal/+page.server.ts`: Update the logic to fetch the user's memorials and bookings from their respective subcollections.
    -   `frontend/src/routes/my-portal/tributes/**`: Update all routes related to tributes (memorials) to use the new subcollection paths.

-   **Type Definitions**:
    -   Review and update the TypeScript interfaces in `frontend/src/lib/types/` to ensure they are compatible with the new data structure. While the document schemas themselves are not changing, the way they are accessed will, and this may require adjustments to how data is passed around the application.

### Example Query Change:

**Old Query:**
```typescript
const memorialsSnapshot = await db.collection('memorials').where('ownerId', '==', locals.user.uid).get();
```

**New Query:**
```typescript
const memorialsSnapshot = await db.collection('users').doc(locals.user.uid).collection('memorials').get();
```

## 5. Testing Strategy

After the refactoring is complete, a thorough testing process will be required to ensure that all parts of the application are working correctly.

-   **Unit Tests**: If there are unit tests for the data access layer, they will need to be updated to reflect the new schema.
-   **Integration Tests**: Test all user flows that involve creating or viewing memorials and bookings, including:
    -   User registration (both funeral director and loved one).
    -   Creating a new booking in the calculator.
    -   Viewing memorials and bookings in the "My Portal" section.
-   **Manual Testing**: Perform a full manual test of the application to catch any issues that may have been missed by automated tests.

This refactoring plan provides a comprehensive roadmap for consolidating your Firestore collections. By following these steps, you can achieve a more streamlined and maintainable data architecture.