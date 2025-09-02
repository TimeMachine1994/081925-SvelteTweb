# Data Migration Plan: `livestreamConfigurations`

This document outlines the steps to migrate existing `livestreamConfigurations` data to the new sub-collection structure within `memorials`.

**Objective:** Move all documents from the root `livestreamConfigurations` collection to a sub-collection `livestreamConfiguration` within their corresponding `memorials` document.

**Execution:** This migration should be performed via a script that can be run in a secure server environment with access to the production Firebase project.

### Migration Script Steps:

1.  **Initialize Firebase Admin:** Connect to the Firestore database with administrative privileges.
2.  **Fetch All Configurations:** Retrieve all documents from the `livestreamConfigurations` collection.
3.  **Iterate and Migrate:** For each document:
    a. **Extract `memorialId`:** The `memorialId` is the ID of the document itself.
    b. **Construct New Path:** Create a reference to the new location: `db.collection('memorials').doc(memorialId).collection('livestreamConfiguration').doc('main')`.
    c. **Transform Data:**
        i.  Copy the existing document data.
        ii. Remove the `lovedOneName` field from the copied data, as this will now be read from the parent `memorial` document.
    d. **Write to New Location:** Use a batched write to set the transformed data at the new path.
    e. **Delete Old Document:** Add the original document's deletion to the batched write.
4.  **Commit Batch:** Commit the batched write to perform all operations atomically for each document.
5.  **Logging and Error Handling:**
    *   Log the successful migration of each document.
    *   Implement error handling to catch and log any failures during the process.

This plan ensures a safe and efficient migration of the data to the new, more consistent structure.