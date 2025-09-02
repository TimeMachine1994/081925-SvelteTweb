import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { PageServerLoad, Actions } from './$types';
import type { Memorial } from '$lib/types/memorial';
import { fail, json, redirect } from '@sveltejs/kit';
import { stripe } from '$lib/server/stripe';
import type { LivestreamConfig } from '$lib/types/livestream';

export const load: PageServerLoad = async ({ locals, url }) => {
	const db = getFirestore();
	let memorial: Memorial | null = null;
	let config: LivestreamConfig | null = null;

	const memorialId = url.searchParams.get('memorialId');

	if (locals.user && locals.user.role !== 'owner') {
		const memorialId = url.searchParams.get('memorialId');
		const redirectUrl = `/app/calculator/register${memorialId ? `?memorialId=${memorialId}` : ''}`;
		redirect(303, redirectUrl);
	}

	if (locals.user && memorialId) {
		// Load the memorial data first
		const memorialRef = db.collection('memorials').doc(memorialId);
		const memorialSnap = await memorialRef.get();

		if (memorialSnap.exists) {
			console.log('✅ Found memorial for user:', memorialSnap.id);
			const memorialData = memorialSnap.data();
			if (memorialData) {
				// Convert Firestore Timestamps to serializable format
				if (memorialData.createdAt && typeof memorialData.createdAt.toDate === 'function') {
					(memorialData.createdAt as any) = memorialData.createdAt.toDate().toISOString();
				}
				if (memorialData.updatedAt && typeof memorialData.updatedAt.toDate === 'function') {
					(memorialData.updatedAt as any) = memorialData.updatedAt.toDate().toISOString();
				}
				memorial = { ...(memorialData as Omit<Memorial, 'id'>), id: memorialSnap.id };

				// Now, try to load an existing livestream configuration from the sub-collection
				const configRef = memorialRef.collection('livestreamConfiguration').doc('main');
				const configSnap = await configRef.get();

				if (configSnap.exists) {
					console.log('✅ Found existing livestream config:', configSnap.id);
					const configData = configSnap.data();
					if (configData) {
						// Convert Firestore Timestamps to serializable format
						if (configData.createdAt && typeof configData.createdAt.toDate === 'function') {
							(configData.createdAt as any) = configData.createdAt.toDate().toISOString();
						}
						config = { ...(configData as Omit<LivestreamConfig, 'id'>), id: configSnap.id };
						if (configData.currentStep) {
							config.currentStep = configData.currentStep;
						}
					}
				}
			}
		}
	}

	return { memorial, config };
};

export const actions: Actions = {
	saveAndPayLater: async ({ request, locals }) => {
		console.log('🚀 saveAndPayLater server action called');
		if (!locals.user) {
			console.error('🚨 Unauthorized attempt to save!');
			return fail(401, { error: 'Unauthorized' });
		}
		console.log('✅ User authenticated:', locals.user.uid);

		try {
			const data = await request.formData();
			const formDataRaw = data.get('formData') as string;
			const bookingItemsRaw = data.get('bookingItems') as string;
			const totalRaw = data.get('total') as string;
			const memorialId = data.get('memorialId') as string;
			const currentStep = data.get('currentStep') as string;

			if (!formDataRaw || !bookingItemsRaw || !totalRaw || !memorialId) {
				return fail(400, { error: 'Missing required form data.' });
			}

			const parsedFormData = JSON.parse(formDataRaw);
			const parsedBookingItems = JSON.parse(bookingItemsRaw);
			const parsedTotal = parseFloat(totalRaw);

			if (isNaN(parsedTotal) || parsedTotal <= 0) {
				return fail(400, { error: 'Invalid total amount' });
			}

			const { lovedOneName, ...restOfFormData } = parsedFormData;

			const db = getFirestore();
			const memorialRef = db.collection('memorials').doc(memorialId);
			const configRef = memorialRef.collection('livestreamConfiguration').doc('main');

			const configData = {
				formData: restOfFormData,
				bookingItems: parsedBookingItems,
				total: parsedTotal,
				userId: locals.user.uid,
				status: 'saved',
				createdAt: Timestamp.now(),
				memorialId: memorialId,
				currentStep: currentStep
			};

			console.log('💾 Preparing to save data...');
			console.log('  - Memorial ID:', memorialId);
			console.log('  - Loved One Name:', lovedOneName);
			console.log('  - Config Path:', configRef.path);

			await db.runTransaction(async (transaction) => {
				transaction.set(configRef, configData, { merge: true });
				if (lovedOneName) {
					transaction.update(memorialRef, { lovedOneName });
				}
			});

			console.log('✅ Transaction successful! Configuration saved and memorial updated.');
		} catch (error) {
			console.error('💥 Error in saveAndPayLater action:', error);
			const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
			return fail(500, { error: 'Internal Server Error', details: errorMessage });
		}

		redirect(303, '/my-portal');
	},
	continueToPayment: async ({ request, locals }) => {
		if (!locals.user) {
			console.error('🚨 Unauthorized attempt to pay!');
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			const { formData, total, memorialId, bookingItems } = await request.json();
			console.log('💳 Received payment payload:', { total, memorialId });

			const { lovedOneName, ...restOfFormData } = formData;

			const db = getFirestore();
			const memorialRef = db.collection('memorials').doc(memorialId);
			const configRef = memorialRef.collection('livestreamConfiguration').doc('main');

			const configData = {
				formData: restOfFormData,
				bookingItems,
				total,
				userId: locals.user.uid,
				memorialId,
				status: 'pending_payment',
				createdAt: Timestamp.now()
			};

			await db.runTransaction(async (transaction) => {
				transaction.set(configRef, configData, { merge: true });
				if (lovedOneName) {
					transaction.update(memorialRef, { lovedOneName });
				}
			});

			console.log('📄 Transaction successful! Config document created/updated:', configRef.id);

			const paymentIntent = await stripe.paymentIntents.create({
				amount: total * 100,
				currency: 'usd',
				metadata: {
					configId: configRef.id,
					memorialId: memorialId
				}
			});

			console.log('💳 Created Payment Intent:', paymentIntent.id);

			return json({
				success: true,
				action: 'paymentInitiated',
				clientSecret: paymentIntent.client_secret,
				configId: memorialId // Pass memorialId as configId
			});
		} catch (error) {
			console.error('🔥 Error processing payment:', error);
			return fail(500, { error: 'Internal Server Error' });
		}
	}
};