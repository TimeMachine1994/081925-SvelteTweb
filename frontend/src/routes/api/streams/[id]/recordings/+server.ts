import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { requireStreamAccess } from '$lib/server/streamMiddleware';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from '$env/static/private';

const STREAMS_COLLECTION = 'streams';

/**
 * GET /api/streams/[id]/recordings
 * Get recording status and URLs for a stream
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const { id } = params;
    
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
      action: 'view'
    });

    if (!access.canView) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    const recordings = {
      streamId: id,
      recordingReady: streamData.recordingReady || false,
      recordingUrl: streamData.recordingUrl || null,
      recordingDuration: streamData.recordingDuration || null,
      playbackUrl: streamData.playbackUrl || null,
      cloudflareId: streamData.cloudflareId || null,
      lastChecked: new Date()
    };

    return json(recordings);

  } catch (error) {
    console.error('❌ [RECORDINGS] Error:', error);
    return json({ error: 'Failed to get recordings' }, { status: 500 });
  }
};

/**
 * POST /api/streams/[id]/recordings
 * Manually sync recording status from Cloudflare
 */
export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { id } = params;
    
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
      action: 'edit'
    });

    if (!access.canEdit) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    if (!streamData.cloudflareId) {
      return json({ error: 'No Cloudflare ID found for this stream' }, { status: 400 });
    }

    if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
      return json({ error: 'Cloudflare API not configured' }, { status: 500 });
    }

    console.log('🔄 [RECORDINGS] Syncing recordings for stream:', id);

    // Search for recorded videos
    const searchResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream?search=${streamData.cloudflareId}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('❌ [RECORDINGS] Cloudflare search failed:', errorText);
      return json({ error: 'Failed to search Cloudflare recordings' }, { status: 502 });
    }

    const searchData = await searchResponse.json();
    const videos = searchData.result || [];
    
    // Look for recordings from this live input
    const recordedVideos = videos.filter((video: any) => 
      video.liveInput === streamData.cloudflareId
    );

    console.log('🎥 [RECORDINGS] Found', recordedVideos.length, 'recorded videos');

    let updateData: any = {
      updatedAt: new Date()
    };

    if (recordedVideos.length > 0) {
      // Get the most recent ready recording
      const readyVideo = recordedVideos.find((video: any) => 
        video.status?.state === 'ready'
      );

      if (readyVideo) {
        updateData = {
          ...updateData,
          recordingReady: true,
          recordingUrl: readyVideo.playback?.hls || readyVideo.playback?.dash,
          recordingDuration: readyVideo.duration,
          playbackUrl: `https://cloudflarestream.com/${readyVideo.uid}/iframe`
        };

        console.log('✅ [RECORDINGS] Found ready recording:', {
          videoId: readyVideo.uid,
          duration: readyVideo.duration,
          url: updateData.recordingUrl
        });
      } else {
        // Check if any are still processing
        const processingVideo = recordedVideos.find((video: any) => 
          video.status?.state === 'inprogress' || video.status?.state === 'queued'
        );

        if (processingVideo) {
          updateData.recordingReady = false;
          console.log('⏳ [RECORDINGS] Recording still processing:', processingVideo.uid);
        }
      }
    } else {
      console.log('📭 [RECORDINGS] No recordings found yet');
      updateData.recordingReady = false;
    }

    // Update stream document
    await docRef.update(updateData);

    const result = {
      streamId: id,
      recordingsFound: recordedVideos.length,
      recordingReady: updateData.recordingReady || false,
      recordingUrl: updateData.recordingUrl || null,
      recordingDuration: updateData.recordingDuration || null,
      syncedAt: new Date()
    };

    console.log('✅ [RECORDINGS] Sync completed:', result);

    return json(result);

  } catch (error) {
    console.error('❌ [RECORDINGS] Sync error:', error);
    return json({ error: 'Failed to sync recordings' }, { status: 500 });
  }
};
