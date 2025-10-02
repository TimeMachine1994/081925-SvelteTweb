# Role-Based Portal API Endpoints Documentation

## Overview
This document provides comprehensive documentation for all API endpoints used in the role-based portal system. All endpoints require proper authentication and role-based authorization.

## Authentication
All API endpoints require a valid Firebase authentication token passed in the `Authorization` header:
```
Authorization: Bearer <firebase-id-token>
```

## Role-Based Access Control
Each endpoint enforces role-based permissions:
- **Owner**: Full access to owned memorials
- **Funeral Director**: Access to assigned memorials + management functions
- **Family Member**: Access via invitation to specific memorials
- **Viewer**: Read-only access to public/followed memorials

---

## Memorial Management Endpoints

### GET `/api/memorials/[memorialId]`
**Description**: Retrieve memorial details  
**Access**: All roles (with appropriate permissions)  
**Parameters**:
- `memorialId` (path): Memorial ID

**Response**:
```json
{
  "id": "string",
  "lovedOneName": "string",
  "slug": "string",
  "createdByUserId": "string",
  "ownerUid": "string",
  "funeralDirectorUid": "string",
  "isPublic": "boolean",
  "content": "string",
  "serviceDate": "string",
  "location": "string",
  "livestreamEnabled": "boolean"
}
```

**Error Codes**:
- `403`: Insufficient permissions
- `404`: Memorial not found

---

### POST `/api/memorials/[memorialId]/schedule`
**Description**: Update memorial schedule  
**Access**: Owner, Funeral Director  
**Parameters**:
- `memorialId` (path): Memorial ID

**Request Body**:
```json
{
  "serviceDate": "string",
  "serviceTime": "string",
  "duration": "number",
  "location": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Schedule updated successfully"
}
```

---

### POST `/api/memorials/[memorialId]/schedule/auto-save`
**Description**: Auto-save schedule changes  
**Access**: Owner, Funeral Director  
**Parameters**:
- `memorialId` (path): Memorial ID

**Request Body**:
```json
{
  "scheduleData": "object",
  "timestamp": "string"
}
```

**Response**:
```json
{
  "success": true,
  "savedAt": "string"
}
```

---

## Invitation Management Endpoints

### POST `/api/memorials/[memorialId]/invite`
**Description**: Create invitation for family member  
**Access**: Owner, Funeral Director  
**Parameters**:
- `memorialId` (path): Memorial ID

**Request Body**:
```json
{
  "inviteeEmail": "string",
  "roleToAssign": "family_member",
  "message": "string"
}
```

**Response**:
```json
{
  "success": true,
  "invitationId": "string",
  "message": "Invitation sent successfully"
}
```

---

### POST `/api/memorials/[memorialId]/invite/[invitationId]`
**Description**: Accept/decline invitation  
**Access**: Invited user  
**Parameters**:
- `memorialId` (path): Memorial ID
- `invitationId` (path): Invitation ID

**Request Body**:
```json
{
  "action": "accept" | "decline",
  "message": "string"
}
```

**Response**:
```json
{
  "success": true,
  "status": "accepted" | "declined",
  "accessGranted": "boolean"
}
```

---

## Follow System Endpoints

### POST `/api/memorials/[memorialId]/follow`
**Description**: Follow/unfollow memorial  
**Access**: Viewer  
**Parameters**:
- `memorialId` (path): Memorial ID

**Request Body**:
```json
{
  "action": "follow" | "unfollow"
}
```

**Response**:
```json
{
  "success": true,
  "following": "boolean",
  "followerCount": "number"
}
```

---

## Livestream Management Endpoints

### POST `/api/memorials/[memorialId]/livestream/start`
**Description**: Start livestream  
**Access**: Owner, Funeral Director  
**Parameters**:
- `memorialId` (path): Memorial ID

**Request Body**:
```json
{
  "streamTitle": "string",
  "streamDescription": "string"
}
```

**Response**:
```json
{
  "success": true,
  "streamId": "string",
  "streamUrl": "string",
  "streamKey": "string"
}
```

---

### POST `/api/memorials/[memorialId]/livestream/[streamId]`
**Description**: Stop livestream  
**Access**: Owner, Funeral Director  
**Parameters**:
- `memorialId` (path): Memorial ID
- `streamId` (path): Stream ID

**Response**:
```json
{
  "success": true,
  "message": "Stream stopped successfully"
}
```

---

### GET `/api/memorials/[memorialId]/stream/status`
**Description**: Get livestream status  
**Access**: All roles (with memorial access)  
**Parameters**:
- `memorialId` (path): Memorial ID

**Response**:
```json
{
  "isLive": "boolean",
  "streamId": "string",
  "viewerCount": "number",
  "startedAt": "string"
}
```

---

## Photo Management Endpoints

### POST `/api/memorials/[memorialId]/photos`
**Description**: Upload photo to memorial  
**Access**: Owner, Funeral Director, Family Member (with invitation)  
**Parameters**:
- `memorialId` (path): Memorial ID

**Request Body**: FormData with photo file

**Response**:
```json
{
  "success": true,
  "photoId": "string",
  "photoUrl": "string"
}
```

**Error Codes**:
- `403`: Photo upload permission denied
- `413`: File too large
- `415`: Unsupported file type

---

### DELETE `/api/memorials/[memorialId]/photos/[photoId]`
**Description**: Delete photo from memorial  
**Access**: Owner, Funeral Director, Photo uploader  
**Parameters**:
- `memorialId` (path): Memorial ID
- `photoId` (path): Photo ID

**Response**:
```json
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

---

## Funeral Director Endpoints

### GET `/api/funeral-director/memorials`
**Description**: Get assigned memorials for funeral director  
**Access**: Funeral Director  

**Response**:
```json
{
  "memorials": [
    {
      "id": "string",
      "lovedOneName": "string",
      "serviceDate": "string",
      "status": "string",
      "familyContactEmail": "string"
    }
  ],
  "total": "number"
}
```

---

### POST `/api/funeral-director/create-memorial`
**Description**: Create new memorial (funeral director workflow)  
**Access**: Funeral Director  

**Request Body**:
```json
{
  "lovedOneName": "string",
  "familyContactName": "string",
  "familyContactEmail": "string",
  "familyContactPhone": "string",
  "serviceDate": "string",
  "serviceTime": "string",
  "location": "string",
  "funeralHomeName": "string"
}
```

**Response**:
```json
{
  "success": true,
  "memorialId": "string",
  "invitationSent": "boolean"
}
```

---

### POST `/api/funeral-director/quick-register-family`
**Description**: Quick family registration for immediate livestream  
**Access**: Funeral Director  

**Request Body**:
```json
{
  "lovedOneName": "string",
  "familyContactEmail": "string",
  "serviceDate": "string",
  "immediateStream": "boolean"
}
```

**Response**:
```json
{
  "success": true,
  "memorialId": "string",
  "streamReady": "boolean",
  "streamUrl": "string"
}
```

---

## User Session Endpoints

### GET `/api/session`
**Description**: Get current user session and role information  
**Access**: Authenticated users  

**Response**:
```json
{
  "user": {
    "uid": "string",
    "email": "string",
    "displayName": "string",
    "role": "string",
    "customClaims": "object"
  },
  "permissions": {
    "canCreateMemorials": "boolean",
    "canManageUsers": "boolean",
    "accessibleMemorials": ["string"]
  }
}
```

---

### POST `/api/set-role-claim`
**Description**: Set user role (admin only)  
**Access**: Admin  

**Request Body**:
```json
{
  "userId": "string",
  "role": "owner" | "funeral_director" | "family_member" | "viewer"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Role updated successfully"
}
```

---

## Error Response Format

All endpoints return errors in the following format:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object"
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `MEMORIAL_NOT_FOUND` | Memorial does not exist |
| `INVITATION_REQUIRED` | Family member needs invitation |
| `VALIDATION_ERROR` | Request validation failed |
| `FIREBASE_ERROR` | Database operation failed |
| `CLOUDFLARE_ERROR` | Livestream service error |

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **General endpoints**: 100 requests per minute per user
- **Upload endpoints**: 10 requests per minute per user
- **Livestream endpoints**: 5 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1694123456
```

---

## Testing

### Test Environment
Base URL: `https://test-api.yourdomain.com`

### Authentication for Testing
Use Firebase Auth emulator or test tokens for development.

### Example cURL Commands

**Get Memorial**:
```bash
curl -H "Authorization: Bearer <token>" \
     https://api.yourdomain.com/api/memorials/memorial-123
```

**Follow Memorial**:
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"action": "follow"}' \
     https://api.yourdomain.com/api/memorials/memorial-123/follow
```

**Start Livestream**:
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"streamTitle": "Memorial Service", "streamDescription": "Live service"}' \
     https://api.yourdomain.com/api/memorials/memorial-123/livestream/start
```

---

## Changelog

### Version 1.0.0 (Current)
- Initial API documentation
- All role-based endpoints documented
- Error codes standardized
- Rate limiting implemented

---

*Last Updated: September 7, 2025*  
*Documentation Version: 1.0.0*
