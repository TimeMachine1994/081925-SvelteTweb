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
    return json({ error: 'Failed to get stream status' }, { status: 500 });
  }
};
