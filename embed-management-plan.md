# Embed Management Technical Design

## 1. High-Level Goal

"Embed management" refers to the ability for administrative users to associate multiple video embeds (e.g., from YouTube, Vimeo) with a single memorial. This feature will allow for a richer, more dynamic memorial page by incorporating pre-recorded videos, tributes, or other relevant media alongside the primary livestream.

## 2. Data Model Changes

To support embed management, we will introduce a new sub-collection to our Firestore data model.

-   **Sub-collection:** A new sub-collection named `embeds` will be added to each `memorial` document in the `memorials` collection.
-   **Document Structure:** Each document within the `embeds` sub-collection will represent a single video embed and will have the following structure:

    ```json
    {
      "title": "string",
      "type": "string", // e.g., 'youtube', 'vimeo'
      "embedUrl": "string", // The full embed URL for the video
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
    ```

This approach keeps the primary `memorial` document clean and allows for a scalable number of embeds per memorial.

## 3. API Endpoint Design

A new admin-only API endpoint will be created to handle Create, Read, Update, and Delete (CRUD) operations for embeds.

-   **Route:** `POST /api/memorials/[memorialId]/embeds`
-   **Protection:** This endpoint will be protected and only accessible to users with an 'admin' role. The logic will be handled within the SvelteKit endpoint by checking the user's claims.

### Actions

The single endpoint will handle different actions based on the payload, similar to how form actions are handled in SvelteKit, but as a JSON API.

#### Create a new embed

-   **Action:** `create`
-   **Payload:**
    ```json
    {
      "action": "create",
      "data": {
        "title": "First Tribute Video",
        "type": "youtube",
        "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ"
      }
    }
    ```
-   **Response:** The newly created embed document with its ID.

#### Update an existing embed

-   **Action:** `update`
-   **Payload:**
    ```json
    {
      "action": "update",
      "embedId": "some-embed-document-id",
      "data": {
        "title": "Updated Tribute Video Title"
      }
    }
    ```
-   **Response:** The updated embed document.

#### Delete an embed

-   **Action:** `delete`
-   **Payload:**
    ```json
    {
      "action": "delete",
      "embedId": "some-embed-document-id"
    }
    ```
-   **Response:** A success status.

We will also need a `GET` endpoint to list embeds for a given memorial, which can be part of the main memorial data fetching or a separate endpoint if needed for the admin UI. For simplicity, we can start by fetching them along with the memorial data for the admin portal.

## 4. UI/UX Plan

The user interface for managing embeds will be integrated into the existing `AdminPortal.svelte` component.

1.  **Access Point:** A new "Manage Embeds" button will be added to the actions column for each memorial listed in the admin portal table.
2.  **Modal Interface:** Clicking the "Manage Embeds" button will open a modal window.
3.  **Modal Content:** The modal will contain:
    *   A list of existing embeds associated with the selected memorial. Each item in the list will show the embed's title and have "Edit" and "Delete" buttons.
    *   An "Add New Embed" button.
4.  **Adding/Editing:** Clicking "Add New Embed" or "Edit" will display a form within the modal (or a sub-modal) with fields for `Title`, `Type` (dropdown: YouTube, Vimeo), and `Embed URL`.
5.  **Data Flow:** The modal will interact with the new API endpoint (`/api/memorials/[memorialId]/embeds`) to perform the CRUD operations. The list of embeds will refresh upon successful creation, update, or deletion.