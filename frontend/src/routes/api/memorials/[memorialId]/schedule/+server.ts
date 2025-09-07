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
    const { serviceDate, serviceTime, duration, location, timeIsUnknown } = data;

    if (!serviceDate || !serviceTime) {
      return json({ error: 'Service date and time are required' }, { status: 400 });
    }

    // Get memorial to verify ownership
    const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
    
    if (!memorialDoc.exists) {
      return json({ error: 'Memorial not found' }, { status: 404 });
    }

    const memorial = memorialDoc.data();
    
    if (!memorial) {
      return json({ error: 'Memorial data not found' }, { status: 404 });
    }

    // Check if user has permission to edit this memorial
    const canEdit = memorial.ownerId === locals.user.uid || 
                   memorial.createdBy === locals.user.uid || 
                   memorial.funeralDirectorId === locals.user.uid;

    if (!canEdit) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    // Combine date and time into a timestamp
    const serviceDateTime = new Date(`${serviceDate}T${serviceTime}`);
    
    // Update memorial with new schedule
    const updateData: any = {
      serviceDate: Timestamp.fromDate(serviceDateTime),
      serviceTime: serviceTime,
      duration: duration || 2,
      timeIsUnknown: timeIsUnknown || false,
      updatedAt: Timestamp.now()
    };

    // Add location data if provided
    if (location) {
      updateData.location = location;
    }

    await adminDb.collection('memorials').doc(memorialId).update(updateData);

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
