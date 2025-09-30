import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, FieldValue } from '$lib/server/firebase';
import { requireStreamAccess } from '$lib/server/streamMiddleware';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from '$env/static/private';

const STREAMS_COLLECTION = 'streams';

/**
 * POST /api/streams/[id]/stop
 * Stop a stream and trigger recording processing
 */
export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { id } = params;
    
    console.log('🛑 [STREAMS] Stopping stream:', id);

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
      action: 'stop'
    });

    if (!access.canStart) { // Using canStart for stop permission
      return json({ error: 'Permission denied to stop stream' }, { status: 403 });
    }

    // Check if stream is actually live
    if (streamData.status !== 'live') {
      return json({ error: 'Stream is not currently live' }, { status: 400 });
    }

    const endTime = new Date();
    
    // Check for recorded video immediately
    let recordingStatus = 'processing';
    let recordingUrl = null;
    let recordingDuration = null;

    if (streamData.cloudflareId) {
      try {
        console.log('🔍 [STREAMS] Checking for immediate recording...');
        
        // Search for recorded videos
        const searchResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream?search=${streamData.cloudflareId}`, {
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          const videos = searchData.result || [];
          
          // Look for a video that matches our live input
          const recordedVideo = videos.find((video: any) => 
            video.liveInput === streamData.cloudflareId && 
            video.status?.state === 'ready'
          );

          if (recordedVideo) {
            recordingStatus = 'ready';
            recordingUrl = recordedVideo.playback?.hls || recordedVideo.playback?.dash;
            recordingDuration = recordedVideo.duration;
            
            console.log('✅ [STREAMS] Found immediate recording:', {
              videoId: recordedVideo.uid,
              duration: recordingDuration,
              url: recordingUrl
            });
          } else {
            console.log('⏳ [STREAMS] No immediate recording found, will process asynchronously');
          }
        }
      } catch (error) {
        console.error('⚠️ [STREAMS] Error checking for recording:', error);
        // Continue with processing status
      }
    }

    // Update stream status
    const updateData = {
      status: 'completed',
      endTime,
      recordingReady: recordingStatus === 'ready',
      recordingUrl,
      recordingDuration,
      updatedAt: new Date()
    };

    await docRef.update(updateData);

    // Note: Removed livestreamArchive array writes to prevent document size limit issues
    // Archive data is now queried directly from the streams collection using memorialId
    console.log('✅ [STREAMS] Stream completed for memorial:', streamData.memorialId || 'none');

    console.log('✅ [STREAMS] Stream stopped successfully:', {
      streamId: id,
      recordingStatus,
      hasRecording: !!recordingUrl
    });

    return json({
      success: true,
      streamId: id,
      status: 'completed',
      recordingStatus,
      recordingReady: recordingStatus === 'ready',
      recordingUrl,
      message: recordingStatus === 'ready' 
        ? 'Stream stopped and recording is ready' 
        : 'Stream stopped, recording will be available shortly'
    });

  } catch (error) {
    console.error('❌ [STREAMS] Stop error:', error);
    return json({ error: 'Failed to stop stream' }, { status: 500 });
  }
};
