import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from '$env/static/private';

/**
 * GET /api/streams/[id]/embed-info
 * Get complete Cloudflare embed information for a stream
 */
export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id: streamId } = params;
    
    console.log('🎬 [EMBED_INFO] Getting embed info for stream:', streamId);

    // Get stream data to find Cloudflare ID
    const streamResponse = await fetch(`http://localhost:5173/api/streams/${streamId}/status`);
    if (!streamResponse.ok) {
      return json({ error: 'Stream not found' }, { status: 404 });
    }
    
    const streamData = await streamResponse.json();
    const cloudflareId = streamData.cloudflare?.uid;
    
    if (!cloudflareId) {
      return json({ error: 'No Cloudflare ID found for stream' }, { status: 404 });
    }

    console.log('📡 [EMBED_INFO] Cloudflare ID:', cloudflareId);

    // Get live input details
    const liveInputResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${cloudflareId}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    let liveInputData = null;
    if (liveInputResponse.ok) {
      const response = await liveInputResponse.json();
      liveInputData = response.result;
    }

    // Get video details (for recordings)
    const videoResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${cloudflareId}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    let videoData = null;
    if (videoResponse.ok) {
      const response = await videoResponse.json();
      videoData = response.result;
    }

    // Build comprehensive embed info
    const embedInfo = {
      streamId,
      cloudflareId,
      status: streamData.status,
      
      // Basic embed URLs
      iframeUrl: `https://cloudflarestream.com/${cloudflareId}/iframe`,
      iframeUrlWithControls: `https://cloudflarestream.com/${cloudflareId}/iframe?controls=true&autoplay=false`,
      
      // Manifest URLs (for custom players)
      hlsManifest: `https://cloudflarestream.com/${cloudflareId}/manifest/video.m3u8`,
      dashManifest: `https://cloudflarestream.com/${cloudflareId}/manifest/video.mpd`,
      
      // Thumbnail URLs
      thumbnails: {
        default: `https://cloudflarestream.com/${cloudflareId}/thumbnails/thumbnail.jpg`,
        at10s: `https://cloudflarestream.com/${cloudflareId}/thumbnails/thumbnail.jpg?time=10s`,
        custom: `https://cloudflarestream.com/${cloudflareId}/thumbnails/thumbnail.jpg?width=640&height=360`
      },
      
      // Live input info
      liveInput: liveInputData ? {
        status: liveInputData.status?.current?.state,
        rtmpUrl: liveInputData.rtmps?.url,
        whipUrl: liveInputData.webRTC?.url,
        isConnected: liveInputData.status?.current?.state === 'connected'
      } : null,
      
      // Video info (recordings)
      video: videoData ? {
        status: videoData.status?.state,
        duration: videoData.duration,
        size: videoData.size,
        created: videoData.created,
        isReady: videoData.status?.state === 'ready'
      } : null,
      
      // Recommended embed code
      recommendedEmbed: streamData.status === 'live' 
        ? `<iframe src="https://cloudflarestream.com/${cloudflareId}/iframe?controls=true" width="640" height="360" frameborder="0" allowfullscreen></iframe>`
        : `<iframe src="https://cloudflarestream.com/${cloudflareId}/iframe" width="640" height="360" frameborder="0" allowfullscreen></iframe>`
    };

    console.log('✅ [EMBED_INFO] Complete embed info generated');

    return json(embedInfo);

  } catch (error) {
    console.error('❌ [EMBED_INFO] Error:', error);
    return json({ 
      error: 'Failed to get embed info',
      details: error.message 
    }, { status: 500 });
  }
};
