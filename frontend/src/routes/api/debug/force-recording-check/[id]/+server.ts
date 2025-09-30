import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } from '$env/static/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    console.log('🔍 [FORCE CHECK] Checking recording for stream:', params.id);
    
    const streamDoc = await adminDb.collection('mvp_two_streams').doc(params.id).get();
    if (!streamDoc.exists) {
      return json({ error: 'Stream not found' }, { status: 404 });
    }
    
    const data = streamDoc.data()!;
    const cloudflareStreamId = data.cloudflareStreamId;
    
    if (!cloudflareStreamId) {
      return json({ error: 'No Cloudflare Stream ID found' }, { status: 400 });
    }
    
    // Check Cloudflare for videos associated with this live input
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream?search=${cloudflareStreamId}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status}`);
    }
    
    const result = await response.json();
    const videos = result.result || [];
    
    console.log('📹 [FORCE CHECK] Found videos:', videos.length);
    
    // Find the most recent video that's ready to stream
    const readyVideo = videos
      .filter((video: any) => video.readyToStream && video.status?.state === 'ready')
      .sort((a: any, b: any) => new Date(b.created).getTime() - new Date(a.created).getTime())[0];
    
    if (readyVideo) {
      console.log('✅ [FORCE CHECK] Found ready recording:', readyVideo.uid);
      
      // Update the stream with recording data
      await streamDoc.ref.update({
        recordingReady: true,
        videoId: readyVideo.uid,
        recordingPlaybackUrl: readyVideo.playback?.hls || null,
        recordingDashUrl: readyVideo.playback?.dash || null,
        recordingThumbnail: readyVideo.thumbnail || null,
        recordingDuration: readyVideo.duration || null,
        recordingSize: readyVideo.size || null,
        recordingUpdatedAt: new Date(),
        updatedAt: new Date()
      });
      
      return json({
        success: true,
        message: 'Recording found and updated',
        videoId: readyVideo.uid,
        duration: readyVideo.duration,
        playbackUrl: readyVideo.playback?.hls
      });
    } else {
      return json({
        success: false,
        message: 'No ready recordings found',
        totalVideos: videos.length,
        videos: videos.map((v: any) => ({
          uid: v.uid,
          status: v.status?.state,
          readyToStream: v.readyToStream,
          created: v.created
        }))
      });
    }
    
  } catch (error) {
    console.error('❌ [FORCE CHECK] Error:', error);
    return json({ error: 'Failed to check recording status' }, { status: 500 });
  }
};
