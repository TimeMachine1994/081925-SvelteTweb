import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

export const POST: RequestHandler = async ({ request, locals, params }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { memorialId } = params;

    // Get memorial to verify ownership/permissions
    const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
    
    if (!memorialDoc.exists) {
      return json({ error: 'Memorial not found' }, { status: 404 });
    }

    const memorial = memorialDoc.data();
    
    if (!memorial) {
      return json({ error: 'Memorial data not found' }, { status: 404 });
    }

    // Check if user has permission to stream (funeral director, owner, or admin)
    const canStream = memorial.ownerUid === locals.user.uid || 
                     memorial.funeralDirectorUid === locals.user.uid ||
                     locals.user.role === 'admin' ||
                     locals.user.role === 'funeral_director';

    if (!canStream) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    // Generate or retrieve stream key for Cloudflare Stream
    let streamKey = memorial.mobileStreamKey;
    
    if (!streamKey) {
      // Generate a unique stream key
      streamKey = `mobile_${memorialId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update memorial with stream key
      await adminDb.collection('memorials').doc(memorialId).update({
        mobileStreamKey: streamKey,
        livestreamEnabled: true,
        mobileStreamEnabled: true,
        updatedAt: new Date()
      });
    }

    // In a real implementation, you would create a Cloudflare Stream Live Input here
    // For now, we'll simulate the response
    const cloudflareStreamData = {
      uid: `stream_${memorialId}`,
      rtmps: {
        url: `rtmps://live.cloudflare.com/live/${streamKey}`,
        streamKey: streamKey
      },
      webRTC: {
        url: `https://customer-${process.env.CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${streamKey}/webRTC/play`
      },
      srt: {
        url: `srt://live.cloudflare.com:778?streamid=${streamKey}`
      }
    };

    return json({
      success: true,
      memorialId,
      streamKey,
      streamData: cloudflareStreamData,
      mobileStreamUrl: `/funeral-director/mobile-stream/${memorialId}?key=${streamKey}`,
      viewerUrl: `/tributes/${memorial.slug || memorialId}`,
      message: 'Mobile stream ready'
    });

  } catch (error) {
    console.error('Mobile stream setup error:', error);
    return json({ error: 'Failed to setup mobile stream' }, { status: 500 });
  }
};
