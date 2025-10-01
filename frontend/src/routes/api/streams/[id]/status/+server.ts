import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { requireStreamAccess } from '$lib/server/streamMiddleware';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from '$env/static/private';

const STREAMS_COLLECTION = 'streams';

/**
 * GET /api/streams/[id]/status
 * Get real-time stream status from both database and Cloudflare
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const { id } = params;
    
    console.log('🔍 [STATUS] Checking status for stream:', id);
    console.log('🔍 [STATUS] User:', locals.user?.uid, locals.user?.role);
    
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
      console.log('❌ [STATUS] Permission denied for user:', locals.user?.uid);
      return json({ error: 'Permission denied' }, { status: 403 });
    }
    
    console.log('✅ [STATUS] Permission granted, checking stream status...');

    // Get basic stream status from database
    const basicStatus = {
      streamId: id,
      status: streamData.status,
      title: streamData.title,
      isVisible: streamData.isVisible,
      isPublic: streamData.isPublic,
      recordingReady: streamData.recordingReady,
      createdAt: streamData.createdAt?.toDate(),
      actualStartTime: streamData.actualStartTime?.toDate(),
      endTime: streamData.endTime?.toDate()
    };

    // If stream has Cloudflare ID, get live status
    let cloudflareStatus = null;
    if (streamData.cloudflareId && CLOUDFLARE_API_TOKEN && CLOUDFLARE_ACCOUNT_ID) {
      try {
        const cfResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${streamData.cloudflareId}`, {
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (cfResponse.ok) {
          const cfData = await cfResponse.json();
          const liveInput = cfData.result;
          
          cloudflareStatus = {
            uid: liveInput.uid,
            status: liveInput.status,
            connected: liveInput.status === 'connected',
            recording: liveInput.recording,
            meta: liveInput.meta,
            created: liveInput.created,
            modified: liveInput.modified
          };

          // 🚀 AUTO-UPDATE: If Cloudflare shows connected but stream is ready, update to live
          const isCloudflareConnected = liveInput.status?.current?.state === 'connected';
          const isStreamReady = streamData.status === 'ready';
          
          if (isCloudflareConnected && isStreamReady) {
            console.log('🔴 [AUTO-LIVE] Cloudflare connected, updating stream to live:', params.id);
            
            try {
              await docRef.update({
                status: 'live',
                actualStartTime: new Date(),
                updatedAt: new Date(),
                lastWebhookEvent: 'auto-detection',
                lastWebhookTime: new Date()
              });
              
              // Update the returned status
              basicStatus.status = 'live';
              
              console.log('✅ [AUTO-LIVE] Stream automatically updated to live status');
            } catch (updateError) {
              console.error('❌ [AUTO-LIVE] Failed to update stream status:', updateError);
            }
          }

          // 🛑 AUTO-UPDATE: If Cloudflare shows disconnected but stream is live, update to ending (processing)
          const isCloudflareDisconnected = liveInput.status?.current?.state === 'disconnected';
          const isStreamLive = streamData.status === 'live';
          
          if (isCloudflareDisconnected && isStreamLive) {
            console.log('⏹️ [AUTO-STOP] Cloudflare disconnected, updating stream to ending (processing):', params.id);
            
            try {
              await docRef.update({
                status: 'ending',
                endTime: new Date(),
                updatedAt: new Date(),
                lastWebhookEvent: 'auto-detection',
                lastWebhookTime: new Date()
              });
              
              // Update the returned status
              basicStatus.status = 'ending';
              
              console.log('✅ [AUTO-STOP] Stream automatically updated to completed status');
            } catch (updateError) {
              console.error('❌ [AUTO-STOP] Failed to update stream status:', updateError);
            }
          }
        }
      } catch (error) {
        console.error('⚠️ [STATUS] Error fetching Cloudflare status:', error);
        // Continue without Cloudflare status
      }
    }

    return json({
      ...basicStatus,
      cloudflare: cloudflareStatus,
      lastChecked: new Date()
    });

  } catch (error) {
    console.error('❌ [STATUS] Error:', error);
    console.error('❌ [STATUS] Error details:', {
      message: error.message,
      stack: error.stack,
      streamId: params.id,
      userId: locals.user?.uid
    });
    return json({ 
      error: 'Failed to get stream status',
      details: error.message 
    }, { status: 500 });
  }
};
