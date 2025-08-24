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
		console.log('🚀 saveAndPayLater server action called');
		console.log('👤 Checking user authentication...');
		
		if (!locals.user) {
			console.error('🚨 Unauthorized attempt to save!');
			console.error('📍 locals.user is:', locals.user);
			return fail(401, { error: 'Unauthorized' });
		}
		
		console.log('✅ User authenticated:');
		console.log('  - uid:', locals.user.uid);
		console.log('  - email:', locals.user.email);
		console.log('  - role:', locals.user.role);
		console.log('  - admin:', locals.user.admin);

		try {
			console.log('🎬 saveAndPayLater action started');
			console.log('📥 Extracting FormData from request...');
			
			const data = await request.formData();
			console.log('✅ FormData received');
			
			// Log all FormData entries
			console.log('📋 FormData entries:');
			for (const [key, value] of data.entries()) {
				console.log(`  - ${key}:`, typeof value === 'string' ? value.substring(0, 100) + '...' : value);
			}
			
			console.log('🔍 Extracting individual fields...');
			const formDataRaw = data.get('formData') as string;
			const bookingItemsRaw = data.get('bookingItems') as string;
			const totalRaw = data.get('total') as string;
			
			console.log('📊 Raw field data:');
			console.log('  - formData type:', typeof formDataRaw);
			console.log('  - formData length:', formDataRaw?.length);
			console.log('  - bookingItems type:', typeof bookingItemsRaw);
			console.log('  - bookingItems length:', bookingItemsRaw?.length);
			console.log('  - total type:', typeof totalRaw);
			console.log('  - total value:', totalRaw);
			
			// Validate required fields
			if (!formDataRaw) {
				console.error('❌ Missing formData field');
				return fail(400, { error: 'Missing formData' });
			}
			
			if (!bookingItemsRaw) {
				console.error('❌ Missing bookingItems field');
				return fail(400, { error: 'Missing bookingItems' });
			}
			
			if (!totalRaw) {
				console.error('❌ Missing total field');
				return fail(400, { error: 'Missing total' });
			}
			
			console.log('✅ All required fields present');
			
			// Parse JSON data
			console.log('🔄 Parsing JSON data...');
			let parsedFormData;
			let parsedBookingItems;
			let parsedTotal;
			
			try {
				console.log('📝 Parsing formData JSON...');
				parsedFormData = JSON.parse(formDataRaw);
				console.log('✅ formData parsed successfully');
				console.log('📊 formData structure:', Object.keys(parsedFormData));
			} catch (error) {
				console.error('❌ Failed to parse formData JSON:', error);
				console.error('📍 Raw formData:', formDataRaw);
				return fail(400, { error: 'Invalid formData JSON' });
			}
			
			try {
				console.log('📝 Parsing bookingItems JSON...');
				parsedBookingItems = JSON.parse(bookingItemsRaw);
				console.log('✅ bookingItems parsed successfully');
				console.log('📊 bookingItems count:', parsedBookingItems.length);
			} catch (error) {
				console.error('❌ Failed to parse bookingItems JSON:', error);
				console.error('📍 Raw bookingItems:', bookingItemsRaw);
				return fail(400, { error: 'Invalid bookingItems JSON' });
			}
			
			try {
				console.log('📝 Parsing total value...');
				parsedTotal = parseFloat(totalRaw);
				console.log('✅ total parsed successfully:', parsedTotal);
				
				if (isNaN(parsedTotal) || parsedTotal <= 0) {
					console.error('❌ Invalid total value:', parsedTotal);
					return fail(400, { error: 'Invalid total amount' });
				}
			} catch (error) {
				console.error('❌ Failed to parse total:', error);
				console.error('📍 Raw total:', totalRaw);
				return fail(400, { error: 'Invalid total value' });
			}

			const payload = {
				formData: parsedFormData,
				bookingItems: parsedBookingItems,
				total: parsedTotal
			};
			console.log('💾 Final parsed payload:');
			console.log('  - formData keys:', Object.keys(payload.formData));
			console.log('  - bookingItems length:', payload.bookingItems.length);
			console.log('  - total:', payload.total);

			// Initialize Firestore
			console.log('🔥 Initializing Firestore...');
			const db = getFirestore();
			console.log('✅ Firestore initialized successfully');

			// Prepare document data
			const docData = {
				formData: payload.formData,
				bookingItems: payload.bookingItems,
				total: payload.total,
				userId: locals.user.uid,
				status: 'saved',
				createdAt: new Date()
			};
			
			console.log('📄 Document data prepared:');
			console.log('  - userId:', docData.userId);
			console.log('  - status:', docData.status);
			console.log('  - createdAt:', docData.createdAt);
			console.log('  - total:', docData.total);
			console.log('  - bookingItems count:', docData.bookingItems.length);

			// Save to Firestore
			console.log('💾 Saving to Firestore collection: livestreamConfigurations');
			const docRef = await db.collection('livestreamConfigurations').add(docData);
			console.log('✅ Configuration saved successfully!');
			console.log('📄 Document ID:', docRef.id);
			console.log('📍 Document path:', docRef.path);

			const response = { success: true, action: 'saved', docId: docRef.id };
			console.log('🎉 Returning success response:', response);
			return response;
			
		} catch (error) {
			console.error('💥 Error in saveAndPayLater action:', error);
			console.error('📍 Error name:', error instanceof Error ? error.name : 'Unknown');
			console.error('📍 Error message:', error instanceof Error ? error.message : String(error));
			console.error('📍 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
			
			// Log additional error context
			if (error instanceof Error) {
				console.error('🔍 Error details:');
				console.error('  - constructor:', error.constructor.name);
				console.error('  - cause:', error.cause);
			}
			
			return fail(500, { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) });
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