# Firestore Schema Documentation for Registration Flows

This document outlines the Firestore collection schemas for the "memorial registration" (by a loved one) and "funeral director registration" processes.

## Funeral Director Registration

This registration process creates two documents in Firestore: one in the `users` collection and one in the `memorials` collection.

### `users` Collection Schema

| Field | Type | Description |
| :--- | :--- | :--- |
| `email` | `string` | The family contact's email address. |
| `displayName` | `string` | The family contact's name (or director's name if not provided). |
| `phone` | `string` | The family contact's phone number. |
| `funeralHomeName` | `string` | The name of the funeral home. |
| `role` | `string` | Set to `'owner'`. |
| `createdAt` | `Timestamp` | The timestamp of when the user was created. |
| `directorEmail` | `string` \| `null` | The funeral director's email address. |
| `directorName` | `string` | The funeral director's name. |
| `familyContactName` | `string` | The family contact's name. |
| `familyContactPhone` | `string` | The family contact's phone number. |
| `contactPreference` | `'phone'` \| `'email'` | The preferred method of contact. |

### `memorials` Collection Schema

| Field | Type | Description |
| :--- | :--- | :--- |
| `lovedOneName` | `string` | The name of the loved one. |
| `slug` | `string` | A URL-friendly version of the loved one's name. |
| `fullSlug` | `string` | The complete URL slug for the tribute page. |
| `createdByUserId` | `string` | The UID of the user who created the memorial. |
| `creatorEmail` | `string` | The email of the creator. |
| `creatorName` | `string` | The name of the creator. |
| `directorFullName` | `string` | The full name of the funeral director. |
| `funeralHomeName` | `string` | The name of the funeral home. |
| `memorialDate` | `string` \| `null` | The date of the memorial service. |
| `memorialTime` | `string` \| `null` | The time of the memorial service. |
| `memorialLocationName` | `string` \| `null` | The name of the memorial service location. |
| `memorialLocationAddress` | `string` \| `null` | The address of the memorial service location. |
| `familyContactName` | `string` | The name of the primary family contact. |
| `familyContactEmail` | `string` | The email of the primary family contact. |
| `familyContactPhone` | `string` | The phone number of the primary family contact. |
| `familyContactPreference` | `'phone'` \| `'email'` | The preferred contact method for the family contact. |
| `directorEmail` | `string` \| `null` | The director's email, for informational purposes. |
| `additionalNotes` | `string` \| `null` | Any additional notes provided. |
| `isPublic` | `boolean` | Defaulted to `true`. |
| `content` | `string` | Defaulted to an empty string. Intended for the main tribute content. |
| `custom_html` | `string` \| `null` | Defaulted to `null`. For custom HTML content. |
| `createdAt` | `Timestamp` | The timestamp of when the memorial was created. |
| `updatedAt` | `Timestamp` | The timestamp of when the memorial was last updated. |
| `creatorUid` | `string` | The UID of the creator (legacy compatibility). |

---

## Memorial Registration (by a Loved One)

This registration process also creates a document in both the `users` and `memorials` collections.

### `users` Collection Schema

| Field | Type | Description |
| :--- | :--- | :--- |
| `email` | `string` | The registering user's email address. |
| `displayName` | `string` | The registering user's name. |
| `phone` | `string` | The registering user's phone number. |
| `role` | `string` | Set to `'owner'`. |
| `createdAt` | `Timestamp` | The timestamp of when the user was created. |
| `firstTimeMemorialVisit` | `boolean` | Set to `true` to trigger a first-time user experience. |

### `memorials` Collection Schema

| Field | Type | Description |
| :--- | :--- | :--- |
| `lovedOneName` | `string` | The name of the loved one. |
| `slug` | `string` | A URL-friendly version of the loved one's name. |
| `fullSlug` | `string` | The complete URL slug for the tribute page. |
| `createdByUserId` | `string` | The UID of the user who created the memorial. |
| `creatorEmail` | `string` | The email of the creator. |
| `familyContactEmail` | `string` | The email of the family contact (same as creator). |
| `creatorName` | `string` | The name of the creator. |
| `isPublic` | `boolean` | Defaulted to `false`. |
| `content` | `string` | Defaulted to an empty string. |
| `custom_html` | `string` | Defaulted to an empty string. |
| `createdAt` | `Timestamp` | The timestamp of when the memorial was created. |
| `updatedAt` | `Timestamp` | The timestamp of when the memorial was last updated. |
| `creatorUid` | `string` | The UID of the creator (legacy compatibility). |

---

## Generic Registration

This process creates a document in the `users` collection with a minimal set of fields.

### `users` Collection Schema (Generic)

| Field | Type | Description |
| :--- | :--- | :--- |
| `email` | `string` | The user's email address. |
| `createdAt` | `string` | The ISO string of when the user was created. |
| `isAdmin` | `boolean` | (Optional) Set to `true` if the `registerAdmin` action is used. |