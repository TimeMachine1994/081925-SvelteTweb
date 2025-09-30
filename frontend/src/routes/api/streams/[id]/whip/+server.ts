import { adminDb } from '$lib/server/firebase';
import { requireStreamAccess } from '$lib/server/streamMiddleware';
import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } from '$env/static/private';
import type { RequestHandler } from './$types';

const STREAMS_COLLECTION = 'streams';

/**
 * POST /api/streams/[id]/whip
 * Unified WHIP (WebRTC-HTTP Ingestion Protocol) endpoint
 * Handles WebRTC negotiation for browser-based streaming
 */
export const POST: RequestHandler = async ({ params, locals, request }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    const { id } = params;
    console.log('🎬 [WHIP] Request received for stream:', id);
    
    // Validate environment variables
    if (!CLOUDFLARE_API_TOKEN) {
      console.error('❌ [WHIP] Missing CLOUDFLARE_API_TOKEN');
      return new Response('Missing Cloudflare API token', { status: 500 });
    }
    
    if (!CLOUDFLARE_ACCOUNT_ID) {
      console.error('❌ [WHIP] Missing CLOUDFLARE_ACCOUNT_ID');
      return new Response('Missing Cloudflare account ID', { status: 500 });
    }
    
    // Get stream document
    const streamDoc = await adminDb.collection(STREAMS_COLLECTION).doc(id).get();
    if (!streamDoc.exists) {
      return new Response('Stream not found', { status: 404 });
    }

    const streamData = streamDoc.data()!;
    
    // Check permissions
    const access = await requireStreamAccess({
      streamId: id,
      stream: streamData,
      user: locals.user,
      action: 'start'
    });

    if (!access.canStart) {
      return new Response(`Permission denied: ${access.reason}`, { status: 403 });
    }

    // Get SDP offer from browser
    const sdpOffer = await request.text();
    console.log('📡 [WHIP] Received SDP offer, length:', sdpOffer.length);
    
    // Create or get Cloudflare Live Input
    let cloudflareId = streamData.cloudflareId;
    
    if (!cloudflareId) {
      console.log('🔧 [WHIP] Creating new Cloudflare Live Input...');
      
      const createResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          meta: {
            name: `${streamData.title} - WHIP Stream`
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
        console.error('❌ [WHIP] Failed to create Cloudflare Live Input:', errorText);
        throw new Error(`Failed to create Cloudflare Live Input: ${createResponse.status} - ${errorText}`);
      }
      
      const createData = await createResponse.json();
      cloudflareId = createData.result.uid;
      
      console.log('✅ [WHIP] Created Cloudflare Live Input:', cloudflareId);
    }
    
    // Get the WHIP endpoint from the live input
    const liveInputResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${cloudflareId}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!liveInputResponse.ok) {
      const errorText = await liveInputResponse.text();
      console.error('❌ [WHIP] Failed to get live input details:', errorText);
      throw new Error(`Failed to get live input details: ${liveInputResponse.status}`);
    }
    
    const liveInputData = await liveInputResponse.json();
    const whipEndpoint = liveInputData.result?.webRTC?.url;
    
    if (!whipEndpoint) {
      console.error('❌ [WHIP] No WHIP endpoint found in live input response');
      throw new Error('No WHIP endpoint found in live input response');
    }

    // Get playback URLs
    const playbackUrl = liveInputData.result?.webRTCPlayback?.url || 
                       `https://cloudflarestream.com/${cloudflareId}/iframe`;
    
    console.log('🔗 [WHIP] Using WHIP endpoint:', whipEndpoint);
    console.log('📺 [WHIP] Playback URL:', playbackUrl);
    
    // Negotiate with Cloudflare WHIP endpoint
    const cloudflareResponse = await fetch(whipEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/sdp'
      },
      body: sdpOffer
    });
    
    console.log('📡 [WHIP] Cloudflare response status:', cloudflareResponse.status);
    
    if (!cloudflareResponse.ok) {
      const errorText = await cloudflareResponse.text();
      console.error('❌ [WHIP] Cloudflare WHIP error:', errorText);
      throw new Error(`Cloudflare WHIP failed: ${cloudflareResponse.status} - ${errorText}`);
    }
    
    // Get SDP answer from Cloudflare
    const sdpAnswer = await cloudflareResponse.text();
    console.log('✅ [WHIP] WHIP connection successful, updating database status');
    
    // Update stream status to live AFTER successful WHIP connection
    const updateData = {
      status: 'live',
      cloudflareId,
      playbackUrl,
      actualStartTime: new Date(),
      isVisible: true,
      isPublic: streamData.isPublic !== false,
      updatedAt: new Date()
    };

    await adminDb.collection(STREAMS_COLLECTION).doc(id).update(updateData);
    
    console.log('✅ [WHIP] Stream updated to live status:', {
      streamId: id,
      cloudflareId,
      playbackUrl
    });
    
    // Return Cloudflare's SDP answer to browser
    return new Response(sdpAnswer, {
      status: 200,
      headers: {
        'Content-Type': 'application/sdp',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
    
  } catch (error) {
    console.error('❌ [WHIP] Endpoint error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [WHIP] Full error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return new Response(`WHIP connection failed: ${errorMessage}`, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
};
