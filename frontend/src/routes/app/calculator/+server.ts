import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFirestore } from 'firebase-admin/firestore';
import { stripe } from '$lib/server/stripe'; // This will be created later
import type { LivestreamOptions } from '$lib/types/livestream';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { options, total } = (await request.json()) as {
		options: LivestreamOptions;
		total: number;
	};

	try {
		// Save configuration to Firestore
		const db = getFirestore();
		const configRef = await db.collection('livestreamConfigurations').add({
			...options,
			total,
			userId: locals.user.uid,
			createdAt: new Date()
		});

		// Create a Stripe Payment Intent
		const paymentIntent = await stripe.paymentIntents.create({
			amount: total * 100, // Amount in cents
			currency: 'usd',
			metadata: {
				configId: configRef.id
			}
		});

		return json({
			clientSecret: paymentIntent.client_secret
		});
	} catch (error) {
		console.error('Error processing payment:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};