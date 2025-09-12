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
    const { formData } = data;

    if (!formData || !formData.mainService) {
      return json({ error: 'Invalid form data provided' }, { status: 400 });
    }

    const { mainService } = formData;
    const { date, time, isUnknown } = mainService.time;

    if (!isUnknown && (!date || !time)) {
      return json({ error: 'Service date and time are required unless marked as unknown' }, { status: 400 });
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
    const canEdit = memorial.ownerUid === locals.user.uid || 
                   memorial.funeralDirectorUid === locals.user.uid ||
                   locals.user.role === 'admin';

    if (!canEdit) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    const updateData: any = {
      'schedule.mainService': mainService,
      'schedule.timeIsUnknown': isUnknown,
      updatedAt: Timestamp.now()
    };

    if (!isUnknown) {
      const serviceDateTime = new Date(`${date}T${time}`);
      updateData['schedule.serviceDate'] = Timestamp.fromDate(serviceDateTime);
    }

    await adminDb.collection('memorials').doc(memorialId).update(updateData);

    return json({ 
      success: true,
      message: 'Schedule updated successfully',
      schedule: {
        ...mainService
      }
    });

  } catch (error) {
    console.error('Schedule update error:', error);
    return json({ error: 'Failed to update schedule' }, { status: 500 });
  }
};
