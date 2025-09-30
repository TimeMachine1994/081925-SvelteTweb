import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    console.log('🔍 [RTMP TEST] Testing RTMP connection for stream:', params.id);
    
    // Get stream from database
    const streamDoc = await adminDb.collection('mvp_two_streams').doc(params.id).get();
    if (!streamDoc.exists) {
      return json({ error: 'Stream not found' }, { status: 404 });
    }
    
    const streamData = streamDoc.data()!;
    const cloudflareStreamId = streamData.cloudflareStreamId;
    
    if (!cloudflareStreamId) {
      return json({ error: 'No Cloudflare Stream ID found' }, { status: 400 });
    }
    
    // Get live input details
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${cloudflareStreamId}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [RTMP TEST] Cloudflare API error:', response.status, errorText);
      return json({ 
        error: 'Cloudflare API error', 
        status: response.status,
        details: errorText 
      }, { status: response.status });
    }
    
    const result = await response.json();
    const liveInput = result.result;
    
    // Test if we can reach the RTMP endpoint
    const rtmpUrl = liveInput.rtmps?.url;
    const streamKey = liveInput.rtmps?.streamKey;
    
    return json({
      streamId: params.id,
      cloudflareStreamId,
      rtmpTest: {
        url: rtmpUrl,
        streamKey: streamKey,
        streamKeyLength: streamKey?.length || 0,
        urlValid: rtmpUrl?.includes('live.cloudflare.com'),
        obsSettings: {
          service: "Custom",
          server: rtmpUrl,
          streamKey: streamKey,
          instructions: [
            "1. Open OBS Studio",
            "2. Settings → Stream",
            "3. Service: Custom",
            `4. Server: ${rtmpUrl}`,
            `5. Stream Key: ${streamKey}`,
            "6. Apply → OK",
            "7. Start Streaming"
          ]
        }
      },
      liveInputStatus: {
        uid: liveInput.uid,
        status: liveInput.status,
        created: liveInput.created,
        recording: liveInput.recording
      },
      troubleshooting: [
        "If OBS shows 'Failed to connect': Check internet connection",
        "If 'Authentication failed': Stream key might be wrong",
        "If 'Connection timeout': Firewall blocking port 443",
        "Try non-secure RTMP: rtmp://live.cloudflare.com/live/"
      ]
    });
    
  } catch (error) {
    console.error('❌ [RTMP TEST] Error:', error);
    return json({ error: 'Failed to test RTMP connection' }, { status: 500 });
  }
};
