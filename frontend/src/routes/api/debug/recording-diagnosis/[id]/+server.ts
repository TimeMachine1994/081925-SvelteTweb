import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    console.log('🔍 [DIAGNOSIS] Starting comprehensive recording diagnosis for:', params.id);
    
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
    
    // 1. Get live input details
    const liveInputResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${cloudflareStreamId}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const liveInputResult = await liveInputResponse.json();
    const liveInput = liveInputResult.result;
    
    // 2. Search for ALL videos (not just by live input ID)
    const allVideosResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const allVideosResult = await allVideosResponse.json();
    const allVideos = allVideosResult.result || [];
    
    // 3. Search for videos by live input ID
    const searchResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream?search=${cloudflareStreamId}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const searchResult = await searchResponse.json();
    const searchVideos = searchResult.result || [];
    
    // 4. Look for videos created around the stream time
    const streamCreated = streamData.createdAt?.toDate() || new Date();
    const timeWindow = 2 * 60 * 60 * 1000; // 2 hours
    const recentVideos = allVideos.filter((video: any) => {
      const videoCreated = new Date(video.created);
      return Math.abs(videoCreated.getTime() - streamCreated.getTime()) < timeWindow;
    });
    
    // 5. Check webhook logs (if any exist)
    const webhookLogsQuery = await adminDb
      .collection('webhook_logs')
      .where('streamId', '==', params.id)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    const webhookLogs = webhookLogsQuery.docs.map(doc => doc.data());
    
    return json({
      diagnosis: {
        streamId: params.id,
        cloudflareStreamId,
        streamData: {
          status: streamData.status,
          createdAt: streamData.createdAt,
          actualStartTime: streamData.actualStartTime,
          actualEndTime: streamData.actualEndTime,
          whipActive: streamData.whipActive,
          recordingReady: streamData.recordingReady,
          videoId: streamData.videoId
        },
        liveInput: {
          uid: liveInput?.uid,
          status: liveInput?.status,
          recording: liveInput?.recording,
          created: liveInput?.created,
          modified: liveInput?.modified
        },
        videoSearch: {
          totalVideosInAccount: allVideos.length,
          videosFoundBySearch: searchVideos.length,
          videosInTimeWindow: recentVideos.length,
          searchVideos: searchVideos.map((v: any) => ({
            uid: v.uid,
            status: v.status,
            readyToStream: v.readyToStream,
            duration: v.duration,
            created: v.created,
            liveInput: v.liveInput,
            meta: v.meta
          })),
          recentVideos: recentVideos.map((v: any) => ({
            uid: v.uid,
            status: v.status,
            readyToStream: v.readyToStream,
            duration: v.duration,
            created: v.created,
            liveInput: v.liveInput,
            meta: v.meta
          }))
        },
        webhookLogs: webhookLogs,
        possibleIssues: []
      }
    });
    
  } catch (error) {
    console.error('❌ [DIAGNOSIS] Error:', error);
    return json({ error: 'Failed to run diagnosis' }, { status: 500 });
  }
};
