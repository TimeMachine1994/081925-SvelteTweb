import { getFirestore } from 'firebase-admin/firestore';
import type { PageServerLoad, Actions } from './$types';
import type { Memorial } from '$lib/types/memorial';
import { fail, json } from '@sveltejs/kit';
import { stripe } from '$lib/server/stripe';
import type { CalculatorFormData } from '$lib/types/livestream';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { memorial: null };
	}

	try {
		const db = getFirestore();
		const memorialsRef = db
			.collection('memorials')
			.where('userId', '==', locals.user.uid)
			.orderBy('createdAt', 'desc')
			.limit(1);

		const snapshot = await memorialsRef.get();

		if (snapshot.empty) {
			return { memorial: null };
		}

		const memorial = snapshot.docs[0].data() as Memorial;
		console.log('✅ Found memorial for user:', memorial);
		return { memorial };
	} catch (error) {
		console.error('Error fetching memorial:', error);
		return { memorial: null };
	}
};

export const actions: Actions = {
	saveAndPayLater: async ({ request, locals }) => {
		if (!locals.user) {
			console.error('🚨 Unauthorized attempt to save!');
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			const payload = await request.json();
			console.log('💾 Received save payload:', payload);

			// TODO: Add validation
			const db = getFirestore();
			await db.collection('livestreamConfigurations').add({
				...payload,
				userId: locals.user.uid,
				status: 'saved',
				createdAt: new Date()
			});

			console.log('✅ Configuration saved successfully!');
			return json({ success: true, action: 'saved' });
		} catch (error) {
			console.error('🔥 Error saving configuration:', error);
			return fail(500, { error: 'Internal Server Error' });
		}
	},
	continueToPayment: async ({ request, locals }) => {
		if (!locals.user) {
			console.error('🚨 Unauthorized attempt to pay!');
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			const { formData, total, memorialId, bookingItems } = await request.json();
			console.log('💳 Received payment payload:', { formData, total, memorialId, bookingItems });

			const db = getFirestore();
			const configRef = await db.collection('livestreamConfigurations').add({
				formData,
				bookingItems,
				total,
				userId: locals.user.uid,
				memorialId,
				status: 'pending_payment',
				createdAt: new Date()
			});

			console.log('📄 Created config document:', configRef.id);

			const paymentIntent = await stripe.paymentIntents.create({
				amount: total * 100,
				currency: 'usd',
				metadata: {
					configId: configRef.id
				}
			});

			console.log('💳 Created Payment Intent:', paymentIntent.id);

			return json({
				success: true,
				action: 'paymentInitiated',
				clientSecret: paymentIntent.client_secret,
				configId: configRef.id
			});
		} catch (error) {
			console.error('🔥 Error processing payment:', error);
			return fail(500, { error: 'Internal Server Error' });
		}
	}
};