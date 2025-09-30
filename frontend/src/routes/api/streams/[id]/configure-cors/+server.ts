import { json } from '@sveltejs/kit';
import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } from '$env/static/private';
import { adminDb } from '$lib/server/firebase';
import { requireStreamAccess } from '$lib/server/streamMiddleware';
import type { RequestHandler } from './$types';

const STREAMS_COLLECTION = 'streams';

/**
 * POST /api/streams/[id]/configure-cors
 * Configure CORS settings for a Cloudflare live input
 */
export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const streamId = params.id;
    console.log('🔧 [CONFIGURE_CORS] Configuring CORS for stream:', streamId);

    // Get stream from unified collection
    const streamDoc = await adminDb.collection(STREAMS_COLLECTION).doc(streamId).get();
    if (!streamDoc.exists) {
      return json({ error: 'Stream not found' }, { status: 404 });
    }

    const streamData = streamDoc.data()!;

    // Check permissions
    try {
      await requireStreamAccess({
        streamId,
        stream: streamData,
        user: locals.user,
        action: 'edit'
      });
    } catch (error) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    const cloudflareId = streamData.cloudflareId;
    if (!cloudflareId) {
      return json({ error: 'No Cloudflare stream ID found' }, { status: 400 });
    }

    // Configure CORS for the live input
    const corsResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${cloudflareId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recording: {
          mode: 'automatic',
          requireSignedURLs: false,
          allowedOrigins: [
            'http://localhost:5173',
            'http://localhost:5174',
            'https://tributestream.com',
            'https://*.tributestream.com',
            // Add current domain dynamically if available
            ...(process.env.PUBLIC_BASE_URL ? [process.env.PUBLIC_BASE_URL] : [])
          ],
          timeoutSeconds: 0
        }
      })
    });

    if (!corsResponse.ok) {
      const errorText = await corsResponse.text();
      console.error('❌ [CONFIGURE_CORS] Cloudflare API error:', errorText);
      return json({ 
        error: 'Failed to configure CORS', 
        status: corsResponse.status,
        details: errorText 
      }, { status: corsResponse.status });
    }

    const corsData = await corsResponse.json();
    console.log('✅ [CONFIGURE_CORS] CORS configured successfully');
    
    // Update stream metadata to track CORS configuration
    await streamDoc.ref.update({
      corsConfigured: true,
      corsConfiguredAt: new Date(),
      updatedAt: new Date()
    });

    return json({ 
      success: true,
      message: 'CORS configured successfully',
      streamId,
      allowedOrigins: corsData.result?.recording?.allowedOrigins || [],
      recordingMode: corsData.result?.recording?.mode || 'automatic'
    });

  } catch (error) {
    console.error('❌ [CONFIGURE_CORS] Error:', error);
    return json({ 
      error: 'Failed to configure CORS',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
