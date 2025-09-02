import { getAdminDb } from '$lib/server/firebase';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Timestamp } from 'firebase-admin/firestore';
import { stripe } from '$lib/server/stripe';

export const POST: RequestHandler = async ({ request, params, locals }) => {
    console.log(`🚀 API POST /api/bookings/${params.bookingId}/confirm: Finalizing booking...`);

    if (!locals.user) {
    	throw error(401, 'Unauthorized: You must be logged in to confirm a booking.');
    }
   
    const db = getAdminDb();
    const bookingRef = db.collection('users').doc(locals.user.uid).collection('bookings').doc(params.bookingId);
   
    try {
    	const { memorialId } = await request.json();
        if (!memorialId) {
            throw error(400, 'Bad Request: A memorialId is required to confirm a booking.');
        }

        const bookingSnap = await bookingRef.get();
        if (!bookingSnap.exists) {
            throw error(404, 'Booking not found.');
        }

        const bookingData = bookingSnap.data();

        // Security Check: Ensure the user owns this booking or is an admin
        if (bookingData?.userId !== locals.user?.uid && !locals.user?.admin) {
            throw error(403, 'Forbidden: You do not have permission to confirm this booking.');
        }

        // TODO: Add validation to ensure the user also owns the memorialId they submitted

        const paymentIntent = await stripe.paymentIntents.create({
            amount: bookingData?.total * 100, // Convert to cents
            currency: 'usd',
            metadata: {
                bookingId: params.bookingId,
                memorialId: memorialId,
                userId: locals.user.uid
            }
        });

        await bookingRef.update({
            status: 'pending_payment',
            memorialId: memorialId,
            paymentIntentId: paymentIntent.id,
            updatedAt: Timestamp.now()
        });

        console.log(`✅ Payment intent ${paymentIntent.id} created for booking ${params.bookingId}.`);

        return json({
            success: true,
            clientSecret: paymentIntent.client_secret
        });

    } catch (e: any) {
        console.error(`❌ API POST /api/bookings/${params.bookingId}/confirm: Error confirming booking`, e);
        if (e.status) {
            throw e; // Re-throw SvelteKit errors
        }
        throw error(500, 'Could not confirm the booking.');
    }
};