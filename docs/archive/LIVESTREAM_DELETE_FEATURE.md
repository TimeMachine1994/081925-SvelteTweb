# Livestream Delete Feature Implementation

## Overview
Added the ability for admins to delete livestreams from the admin memorial details view.

## Changes Made

### 1. New API Endpoint
**File**: `frontend/src/routes/api/streams/[streamId]/delete/+server.ts`

**Features**:
- ✅ DELETE method to remove streams from Firestore
- ✅ POST method (alternative for clients that don't support DELETE)
- ✅ Permission checking (admin, memorial owner, or funeral director)
- ✅ Audit log creation for deletion tracking
- ✅ Cloudflare cleanup placeholder (for future implementation)
- ✅ Comprehensive error handling and logging

**Authorization**:
- Admins (role: 'admin')
- Memorial owners (ownerUid matches)
- Funeral directors (funeralDirectorUid matches)

**Endpoint**: `DELETE /api/streams/[streamId]/delete`

**Response**:
```json
{
  "success": true,
  "message": "Stream deleted successfully",
  "streamId": "abc123",
  "deletedAt": "2024-01-01T12:00:00.000Z"
}
```

### 2. Admin Memorial Details Page Updates
**File**: `frontend/src/routes/admin/services/memorials/[memorialId]/+page.svelte`

**Added**:
- ✅ `handleDeleteStream()` function
- ✅ Delete button for each livestream in the streams grid
- ✅ Confirmation dialog before deletion
- ✅ Success/error messaging
- ✅ Page reload after successful deletion

**UI Changes**:
- Each stream now wrapped in `.stream-item` container
- Delete button positioned in top-right corner of each stream
- Red danger-style button (🗑️ Delete Stream)
- Hover effects and visual feedback

### 3. CSS Styling
**Added Classes**:
- `.stream-item` - Container for stream card + delete button
- `.delete-stream-btn` - Styled delete button
- Hover/active states for better UX

## User Flow

### Admin Delete Stream Flow:
1. **Navigate** to Admin → Services → Memorials → [Select Memorial]
2. **View** all livestreams in the memorial details
3. **Click** "🗑️ Delete Stream" button on any livestream
4. **Confirm** deletion in popup dialog:
   - "Are you sure you want to delete this livestream?"
   - Shows stream title
   - "This action cannot be undone."
5. **Result**:
   - Success: "Livestream deleted successfully" + page reload
   - Error: Shows error message with details

## Security Features

### Permission Checks
```typescript
const hasPermission =
  userRole === 'admin' ||
  memorial.ownerUid === userId ||
  memorial.funeralDirectorUid === userId;
```

### Audit Logging
Creates audit log entry with:
- `action: 'stream_deleted'`
- `resourceType: 'stream'`
- `resourceId: streamId`
- `memorialId`
- `performedBy: userId`
- `performedByEmail`
- `performedByRole`
- `timestamp`
- `details`: Stream title, status, memorial name

## Technical Details

### API Request Example
```javascript
const response = await fetch(`/api/streams/${streamId}/delete`, {
  method: 'DELETE'
});
```

### Error Handling
- 401: Authentication required
- 403: Permission denied
- 404: Stream or memorial not found
- 500: Internal server error

### Firestore Operations
1. Fetch stream document
2. Verify stream exists
3. Fetch memorial document
4. Check permissions
5. Delete stream document
6. Create audit log (non-blocking)

## Future Enhancements

### Planned Features:
1. **Cloudflare Cleanup**
   - Delete Cloudflare Live Input when stream is deleted
   - Requires Cloudflare API integration

2. **Soft Delete Option**
   - Add `isDeleted: true` flag instead of permanent deletion
   - Keep data for recovery/audit purposes

3. **Bulk Delete**
   - Select multiple streams for deletion
   - Useful for cleaning up old streams

4. **Delete Confirmation Modal**
   - Replace browser `confirm()` with custom modal
   - Better UX with styled confirmation dialog

5. **Undo Functionality**
   - Keep deleted streams in "trash" for 30 days
   - Allow restoration before permanent deletion

## Testing Checklist

### Manual Testing:
- [ ] Admin can delete stream
- [ ] Memorial owner can delete stream
- [ ] Funeral director can delete stream
- [ ] Unauthorized user cannot delete stream
- [ ] Confirmation dialog appears
- [ ] Success message shows after deletion
- [ ] Page reloads and stream is removed
- [ ] Audit log is created
- [ ] Error handling works for 404/403/500

### Edge Cases:
- [ ] Deleting non-existent stream (404)
- [ ] Deleting stream without permission (403)
- [ ] Network error during deletion
- [ ] Multiple rapid delete attempts
- [ ] Deleting last stream in memorial

## Files Modified

### New Files:
1. `frontend/src/routes/api/streams/[streamId]/delete/+server.ts` (130 lines)

### Modified Files:
1. `frontend/src/routes/admin/services/memorials/[memorialId]/+page.svelte`
   - Added `handleDeleteStream()` function
   - Updated streams grid HTML
   - Added CSS for delete button

## Related Documentation
- [Cloudflare Webhook Review](./CLOUDFLARE_WEBHOOK_REVIEW.md)
- [Stream Management](./wiki/04-livestream-integration.md)
- [Admin Dashboard](./ADMIN_WIKI_IMPLEMENTATION.md)

## Success Metrics
- Admins can successfully delete unwanted streams
- Proper authorization prevents unauthorized deletions
- Audit trail maintained for all deletions
- Clean and intuitive UI for stream management

---

**Status**: ✅ Implemented and ready for testing
**Version**: 1.0
**Date**: 2024-11-13
