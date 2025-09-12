import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { FuneralDirector } from '$lib/types/funeral-director';
import { Timestamp } from 'firebase-admin/firestore';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields (V1: simplified)
    const requiredFields = [
      'companyName', 'contactPerson', 
      'email', 'phone', 'address'
    ];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Create funeral director document (V1: simplified)
    const funeralDirector: Omit<FuneralDirector, 'id'> = {
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      address: {
        street: data.address.street,
        city: data.address.city,
        state: data.address.state,
        zipCode: data.address.zipCode
      },
      status: 'approved', // V1: auto-approved
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Save to Firestore
    const docRef = adminDb.collection('funeral_directors').doc(locals.user.uid);
    await docRef.set(funeralDirector);

    // Update user's custom claims to include funeral_director role
    const auth = (await import('firebase-admin/auth')).getAuth();
    await auth.setCustomUserClaims(locals.user.uid, {
      ...locals.user.customClaims,
      role: 'funeral_director'
    });

    return json({ 
      success: true, 
      message: 'Funeral director registration completed successfully',
      id: locals.user.uid
    });

  } catch (error) {
    console.error('Error registering funeral director:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
