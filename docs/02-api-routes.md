# API Routes Reference

## Overview

TributeStream provides a comprehensive REST API built with SvelteKit API routes. All endpoints follow RESTful conventions and return JSON responses. Authentication is handled via Firebase Auth with role-based access control.

## Base URL Structure

```
/api/[category]/[resource]/[id]/[action]
```

## Authentication

All API routes (except public endpoints) require authentication via Firebase Auth session cookies. User roles determine access levels:

- **Admin**: Full system access
- **Funeral Director**: Manage assigned memorials and streams
- **Owner**: Manage owned memorials

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

## Memorial Management APIs

### Memorial CRUD Operations

#### GET `/api/memorials/[id]`
Retrieve memorial details by ID.

**Parameters:**
- `id` (string): Memorial ID

**Response:**
```json
{
  "success": true,
  "data": {
    "memorial": Memorial,
    "canEdit": boolean,
    "streams": Stream[]
  }
}
```

**Permissions:** Owner, Funeral Director, Admin

---

#### PUT `/api/memorials/[id]`
Update memorial information.

**Request Body:**
```json
{
  "lovedOneName": "string",
  "content": "string",
  "services": {
    "main": ServiceDetails,
    "additional": AdditionalServiceDetails[]
  },
  "isPublic": boolean
}
```

**Permissions:** Owner, Funeral Director, Admin

---

### Memorial Creation

#### POST `/api/funeral-director/create-memorial`
Create memorial as funeral director.

**Request Body:**
```json
{
  "lovedOneName": "string",
  "creatorEmail": "string",
  "creatorName": "string",
  "services": {
    "main": ServiceDetails,
    "additional": AdditionalServiceDetails[]
  },
  "familyContactName": "string",
  "familyContactEmail": "string",
  "familyContactPhone": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "memorial": Memorial,
    "invitationSent": boolean
  }
}
```

**Permissions:** Funeral Director, Admin

---

#### POST `/api/funeral-director/quick-register-family`
Quick family registration with memorial creation.

**Request Body:**
```json
{
  "familyEmail": "string",
  "familyName": "string",
  "lovedOneName": "string",
  "services": ServiceDetails
}
```

**Permissions:** Funeral Director, Admin

---

### Memorial Schedule Management

#### GET `/api/memorials/[memorialId]/schedule`
Get memorial schedule and calculator data.

**Response:**
```json
{
  "success": true,
  "data": {
    "memorial": Memorial,
    "calculatorConfig": CalculatorFormData
  }
}
```

---

#### PUT `/api/memorials/[memorialId]/schedule`
Update memorial schedule and services.

**Request Body:**
```json
{
  "services": {
    "main": ServiceDetails,
    "additional": AdditionalServiceDetails[]
  },
  "calculatorData": CalculatorFormData
}
```

---

#### POST `/api/memorials/[memorialId]/schedule/auto-save`
Auto-save schedule changes.

**Request Body:**
```json
{
  "services": ServiceDetails,
  "calculatorData": CalculatorFormData
}
```

---

## Livestream System APIs

### Unified Stream Management

#### GET `/api/streams`
List streams with filtering.

**Query Parameters:**
- `memorialId` (string): Filter by memorial
- `status` (StreamStatus): Filter by status
- `limit` (number): Results limit
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "streams": Stream[],
    "total": number,
    "hasMore": boolean,
    "pagination": {
      "limit": number,
      "offset": number,
      "nextOffset": number
    }
  }
}
```

---

#### POST `/api/streams`
Create new stream.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "memorialId": "string",
  "scheduledStartTime": "ISO string",
  "isVisible": boolean,
  "isPublic": boolean
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stream": Stream
  }
}
```

---

#### GET `/api/streams/[id]`
Get stream details.

**Response:**
```json
{
  "success": true,
  "data": {
    "stream": Stream,
    "permissions": StreamPermissions
  }
}
```

---

#### PUT `/api/streams/[id]`
Update stream configuration.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "isVisible": boolean,
  "isPublic": boolean,
  "scheduledStartTime": "ISO string"
}
```

---

#### DELETE `/api/streams/[id]`
Delete stream and create archive entry.

**Response:**
```json
{
  "success": true,
  "data": {
    "archiveCreated": boolean,
    "recordingUrl": "string"
  }
}
```

---

### Stream Lifecycle Management

#### POST `/api/streams/[id]/start`
Start livestream.

**Response:**
```json
{
  "success": true,
  "data": {
    "credentials": StreamCredentials,
    "stream": Stream
  }
}
```

---

#### POST `/api/streams/[id]/stop`
Stop livestream.

**Response:**
```json
{
  "success": true,
  "data": {
    "stream": Stream,
    "recordingStatus": "processing" | "ready"
  }
}
```

---

#### GET `/api/streams/[id]/status`
Get real-time stream status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": StreamStatus,
    "isLive": boolean,
    "viewerCount": number,
    "recordingReady": boolean,
    "lastUpdated": "ISO string"
  }
}
```

---

### Recording Management

#### GET `/api/streams/[id]/recordings`
Get stream recordings.

**Response:**
```json
{
  "success": true,
  "data": {
    "recordings": RecordingSession[],
    "totalSessions": number
  }
}
```

---

#### POST `/api/streams/[id]/recordings`
Sync recording status with Cloudflare.

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": boolean,
    "recordingUrl": "string",
    "duration": number
  }
}
```

---

### Memorial Stream Integration

#### GET `/api/memorials/[id]/streams`
Get all streams for memorial.

**Response:**
```json
{
  "success": true,
  "data": {
    "memorialId": "string",
    "liveStreams": Stream[],
    "scheduledStreams": Stream[],
    "readyStreams": Stream[],
    "recordedStreams": Stream[],
    "publicRecordedStreams": Stream[],
    "totalStreams": number
  }
}
```

---

#### GET `/api/memorials/[id]/streams/status`
Get real-time status of memorial streams.

**Response:**
```json
{
  "success": true,
  "data": {
    "hasLiveStream": boolean,
    "liveStreamCount": number,
    "scheduledCount": number,
    "recordedCount": number,
    "lastUpdated": "ISO string"
  }
}
```

---

## Legacy Livestream APIs (MVP Two System)

### Memorial Livestream Management

#### GET `/api/memorials/[memorialId]/livestream`
Get livestream configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "livestream": MVPTwoStreamData | null,
    "canManage": boolean
  }
}
```

---

#### POST `/api/memorials/[memorialId]/livestream`
Create or update livestream.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "scheduledStartTime": "ISO string"
}
```

---

#### DELETE `/api/memorials/[memorialId]/livestream`
End livestream and create archive.

**Response:**
```json
{
  "success": true,
  "data": {
    "archiveEntry": LegacyArchiveEntry,
    "recordingStatus": "processing" | "ready"
  }
}
```

---

#### POST `/api/memorials/[memorialId]/livestream/start`
Start livestream session.

**Response:**
```json
{
  "success": true,
  "data": {
    "streamKey": "string",
    "streamUrl": "string",
    "playbackUrl": "string"
  }
}
```

---

#### GET `/api/memorials/[memorialId]/livestream/whip`
Get WHIP endpoint for WebRTC streaming.

**Response:**
```json
{
  "success": true,
  "data": {
    "whipEndpoint": "string",
    "playbackUrl": "string"
  }
}
```

---

### Archive Management

#### GET `/api/memorials/[memorialId]/livestream/archive`
Get archived livestreams.

**Response:**
```json
{
  "success": true,
  "data": {
    "archives": LegacyArchiveEntry[],
    "canManage": boolean
  }
}
```

---

#### PUT `/api/memorials/[memorialId]/livestream/archive/[entryId]`
Update archive visibility.

**Request Body:**
```json
{
  "isVisible": boolean
}
```

---

#### DELETE `/api/memorials/[memorialId]/livestream/archive/[entryId]`
Delete archive entry.

---

## User & Authentication APIs

### Session Management

#### GET `/api/session`
Get current user session.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": User | null,
    "isAuthenticated": boolean
  }
}
```

---

### Role Management

#### POST `/api/set-role-claim`
Set user role (Admin only).

**Request Body:**
```json
{
  "uid": "string",
  "role": "admin" | "owner" | "funeral_director"
}
```

**Permissions:** Admin only

---

#### POST `/api/set-admin-claim`
Set admin privileges (Admin only).

**Request Body:**
```json
{
  "uid": "string",
  "isAdmin": boolean
}
```

**Permissions:** Admin only

---

## Funeral Director APIs

### Registration & Profile

#### POST `/api/funeral-director/register`
Register new funeral director.

**Request Body:**
```json
{
  "email": "string",
  "displayName": "string",
  "funeralHomeName": "string",
  "businessAddress": "string",
  "businessPhone": "string",
  "businessEmail": "string",
  "licenseNumber": "string",
  "businessLicenseFile": "File",
  "funeralLicenseFile": "File",
  "insuranceDocumentFile": "File"
}
```

---

#### GET `/api/funeral-director/profile`
Get funeral director profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": FuneralDirector,
    "memorialCount": number,
    "activeStreams": number
  }
}
```

---

#### GET `/api/funeral-director/memorials`
Get memorials managed by funeral director.

**Response:**
```json
{
  "success": true,
  "data": {
    "memorials": Memorial[],
    "total": number
  }
}
```

---

## Admin APIs

### User Management

#### GET `/api/admin/users`
List all users with filtering.

**Query Parameters:**
- `role` (string): Filter by role
- `status` (string): Filter by status
- `limit` (number): Results limit

**Response:**
```json
{
  "success": true,
  "data": {
    "users": User[],
    "total": number
  }
}
```

**Permissions:** Admin only

---

#### POST `/api/admin/users/[uid]/activate`
Activate user account.

**Permissions:** Admin only

---

#### POST `/api/admin/users/[uid]/suspend`
Suspend user account.

**Permissions:** Admin only

---

### Funeral Director Management

#### GET `/api/admin/funeral-director`
List funeral director applications.

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": FuneralDirector[],
    "pending": number,
    "approved": number,
    "rejected": number
  }
}
```

---

#### POST `/api/admin/funeral-director/[uid]/approve`
Approve funeral director application.

**Permissions:** Admin only

---

#### POST `/api/admin/funeral-director/[uid]/reject`
Reject funeral director application.

**Request Body:**
```json
{
  "reason": "string"
}
```

**Permissions:** Admin only

---

### System Statistics

#### GET `/api/admin/stats`
Get system statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMemorials": number,
    "totalUsers": number,
    "activeStreams": number,
    "totalRecordings": number,
    "recentActivity": Activity[]
  }
}
```

**Permissions:** Admin only

---

## Payment APIs

### Stripe Integration

#### POST `/api/create-payment-intent`
Create Stripe payment intent.

**Request Body:**
```json
{
  "memorialId": "string",
  "amount": number,
  "currency": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "string",
    "paymentIntentId": "string"
  }
}
```

---

#### GET `/api/check-payment-status`
Check payment status.

**Query Parameters:**
- `paymentIntentId` (string): Payment intent ID

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "pending" | "succeeded" | "failed",
    "amount": number,
    "paidAt": "ISO string"
  }
}
```

---

## Webhook APIs

### Cloudflare Stream Webhooks

#### POST `/api/webhooks/cloudflare/live-input`
Handle Cloudflare live input status changes.

**Request Body:** Cloudflare webhook payload

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

---

#### POST `/api/webhooks/cloudflare/recording`
Handle Cloudflare recording ready notifications.

**Request Body:** Cloudflare webhook payload

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": boolean,
    "recordingUrl": "string"
  }
}
```

---

## Debug & Development APIs

### Stream Debugging

#### GET `/api/debug/streams/[memorialId]`
Debug memorial streams.

**Response:**
```json
{
  "success": true,
  "data": {
    "memorial": Memorial,
    "unifiedStreams": Stream[],
    "legacyStreams": MVPTwoStreamData[],
    "cloudflareStatus": object
  }
}
```

---

#### GET `/api/debug/stream-status/[id]`
Debug stream status.

**Response:**
```json
{
  "success": true,
  "data": {
    "stream": Stream,
    "cloudflareData": object,
    "recordingStatus": object
  }
}
```

---

### Recording Debugging

#### GET `/api/debug/check-recordings/[streamId]`
Check recording status.

**Response:**
```json
{
  "success": true,
  "data": {
    "recordingFound": boolean,
    "recordingUrl": "string",
    "duration": number,
    "status": "processing" | "ready"
  }
}
```

---

#### POST `/api/debug/force-recording-check/[id]`
Force recording status check.

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": boolean,
    "recordingReady": boolean,
    "recordingUrl": "string"
  }
}
```

---

## Error Codes

### Authentication Errors
- `AUTH_REQUIRED`: Authentication required
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `INVALID_TOKEN`: Invalid authentication token

### Validation Errors
- `INVALID_INPUT`: Request validation failed
- `MISSING_REQUIRED_FIELD`: Required field missing
- `INVALID_FORMAT`: Invalid data format

### Resource Errors
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `RESOURCE_CONFLICT`: Resource already exists
- `RESOURCE_LOCKED`: Resource is locked for editing

### Stream Errors
- `STREAM_NOT_FOUND`: Stream not found
- `STREAM_ALREADY_LIVE`: Stream is already live
- `STREAM_NOT_LIVE`: Stream is not currently live
- `CLOUDFLARE_ERROR`: Cloudflare API error

### Payment Errors
- `PAYMENT_FAILED`: Payment processing failed
- `INVALID_AMOUNT`: Invalid payment amount
- `PAYMENT_REQUIRED`: Payment required to proceed

---

## Rate Limiting

API endpoints are rate-limited based on user role:
- **Admin**: 1000 requests/hour
- **Funeral Director**: 500 requests/hour  
- **Owner**: 100 requests/hour
- **Anonymous**: 50 requests/hour

---

*For implementation details and examples, see the [Integration Flows](./07-integration-flows.md) documentation.*
