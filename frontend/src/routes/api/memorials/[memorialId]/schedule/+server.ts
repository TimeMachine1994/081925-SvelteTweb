import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { memorialId } = params;
    const data = await request.json();
    const { serviceDate, serviceTime, duration } = data;

    if (!serviceDate || !serviceTime) {
      return json({ error: 'Service date and time are required' }, { status: 400 });
    }

    // Get memorial to verify ownership
    const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
    
    if (!memorialDoc.exists) {
      return json({ error: 'Memorial not found' }, { status: 404 });
    }

    const memorial = memorialDoc.data();

    // Check if user has permission to edit (owner or funeral director who created it)
    const canEdit = memorial.ownerId === locals.user.uid || 
                   memorial.creatorUid === locals.user.uid ||
                   memorial.funeralDirectorId === locals.user.uid;

    if (!canEdit) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    // Combine date and time into a timestamp
    const serviceDateTime = new Date(`${serviceDate}T${serviceTime}`);
    
    // Update memorial with new schedule
    await adminDb.collection('memorials').doc(memorialId).update({
      serviceDate: Timestamp.fromDate(serviceDateTime),
      serviceTime: serviceTime,
      duration: duration || 2,
      updatedAt: Timestamp.now()
    });

    return json({ 
      success: true,
      message: 'Schedule updated successfully',
      schedule: {
        serviceDate: serviceDateTime.toISOString(),
        serviceTime: serviceTime,
        duration: duration || 2
      }
    });

  } catch (error) {
    console.error('Schedule update error:', error);
    return json({ error: 'Failed to update schedule' }, { status: 500 });
  }
};
