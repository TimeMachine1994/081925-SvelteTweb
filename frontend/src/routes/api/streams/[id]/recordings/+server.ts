import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { requireStreamAccess } from '$lib/server/streamMiddleware';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from '$env/static/private';

const STREAMS_COLLECTION = 'streams';

/**
 * GET /api/streams/[id]/recordings
 * Get ALL recordings for a stream (supports multiple recordings)
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

    // Get multiple recordings from new recordings array
    const recordings = streamData.recordings || [];
    
    // Also include legacy single recording for backward compatibility
    const legacyRecording = {
      id: 'legacy',
      cloudflareVideoId: streamData.cloudflareId,
      recordingUrl: streamData.recordingUrl,
      playbackUrl: streamData.playbackUrl,
      duration: streamData.recordingDuration,
      createdAt: streamData.createdAt || streamData.updatedAt,
      title: `${streamData.title} - Recording`,
      sequenceNumber: 0,
      recordingReady: streamData.recordingReady || false
    };

    // Combine legacy + new recordings
    const allRecordings = [
      ...(streamData.recordingReady && legacyRecording.recordingUrl ? [legacyRecording] : []),
      ...recordings
    ].filter(r => r.recordingReady && r.recordingUrl);

    const result = {
      streamId: id,
      totalRecordings: allRecordings.length,
      recordings: allRecordings.sort((a, b) => a.sequenceNumber - b.sequenceNumber),
      cloudflareId: streamData.cloudflareId || null,
      lastChecked: new Date()
    };

    console.log('📹 [RECORDINGS] Retrieved', result.totalRecordings, 'recordings for stream:', id);

    return json(result);

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

    // Get existing recordings array
    const existingRecordings = streamData.recordings || [];
    const existingVideoIds = existingRecordings.map((r: any) => r.cloudflareVideoId);

    let updateData: any = {
      updatedAt: new Date()
    };

    let newRecordings = [...existingRecordings];
    let foundNewRecording = false;

    if (recordedVideos.length > 0) {
      // Process each ready recording
      const readyVideos = recordedVideos.filter((video: any) => 
        video.status?.state === 'ready'
      );

      for (const video of readyVideos) {
        // Skip if we already have this recording
        if (existingVideoIds.includes(video.uid)) {
          continue;
        }

        // Create new recording entry
        const newRecording = {
          id: `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          cloudflareVideoId: video.uid,
          recordingUrl: video.playback?.hls || video.playback?.dash,
          playbackUrl: `https://cloudflarestream.com/${video.uid}/iframe`,
          duration: video.duration,
          createdAt: new Date(video.created),
          title: `${streamData.title} - Recording ${newRecordings.length + 1}`,
          sequenceNumber: newRecordings.length + 1,
          recordingReady: true
        };

        newRecordings.push(newRecording);
        foundNewRecording = true;

        console.log('✅ [RECORDINGS] Added new recording:', {
          videoId: video.uid,
          duration: video.duration,
          sequenceNumber: newRecording.sequenceNumber,
          title: newRecording.title
        });
      }

      // Update legacy fields for backward compatibility (use most recent)
      if (readyVideos.length > 0) {
        const mostRecent = readyVideos[readyVideos.length - 1];
        updateData = {
          ...updateData,
          recordingReady: true,
          recordingUrl: mostRecent.playback?.hls || mostRecent.playback?.dash,
          recordingDuration: mostRecent.duration,
          playbackUrl: `https://cloudflarestream.com/${mostRecent.uid}/iframe`
        };
      }

      // Check if any are still processing
      const processingVideos = recordedVideos.filter((video: any) => 
        video.status?.state === 'inprogress' || video.status?.state === 'queued'
      );

      if (processingVideos.length > 0) {
        console.log('⏳ [RECORDINGS] Still processing:', processingVideos.length, 'recordings');
      }
    } else {
      console.log('📭 [RECORDINGS] No recordings found yet');
      updateData.recordingReady = false;
    }

    // Update recordings array
    updateData.recordings = newRecordings;

    // Update stream document
    await docRef.update(updateData);

    const result = {
      streamId: id,
      recordingsFound: recordedVideos.length,
      totalRecordings: newRecordings.length,
      newRecordingsAdded: foundNewRecording ? newRecordings.length - existingRecordings.length : 0,
      recordings: newRecordings,
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
