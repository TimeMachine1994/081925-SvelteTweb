import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { requireStreamAccess } from '$lib/server/streamMiddleware';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from '$env/static/private';

const STREAMS_COLLECTION = 'streams';

/**
 * GET /api/streams/[id]/credentials
 * Get stream credentials WITHOUT starting the stream (status remains unchanged)
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { id } = params;
    
    console.log('🔑 [STREAMS] Getting credentials for stream:', id);

    const docRef = adminDb.collection(STREAMS_COLLECTION).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return json({ error: 'Stream not found' }, { status: 404 });
    }

    const streamData = doc.data()!;
    
    // Check permissions
    console.log('🔍 [CREDENTIALS] Checking permissions for:', {
      streamId: id,
      userId: locals.user?.uid,
      userRole: locals.user?.role,
      streamMemorialId: streamData.memorialId,
      action: 'read'
    });

    const access = await requireStreamAccess({
      streamId: id,
      stream: streamData,
      user: locals.user,
      action: 'read'
    });

    console.log('🔍 [CREDENTIALS] Permission result:', {
      canView: access.canView,
      canEdit: access.canEdit,
      reason: access.reason,
      accessLevel: access.accessLevel
    });

    if (!access.canView) {  // Changed from canRead to canView
      console.log('❌ [CREDENTIALS] Access denied:', access.reason);
      return json({ error: 'Permission denied to access stream' }, { status: 403 });
    }

    // Create or get Cloudflare Live Input (but don't change stream status)
    let cloudflareId = streamData.cloudflareId;
    let streamCredentials;

    if (!cloudflareId) {
      console.log('🔧 [STREAMS] Creating new Cloudflare Live Input for credentials...');
      
      // Create new Cloudflare Live Input
      const createResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          meta: {
            name: `${streamData.title} - ${new Date().toISOString()}`
          },
          recording: {
            mode: 'automatic',
            requireSignedURLs: false,
            allowedOrigins: [
              'localhost:5173',
              'localhost:5174',
              'tributestream.com',
              '*.tributestream.com'
            ],
            timeoutSeconds: 0
          },
          defaultCreator: null,
          maxDurationSeconds: 21600 // 6 hours max
        })
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('❌ [STREAMS] Failed to create Cloudflare Live Input:', errorText);
        return json({ error: 'Failed to create live input' }, { status: 502 });
      }
      
      const createData = await createResponse.json();
      const liveInput = createData.result;
      
      cloudflareId = liveInput.uid;
      streamCredentials = {
        streamKey: liveInput.rtmps?.streamKey,
        streamUrl: liveInput.rtmps?.url,
        whipEndpoint: liveInput.webRTC?.url,
        playbackUrl: `https://cloudflarestream.com/${cloudflareId}/iframe`
      };

      // Save credentials to stream (but keep current status)
      const updateData = {
        cloudflareId,
        streamKey: streamCredentials.streamKey,
        streamUrl: streamCredentials.streamUrl,
        playbackUrl: streamCredentials.playbackUrl,
        updatedAt: new Date()
        // NOTE: We do NOT update status here - that's the key difference from /start
      };

      await docRef.update(updateData);

      console.log('✅ [STREAMS] Created Cloudflare Live Input (credentials only):', cloudflareId);
    } else {
      console.log('🔄 [STREAMS] Getting existing Cloudflare Live Input credentials:', cloudflareId);
      
      // Get existing live input details
      const liveInputResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${cloudflareId}`, {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (liveInputResponse.ok) {
        const liveInputData = await liveInputResponse.json();
        const liveInput = liveInputData.result;
        
        streamCredentials = {
          streamKey: liveInput.rtmps?.streamKey || streamData.streamKey,
          streamUrl: liveInput.rtmps?.url || streamData.streamUrl,
          whipEndpoint: liveInput.webRTC?.url,
          playbackUrl: streamData.playbackUrl || `https://cloudflarestream.com/${cloudflareId}/iframe`
        };
      } else {
        // Fallback to stored credentials
        streamCredentials = {
          streamKey: streamData.streamKey,
          streamUrl: streamData.streamUrl,
          whipEndpoint: null,
          playbackUrl: streamData.playbackUrl
        };
      }
    }

    console.log('✅ [STREAMS] Credentials retrieved successfully:', {
      streamId: id,
      cloudflareId,
      hasCredentials: !!streamCredentials.streamKey,
      currentStatus: streamData.status // Status unchanged
    });

    return json({
      success: true,
      streamId: id,
      cloudflareId,
      credentials: streamCredentials,
      status: streamData.status // Return current status (unchanged)
    });

  } catch (error) {
    console.error('❌ [STREAMS] Credentials error:', error);
    return json({ error: 'Failed to get credentials' }, { status: 500 });
  }
};
