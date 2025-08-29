# Design for Vercel-Based Firestore-Algolia Synchronization

## 1. Overview

This document outlines the design for synchronizing the Firestore `memorials` collection with an Algolia search index, with the synchronization logic residing within the SvelteKit backend deployed on Vercel.

This approach co-locates the search indexing logic with the application's data manipulation logic. Instead of using database triggers (like Firebase Functions), this design explicitly calls Algolia indexing functions after each Firestore database operation (create, update, and delete).

## 2. Core Principle

The core principle is to ensure that every server-side action that modifies the `memorials` collection in Firestore is immediately followed by a corresponding action to update the Algolia index.

This will be achieved by modifying the SvelteKit form actions and API endpoints that handle the CUD (Create, Update, Delete) operations for memorials.

## 3. Key Implementation Points

### 3.1. Memorial Creation

When a new memorial is created, the server-side logic will first write the new memorial to Firestore. Upon a successful write, it will then call the `indexMemorial` function to add the new memorial to the Algolia index.

*   **File to Modify**: `frontend/src/routes/my-portal/tributes/new/+page.server.ts`
*   **Logic**:
    1.  In the `default` form action, after the `addDoc` call to Firestore is successful:
    2.  Retrieve the newly created document's data and ID.
    3.  Call `indexMemorial` with the new memorial data.

### 3.2. Memorial Updates

When a memorial is updated, the server-side logic will first update the document in Firestore. Upon a successful update, it will then call the `indexMemorial` function (which also handles updates) to update the record in Algolia.

*   **File to Modify**: `frontend/src/routes/my-portal/tributes/[memorialId]/edit/+page.server.ts`
*   **Logic**:
    1.  In the `default` form action, after the `updateDoc` call to Firestore is successful:
    2.  Retrieve the updated memorial data.
    3.  Call `indexMemorial` with the updated data.

### 3.3. Memorial Deletion

When a memorial is deleted, the server-side logic will first delete the document from Firestore. Upon a successful deletion, it will then call the `removeMemorialFromIndex` function to remove the record from Algolia.

*   **File to Modify**: `frontend/src/routes/my-portal/tributes/[memorialId]/edit/+page.server.ts` (or a dedicated API endpoint if one exists).
*   **Logic**:
    1.  In a `delete` form action (or equivalent), after the `deleteDoc` call to Firestore is successful:
    2.  Call `removeMemorialFromIndex` with the ID of the deleted memorial.

## 4. Workflow Diagram

```mermaid
graph TD
    subgraph "SvelteKit Backend on Vercel"
        A[User Action <br/> (Create/Update/Delete)] --> B{Form Action / API Endpoint};
        B --> C[1. Perform Firestore CUD Operation];
        C -- On Success --> D[2. Call Corresponding Algolia Function <br/> (indexMemorial / removeMemorialFromIndex)];
    end

    subgraph "External Services"
        E[Firestore Database]
        F[Algolia Search Index]
    end

    C --> E;
    D --> F;
```

## 5. Error Handling

A try-catch block should be wrapped around the Algolia function calls. If the Firestore operation succeeds but the Algolia operation fails, the error should be logged to the console. For a more robust implementation, a retry mechanism or a queueing system could be considered in the future to handle transient Algolia API failures.
