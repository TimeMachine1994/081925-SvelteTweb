import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

export const GET: RequestHandler = async ({ locals, params }) => {
  try {
    const { memorialId } = params;

    // Get all livestreams for this memorial
    const livestreamsQuery = adminDb
      .collection('memorials')
      .doc(memorialId)
      .collection('livestreams')
      .orderBy('createdAt', 'desc');

    const snapshot = await livestreamsQuery.get();
    const livestreams = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter based on permissions if user is authenticated
    if (locals.user) {
      const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
      const memorial = memorialDoc.data();
      
      const isFuneralDirector = memorial?.funeralDirector?.id === locals.user.uid;
      const isOwner = memorial?.ownerId === locals.user.uid;
      
      if (isFuneralDirector || isOwner) {
        // Return all streams for funeral director/owner
        return json({ livestreams });
      }
    }

    // Return only public streams for other users
    const publicStreams = livestreams.filter(stream => stream.isPublic);
    return json({ livestreams: publicStreams });

  } catch (error) {
    console.error('Error fetching livestreams:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
