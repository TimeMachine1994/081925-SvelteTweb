import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { requireStreamAccess } from '$lib/server/streamMiddleware';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from '$env/static/private';

const STREAMS_COLLECTION = 'streams';

/**
 * POST /api/streams/[id]/start
 * Start a stream (creates Cloudflare Live Input and updates stream status)
 */
export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { id } = params;
    
    console.log('🔴 [STREAMS] Starting stream:', id);

    const docRef = adminDb.collection(STREAMS_COLLECTION).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return json({ error: 'Stream not found' }, { status: 404 });
    }

    const streamData = doc.data()!;
    
    // Check permissions
    const access = await requireStreamAccess({
      streamId: id,
      stream: streamData,
      user: locals.user,
      action: 'start'
    });

    if (!access.canStart) {
      return json({ error: 'Permission denied to start stream' }, { status: 403 });
    }

    // Check if stream is already live
    if (streamData.status === 'live') {
      return json({ error: 'Stream is already live' }, { status: 400 });
    }

    // Create or reuse Cloudflare Live Input
    let cloudflareId = streamData.cloudflareId;
    let streamCredentials;

    if (!cloudflareId) {
      console.log('🔧 [STREAMS] Creating new Cloudflare Live Input...');
      
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

      console.log('✅ [STREAMS] Created Cloudflare Live Input:', cloudflareId);
    } else {
      console.log('🔄 [STREAMS] Reusing existing Cloudflare Live Input:', cloudflareId);
      
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

    // Update stream status and credentials
    const updateData = {
      status: 'live',
      actualStartTime: new Date(),
      cloudflareId,
      streamKey: streamCredentials.streamKey,
      streamUrl: streamCredentials.streamUrl,
      playbackUrl: streamCredentials.playbackUrl,
      updatedAt: new Date()
    };

    await docRef.update(updateData);

    console.log('✅ [STREAMS] Stream started successfully:', {
      streamId: id,
      cloudflareId,
      hasCredentials: !!streamCredentials.streamKey
    });

    return json({
      success: true,
      streamId: id,
      cloudflareId,
      credentials: streamCredentials,
      status: 'live'
    });

  } catch (error) {
    console.error('❌ [STREAMS] Start error:', error);
    return json({ error: 'Failed to start stream' }, { status: 500 });
  }
};
