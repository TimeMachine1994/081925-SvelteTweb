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
		console.log('Found memorial for user:', memorial);
		return { memorial };
	} catch (error) {
		console.error('Error fetching memorial:', error);
		return { memorial: null };
	}
};

export const actions: Actions = {
	saveAndPayLater: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}
		const data = await request.formData();
		const formData = JSON.parse(data.get('formData') as string) as CalculatorFormData;

		// TODO: Add validation
		try {
			const db = getFirestore();
			await db.collection('livestreamConfigurations').add({
				...formData,
				userId: locals.user.uid,
				status: 'saved',
				createdAt: new Date()
			});
			return { success: true, action: 'saved' };
		} catch (error) {
			console.error('Error saving configuration:', error);
			return fail(500, { error: 'Internal Server Error' });
		}
	},
	continueToPayment: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const formData = JSON.parse(data.get('formData') as string) as CalculatorFormData;
		const total = parseFloat(data.get('total') as string);
		const memorialId = data.get('memorialId') as string | null;

		try {
			const db = getFirestore();
			const configRef = await db.collection('livestreamConfigurations').add({
				...formData,
				total,
				userId: locals.user.uid,
				memorialId,
				status: 'pending_payment',
				createdAt: new Date()
			});

			const paymentIntent = await stripe.paymentIntents.create({
				amount: total * 100,
				currency: 'usd',
				metadata: {
					configId: configRef.id
				}
			});

			return {
				success: true,
				action: 'paymentInitiated',
				clientSecret: paymentIntent.client_secret,
				configId: configRef.id
			};
		} catch (error) {
			console.error('Error processing payment:', error);
			return fail(500, { error: 'Internal Server Error' });
		}
	}
};