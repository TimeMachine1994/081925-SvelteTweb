import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } from '$env/static/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    console.log('🔧 [FRESH INPUT] Creating new live input for stream:', params.id);
    
    // Create new Cloudflare Live Input
    const createResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meta: {
          name: `Fresh MVP Two Stream ${params.id} - ${new Date().toISOString()}`
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
        maxDurationSeconds: 21600
      })
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ [FRESH INPUT] Failed to create live input:', errorText);
      return json({ 
        error: 'Failed to create live input', 
        details: errorText 
      }, { status: createResponse.status });
    }
    
    const createData = await createResponse.json();
    const newLiveInput = createData.result;
    const newCloudflareStreamId = newLiveInput.uid;
    
    console.log('✅ [FRESH INPUT] Created new live input:', newCloudflareStreamId);
    
    // Update stream with new Cloudflare details
    await adminDb.collection('mvp_two_streams').doc(params.id).update({
      cloudflareStreamId: newCloudflareStreamId,
      updatedAt: new Date(),
      freshInputCreated: new Date()
    });
    
    return json({
      success: true,
      streamId: params.id,
      oldCloudflareStreamId: 'Previous input replaced',
      newCloudflareStreamId,
      newCredentials: {
        rtmps: {
          url: newLiveInput.rtmps?.url,
          streamKey: newLiveInput.rtmps?.streamKey
        },
        whip: {
          endpoint: `/api/streams/${params.id}/whip`
        }
      },
      instructions: [
        "1. Use the NEW RTMP credentials in OBS",
        "2. Or try WHIP streaming again from browser",
        "3. Fresh live input should resolve connection issues"
      ]
    });
    
  } catch (error) {
    console.error('❌ [FRESH INPUT] Error:', error);
    return json({ error: 'Failed to create fresh live input' }, { status: 500 });
  }
};
