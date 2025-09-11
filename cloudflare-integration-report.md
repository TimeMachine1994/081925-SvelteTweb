# Cloudflare Integration Report

This report details the integration of Cloudflare services within the TributeStream application. The primary use of Cloudflare is for providing robust and scalable livestreaming capabilities via **Cloudflare Stream**.

## 1. Overview

Cloudflare Stream is used to manage the entire lifecycle of a livestream associated with a memorial. This includes:
- Creating unique livestream inputs for each broadcast.
- Providing RTMP credentials for streaming software (e.g., OBS, Streamlabs).
- Automatically recording streams.
- Generating playback URLs for viewers.

## 2. Configuration

The integration is configured through environment variables, ensuring that sensitive API keys are not hardcoded in the source code.

**File:** `.env` (or hosting provider's environment variables)

```env
# Cloudflare Stream API Credentials
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
CLOUDFLARE_API_TOKEN="your_cloudflare_api_token"
CLOUDFLARE_CUSTOMER_CODE="your_cloudflare_customer_code"
```

These variables are used in the backend API endpoints to authenticate with the Cloudflare API.

## 3. Core API Endpoints

The following API endpoints are responsible for managing livestreams:

### `POST /api/memorials/[memorialId]/livestream`
- **File:** `frontend/src/routes/api/memorials/[memorialId]/livestream/+server.ts`
- **Description:** Starts a new livestream for a specific memorial.
- **Workflow:**
  1. Verifies user permissions (user must be an owner or funeral director).
  2. Sends a `POST` request to the Cloudflare API (`/client/v4/accounts/{ACCOUNT_ID}/stream/live_inputs`) to create a new live input.
  3. Stores the returned `uid`, `rtmps.url`, and `rtmps.streamKey` from Cloudflare in a new `livestreams` document in Firestore.
  4. Updates the corresponding `memorials` document to set `livestream.isActive` to `true` and store the new session details.
- **Returns:** The stream key, RTMP URL, and playback URL.

### `DELETE /api/memorials/[memorialId]/livestream`
- **File:** `frontend/src/routes/api/memorials/[memorialId]/livestream/+server.ts`
- **Description:** Stops the currently active livestream for a memorial.
- **Workflow:**
  1. Verifies user permissions.
  2. Updates the `livestreams` document in Firestore to set the status to `ended`.
  3. Updates the `memorials` document to set `livestream.isActive` to `false`.
- **Note:** This endpoint does not directly interact with the Cloudflare API. It manages the state of the livestream within the application's database.

### `GET /api/memorials/[memorialId]/livestream`
- **File:** `frontend/src/routes/api/memorials/[memorialId]/livestream/+server.ts`
- **Description:** Retrieves the current status and details of the livestream for a memorial.
- **Returns:** An object containing `isActive`, `playbackUrl`, and user permissions (`canStart`, `canStop`).

### `POST /api/memorials/[memorialId]/stream/mobile`
- **File:** `frontend/src/routes/api/memorials/[memorialId]/stream/mobile/+server.ts`
- **Description:** Generates or retrieves a unique stream key for mobile streaming.
- **Workflow:**
  1. Verifies user permissions.
  2. If a `mobileStreamKey` doesn't already exist for the memorial, it generates a new one.
  3. Returns the stream key and a simulated Cloudflare stream data object.

## 4. Frontend Pages

### `livestream/[memorialId]`
- **File:** `frontend/src/routes/livestream/[memorialId]/+page.svelte`
- **Description:** This is the main control center for the person conducting the livestream.
- **Features:**
  - Displays the **Server URL** and **Stream Key** required for streaming software.
  - Provides a "copy to clipboard" functionality for ease of use.
  - Includes an embedded video player to preview the stream once it's live (using the Cloudflare playback URL).

### `tributes/[fullSlug]`
- **File:** `frontend/src/routes/tributes/[fullSlug]/+page.svelte`
- **Description:** This is the public-facing memorial page where viewers watch the livestream.
- **Features:**
  - When a livestream is active, it displays an embedded iframe player pointing to the Cloudflare playback URL (`livestream.playbackUrl`).

## 5. Data Structure

The `memorial` document in Firestore contains a `livestream` object with the following fields to manage the Cloudflare integration:

```typescript
// From frontend/src/lib/types/memorial.ts

export interface Memorial {
  // ... other fields
  livestream?: {
    isActive: boolean;
    sessionId: string;
    cloudflareId: string; // The UID of the Cloudflare Live Input
    startedAt: Date;
    startedBy: string;
    streamUrl: string; // The RTMP URL from Cloudflare
    streamKey: string; // The stream key from Cloudflare
    playbackUrl: string; // The iframe playback URL from Cloudflare
    endedAt?: Date;
    endedBy?: string;
  };
}
```

## 6. Summary

The Cloudflare integration is well-structured, with a clear separation of concerns between the backend APIs that communicate with Cloudflare and the frontend pages that present the information to the users. The use of environment variables for API keys and a centralized set of API endpoints for stream management makes the system maintainable and secure.
