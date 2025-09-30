import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const memorialId = params.id;
    
    // Load MVPTwo streams for this memorial
    const mvpTwoStreamsRef = adminDb.collection('mvp_two_streams');
    const mvpTwoSnapshot = await mvpTwoStreamsRef
      .where('memorialId', '==', memorialId)
      .where('isVisible', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const mvpTwoStreams = mvpTwoSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Separate streams by status - Show ALL streams simultaneously
    const liveStreams = mvpTwoStreams.filter(stream => stream.status === 'live');
    
    // Show scheduled streams regardless of live streams
    const scheduledStreams = mvpTwoStreams.filter(stream => 
      stream.status === 'scheduled' || stream.status === 'ready'
    );
    
    // Show completed streams - relax recordingReady requirement for now
    const completedStreams = mvpTwoStreams.filter(stream => 
      stream.status === 'completed'
    );

    console.log('📺 Stream status check for memorial:', memorialId, {
      total: mvpTwoStreams.length,
      live: liveStreams.length,
      scheduled: scheduledStreams.length,
      completed: completedStreams.length,
      allStreams: mvpTwoStreams.map(s => ({
        id: s.id,
        title: s.title,
        status: s.status,
        isVisible: s.isVisible,
        memorialId: s.memorialId,
        playbackUrl: s.playbackUrl
      }))
    });

    return json({
      liveStreams,
      scheduledStreams,
      completedStreams,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking stream status:', error);
    return json({ error: 'Failed to check stream status' }, { status: 500 });
  }
};
