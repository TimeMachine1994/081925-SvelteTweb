import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const streamDoc = await adminDb.collection('mvp_two_streams').doc(params.id).get();
    
    if (!streamDoc.exists) {
      return json({ error: 'Stream not found' }, { status: 404 });
    }
    
    const data = streamDoc.data()!;
    
    return json({
      streamId: params.id,
      status: data.status,
      recordingReady: data.recordingReady,
      recordingPlaybackUrl: data.recordingPlaybackUrl,
      recordingDashUrl: data.recordingDashUrl,
      recordingThumbnail: data.recordingThumbnail,
      recordingDuration: data.recordingDuration,
      recordingSize: data.recordingSize,
      cloudflareStreamId: data.cloudflareStreamId,
      videoId: data.videoId,
      whipActive: data.whipActive,
      actualStartTime: data.actualStartTime,
      actualEndTime: data.actualEndTime,
      updatedAt: data.updatedAt,
      recordingUpdatedAt: data.recordingUpdatedAt
    });
  } catch (error) {
    console.error('Error fetching stream status:', error);
    return json({ error: 'Failed to fetch stream status' }, { status: 500 });
  }
};
