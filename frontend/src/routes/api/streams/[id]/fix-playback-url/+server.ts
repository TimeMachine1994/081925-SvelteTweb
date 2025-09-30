import { json } from '@sveltejs/kit';
import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } from '$env/static/private';
import { adminDb } from '$lib/server/firebase';
import { requireStreamAccess } from '$lib/server/streamMiddleware';
import type { RequestHandler } from './$types';

const STREAMS_COLLECTION = 'streams';

/**
 * POST /api/streams/[id]/fix-playback-url
 * Fix Cloudflare playback URL for a stream
 */
export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const streamId = params.id;
    console.log('🔧 [FIX_PLAYBACK_URL] Fixing playback URL for stream:', streamId);

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

    // Get live input details to find the correct playback URL
    const liveInputResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${cloudflareId}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!liveInputResponse.ok) {
      const errorText = await liveInputResponse.text();
      console.error('❌ [FIX_PLAYBACK_URL] Cloudflare API error:', errorText);
      return json({ 
        error: 'Failed to get live input details', 
        status: liveInputResponse.status,
        details: errorText
      }, { status: liveInputResponse.status });
    }

    const liveInputData = await liveInputResponse.json();
    console.log('📡 [FIX_PLAYBACK_URL] Live input data:', JSON.stringify(liveInputData.result, null, 2));
    
    // Try multiple possible playback URL locations (prioritize HLS)
    const correctPlaybackUrl = liveInputData.result?.playback?.hls ||
                               liveInputData.result?.playback?.dash ||
                               liveInputData.result?.webRTCPlayback?.url ||
                               `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${cloudflareId}/manifest/video.m3u8`;
    
    console.log('✅ [FIX_PLAYBACK_URL] Found playback URL:', correctPlaybackUrl);
    
    if (!correctPlaybackUrl) {
      return json({ 
        error: 'No playback URL found in live input',
        liveInputData: liveInputData.result
      }, { status: 400 });
    }

    // Update the unified stream with standardized field names
    await streamDoc.ref.update({
      // Standardized recording fields
      recordingUrl: correctPlaybackUrl,
      playbackUrl: `https://cloudflarestream.com/${cloudflareId}/iframe`,
      updatedAt: new Date()
    });

    console.log('✅ [FIX_PLAYBACK_URL] Updated stream with corrected URLs');

    return json({ 
      success: true,
      message: 'Playback URL updated successfully',
      streamId,
      oldUrl: streamData.recordingUrl || streamData.playbackUrl,
      newRecordingUrl: correctPlaybackUrl,
      newPlaybackUrl: `https://cloudflarestream.com/${cloudflareId}/iframe`
    });

  } catch (error) {
    console.error('❌ [FIX_PLAYBACK_URL] Error:', error);
    return json({ 
      error: 'Failed to fix playback URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
