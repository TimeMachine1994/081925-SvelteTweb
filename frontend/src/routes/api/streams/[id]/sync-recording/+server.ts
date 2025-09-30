import { json } from '@sveltejs/kit';
import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } from '$env/static/private';
import { adminDb, FieldValue } from '$lib/server/firebase';
import { requireStreamAccess } from '$lib/server/streamMiddleware';
import type { RequestHandler } from './$types';

const STREAMS_COLLECTION = 'streams';

/**
 * POST /api/streams/[id]/sync-recording
 * Manually sync recording status with Cloudflare
 */
export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const streamId = params.id;
    console.log('🔄 [SYNC_RECORDING] Syncing recording for stream:', streamId);

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

    // Search for recordings associated with this live input
    const searchResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream?search=${cloudflareId}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('❌ [SYNC_RECORDING] Search failed:', errorText);
      return json({ 
        error: 'Failed to search for recordings',
        details: errorText
      }, { status: searchResponse.status });
    }

    const searchData = await searchResponse.json();
    const recordings = searchData.result || [];
    
    console.log('🔍 [SYNC_RECORDING] Found recordings:', recordings.length);

    if (recordings.length === 0) {
      return json({
        success: true,
        message: 'No recordings found yet',
        streamId,
        recordingsFound: 0,
        status: 'no_recordings'
      });
    }

    // Find the most recent ready recording
    const readyRecordings = recordings.filter((r: any) => r.status?.state === 'ready');
    
    if (readyRecordings.length === 0) {
      return json({
        success: true,
        message: 'Recordings found but still processing',
        streamId,
        recordingsFound: recordings.length,
        processingRecordings: recordings.filter((r: any) => r.status?.state === 'inprogress').length,
        status: 'processing'
      });
    }

    // Get the most recent ready recording
    const latestRecording = readyRecordings.sort((a: any, b: any) => 
      new Date(b.created).getTime() - new Date(a.created).getTime()
    )[0];

    console.log('✅ [SYNC_RECORDING] Found ready recording:', latestRecording.uid);

    // Create recording session entry
    const recordingSession = {
      sessionId: `session_${Date.now()}`,
      cloudflareStreamId: latestRecording.uid,
      startTime: streamData.actualStartTime || new Date(latestRecording.created),
      endTime: new Date(),
      duration: latestRecording.duration || null,
      status: 'ready',
      recordingReady: true,
      recordingUrl: latestRecording.playback?.hls || latestRecording.playback?.dash || null,
      playbackUrl: `https://cloudflarestream.com/${latestRecording.uid}/iframe`,
      thumbnailUrl: latestRecording.thumbnail || null,
      createdAt: new Date(latestRecording.created),
      updatedAt: new Date()
    };

    // Update stream with recording information
    const updateData = {
      // Legacy fields (for backward compatibility)
      recordingReady: true,
      recordingUrl: recordingSession.recordingUrl,
      recordingDuration: latestRecording.duration || null,
      
      // New multi-session recording system
      recordingSessions: FieldValue.arrayUnion(recordingSession),
      
      // Stream status
      status: 'completed',
      playbackUrl: recordingSession.playbackUrl,
      updatedAt: new Date(),
      
      // Sync metadata
      lastRecordingSync: new Date(),
      recordingSyncCount: (streamData.recordingSyncCount || 0) + 1
    };

    await streamDoc.ref.update(updateData);

    console.log('✅ [SYNC_RECORDING] Updated stream with recording data');

    return json({
      success: true,
      message: 'Recording synced successfully',
      streamId,
      recordingId: latestRecording.uid,
      recordingUrl: recordingSession.recordingUrl,
      playbackUrl: recordingSession.playbackUrl,
      duration: latestRecording.duration,
      recordingsFound: recordings.length,
      readyRecordings: readyRecordings.length,
      status: 'synced'
    });

  } catch (error) {
    console.error('❌ [SYNC_RECORDING] Error:', error);
    return json({ 
      error: 'Failed to sync recording',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
