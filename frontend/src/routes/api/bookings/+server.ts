import { getAdminDb } from '$lib/server/firebase';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Timestamp } from 'firebase-admin/firestore';
import { EmptyForm } from '$lib/data/calculator';

export const POST: RequestHandler = async ({ locals }) => {
    console.log('🚀 API POST /api/bookings: Creating new draft booking...');

    const db = getAdminDb();
    const bookingsRef = db.collection('bookings');

    try {
        const newBooking = {
            status: 'draft',
            formData: EmptyForm,
            bookingItems: [],
            total: 0,
            userId: locals.user?.uid || null,
            memorialId: null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const docRef = await bookingsRef.add(newBooking);
        console.log(`✅ Draft booking created successfully with ID: ${docRef.id}`);

        return json({ success: true, bookingId: docRef.id });

    } catch (e) {
        console.error('❌ API POST /api/bookings: Error creating draft booking', e);
        throw error(500, 'Could not create a new booking.');
    }
};