import { getAdminDb } from '$lib/server/firebase';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Timestamp } from 'firebase-admin/firestore';

export const PUT: RequestHandler = async ({ request, params, locals }) => {
    console.log(`🚀 API PUT /api/bookings/${params.bookingId}: Updating draft booking...`);
   
    if (!locals.user) {
    	throw error(401, 'Unauthorized');
    }
   
    const db = getAdminDb();
    const bookingRef = db.collection('users').doc(locals.user.uid).collection('bookings').doc(params.bookingId);
   
    try {
    	const bookingSnap = await bookingRef.get();

        if (!bookingSnap.exists) {
            throw error(404, 'Booking not found.');
        }

        const bookingData = bookingSnap.data();

        // Security Check: Ensure the user owns this booking or is an admin
        if (bookingData?.userId !== locals.user?.uid && !locals.user?.admin) {
            throw error(403, 'Forbidden: You do not have permission to update this booking.');
        }

        // Security Check: Ensure we are only updating a draft
        if (bookingData?.status !== 'draft') {
            throw error(400, 'This booking has been confirmed and can no longer be updated.');
        }

        const updatedBookingData = await request.json();

        await bookingRef.update({
            ...updatedBookingData,
            updatedAt: Timestamp.now()
        });

        console.log(`✅ Booking ${params.bookingId} updated successfully.`);

        return json({ success: true, bookingId: params.bookingId });

    } catch (e: any) {
        console.error(`❌ API PUT /api/bookings/${params.bookingId}: Error updating booking`, e);
        if (e.status) {
            throw e; // Re-throw SvelteKit errors
        }
        throw error(500, 'Could not update the booking.');
    }
};