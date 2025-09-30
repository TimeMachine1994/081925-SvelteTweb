import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
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
    
    // Get live input details to extract RTMP credentials
    const liveInputResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${cloudflareStreamId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const liveInputResult = await liveInputResponse.json();
    const liveInput = liveInputResult.result;
    
    return json({
      streamId: params.id,
      cloudflareStreamId,
      rtmpCredentials: {
        url: liveInput.rtmps?.url,
        streamKey: liveInput.rtmps?.streamKey,
        instructions: [
          "1. Open OBS or similar streaming software",
          "2. Go to Settings → Stream",
          "3. Service: Custom",
          "4. Server: " + liveInput.rtmps?.url,
          "5. Stream Key: " + liveInput.rtmps?.streamKey,
          "6. Start streaming for 3+ minutes",
          "7. Stop and wait 2 minutes for recording"
        ]
      },
      whipEndpoint: `/api/streams/${params.id}/whip`,
      comparison: "Test RTMP vs WHIP to isolate recording issue"
    });
    
  } catch (error) {
    console.error('Error getting RTMP test info:', error);
    return json({ error: 'Failed to get RTMP test info' }, { status: 500 });
  }
};
