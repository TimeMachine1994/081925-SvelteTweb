import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } from '$env/static/private';
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
    
    // Get live input details from Cloudflare
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${cloudflareStreamId}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status}`);
    }
    
    const result = await response.json();
    const liveInput = result.result;
    
    // Also check for any videos associated with this live input
    const videosResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream?search=${cloudflareStreamId}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const videosResult = await videosResponse.json();
    const videos = videosResult.result || [];
    
    return json({
      streamId: params.id,
      cloudflareStreamId,
      liveInput: {
        uid: liveInput.uid,
        created: liveInput.created,
        modified: liveInput.modified,
        meta: liveInput.meta,
        status: liveInput.status,
        recording: liveInput.recording,
        rtmps: liveInput.rtmps,
        rtmpsPlayback: liveInput.rtmpsPlayback,
        srt: liveInput.srt,
        srtPlayback: liveInput.srtPlayback,
        webRTC: liveInput.webRTC,
        webRTCPlayback: liveInput.webRTCPlayback
      },
      associatedVideos: videos.map((video: any) => ({
        uid: video.uid,
        status: video.status,
        readyToStream: video.readyToStream,
        duration: video.duration,
        created: video.created,
        size: video.size,
        preview: video.preview,
        playback: video.playback
      })),
      totalVideos: videos.length
    });
    
  } catch (error) {
    console.error('Error fetching live input details:', error);
    return json({ error: 'Failed to fetch live input details' }, { status: 500 });
  }
};
