import { adminDb } from '$lib/server/firebase';
import type { StreamPermissions, StreamAccessRequest } from '$lib/types/stream';

/**
 * Unified stream permission middleware
 * Handles permissions for both standalone streams and memorial-associated streams
 */
export async function requireStreamAccess(request: StreamAccessRequest): Promise<StreamPermissions> {
  const { streamId, stream, memorialId, user, action } = request;

  console.log('🔒 [STREAM_MIDDLEWARE] Checking access:', {
    streamId,
    memorialId: memorialId || stream?.memorialId,
    userId: user?.uid,
    action
  });

  // Default deny permissions
  const denyPermissions: StreamPermissions = {
    canView: false,
    canEdit: false,
    canStart: false,
    canStop: false,
    canDelete: false,
    reason: 'Access denied',
    accessLevel: 'none'
  };

  try {
    // Get stream data if not provided
    let streamData = stream;
    if (!streamData && streamId) {
      const streamDoc = await adminDb.collection('streams').doc(streamId).get();
      if (!streamDoc.exists) {
        return { ...denyPermissions, reason: 'Stream not found' };
      }
      streamData = streamDoc.data();
    }

    // For public streams, allow view access to everyone
    if (action === 'view' && streamData?.isPublic) {
      return {
        canView: true,
        canEdit: false,
        canStart: false,
        canStop: false,
        canDelete: false,
        reason: 'Public stream view access',
        accessLevel: 'view'
      };
    }

    // Require authentication for non-public actions
    if (!user) {
      return { ...denyPermissions, reason: 'Authentication required' };
    }

    // Admin users have full access
    if (user.role === 'admin' || user.isAdmin) {
      return {
        canView: true,
        canEdit: true,
        canStart: true,
        canStop: true,
        canDelete: true,
        reason: 'Admin access',
        accessLevel: 'admin'
      };
    }

    // Stream creator has full access to their own streams
    if (streamData?.createdBy === user.uid) {
      return {
        canView: true,
        canEdit: true,
        canStart: true,
        canStop: true,
        canDelete: true,
        reason: 'Stream creator access',
        accessLevel: 'admin'
      };
    }

    // Check memorial-based permissions
    const targetMemorialId = memorialId || streamData?.memorialId;
    if (targetMemorialId) {
      const memorialPermissions = await checkMemorialStreamPermissions(
        targetMemorialId, 
        user, 
        action
      );
      
      if (memorialPermissions.canView || memorialPermissions.canEdit) {
        return memorialPermissions;
      }
    }

    // Check if user is in allowed users list
    if (streamData?.allowedUsers?.includes(user.uid)) {
      const isViewOnly = action === 'view';
      return {
        canView: true,
        canEdit: !isViewOnly,
        canStart: !isViewOnly,
        canStop: !isViewOnly,
        canDelete: false, // Only creator/admin can delete
        reason: 'Allowed user access',
        accessLevel: isViewOnly ? 'view' : 'edit'
      };
    }

    // For creation action without specific stream, check general permissions
    if (action === 'create') {
      // Any authenticated user can create standalone streams
      if (!targetMemorialId) {
        return {
          canView: true,
          canEdit: true,
          canStart: true,
          canStop: true,
          canDelete: true,
          reason: 'Authenticated user can create streams',
          accessLevel: 'edit'
        };
      }
      
      // Memorial stream creation requires memorial permissions
      const memorialPermissions = await checkMemorialStreamPermissions(
        targetMemorialId, 
        user, 
        action
      );
      return memorialPermissions;
    }

    // Default deny
    return { ...denyPermissions, reason: 'No matching permissions found' };

  } catch (error) {
    console.error('❌ [STREAM_MIDDLEWARE] Error checking permissions:', error);
    return { ...denyPermissions, reason: 'Permission check failed' };
  }
}

/**
 * Check memorial-specific stream permissions
 */
async function checkMemorialStreamPermissions(
  memorialId: string, 
  user: any, 
  action: string
): Promise<StreamPermissions> {
  
  const denyPermissions: StreamPermissions = {
    canView: false,
    canEdit: false,
    canStart: false,
    canStop: false,
    canDelete: false,
    reason: 'Memorial access denied',
    accessLevel: 'none'
  };

  try {
    const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
    
    if (!memorialDoc.exists) {
      return { ...denyPermissions, reason: 'Memorial not found' };
    }

    const memorial = memorialDoc.data()!;

    // Check if user is memorial owner
    if (memorial.ownerUid === user.uid) {
      return {
        canView: true,
        canEdit: true,
        canStart: true,
        canStop: true,
        canDelete: true,
        reason: 'Memorial owner access',
        accessLevel: 'admin'
      };
    }

    // Check if user is funeral director for this memorial
    if (memorial.funeralDirectorUid === user.uid) {
      return {
        canView: true,
        canEdit: true,
        canStart: true,
        canStop: true,
        canDelete: false, // FDs can't delete, only hide
        reason: 'Funeral director access',
        accessLevel: 'edit'
      };
    }

    // Check if user has funeral director role and memorial allows it
    if (user.role === 'funeral_director' && memorial.funeralDirectorUid === user.uid) {
      return {
        canView: true,
        canEdit: true,
        canStart: true,
        canStop: true,
        canDelete: false,
        reason: 'Assigned funeral director access',
        accessLevel: 'edit'
      };
    }

    // For view-only actions, check if memorial is public
    if (action === 'view' && memorial.isPublic) {
      return {
        canView: true,
        canEdit: false,
        canStart: false,
        canStop: false,
        canDelete: false,
        reason: 'Public memorial view access',
        accessLevel: 'view'
      };
    }

    // Check family member access (if implemented)
    // This would require checking family member relationships
    // For now, we'll skip this and rely on explicit allowedUsers

    return denyPermissions;

  } catch (error) {
    console.error('❌ [STREAM_MIDDLEWARE] Error checking memorial permissions:', error);
    return { ...denyPermissions, reason: 'Memorial permission check failed' };
  }
}

/**
 * Helper function to create stream access request
 */
export function createStreamRequest(
  streamId: string,
  user: any,
  action: string,
  stream?: any,
  memorialId?: string
): StreamAccessRequest {
  return {
    streamId,
    stream,
    memorialId,
    user,
    action: action as any
  };
}

/**
 * Middleware wrapper for API routes
 */
export async function withStreamAccess(
  request: StreamAccessRequest,
  handler: (permissions: StreamPermissions) => Promise<Response>
): Promise<Response> {
  try {
    const permissions = await requireStreamAccess(request);
    
    // Check if the specific action is allowed
    const actionAllowed = getActionPermission(permissions, request.action);
    
    if (!actionAllowed) {
      return new Response(
        JSON.stringify({ error: permissions.reason }), 
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return await handler(permissions);
    
  } catch (error) {
    console.error('❌ [STREAM_MIDDLEWARE] Middleware error:', error);
    return new Response(
      JSON.stringify({ error: 'Permission check failed' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Get specific action permission from permissions object
 */
function getActionPermission(permissions: StreamPermissions, action: string): boolean {
  switch (action) {
    case 'view':
      return permissions.canView;
    case 'create':
    case 'edit':
      return permissions.canEdit;
    case 'start':
      return permissions.canStart;
    case 'stop':
      return permissions.canStop;
    case 'delete':
      return permissions.canDelete;
    default:
      return false;
  }
}

/**
 * Check if user can access memorial streams in general
 */
export async function canAccessMemorialStreams(
  memorialId: string, 
  user: any
): Promise<boolean> {
  try {
    const permissions = await requireStreamAccess({
      memorialId,
      user,
      action: 'view'
    });
    
    return permissions.canView;
  } catch (error) {
    console.error('❌ [STREAM_MIDDLEWARE] Error checking memorial access:', error);
    return false;
  }
}
