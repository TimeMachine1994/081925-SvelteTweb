import { redirect, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ locals, params }: any) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	const { receiptId } = params;

	try {
		// Get memorial document
		const memorialDoc = await adminDb.collection('memorials').doc(receiptId).get();

		if (!memorialDoc.exists) {
			throw error(404, 'Receipt not found');
		}

		const data = memorialDoc.data()!;

		// Check if this memorial has payment data
		if (!data.isPaid && data.calculatorConfig?.status !== 'paid') {
			throw error(404, 'No payment found for this memorial');
		}

		// Get payment history
		const paymentHistory = data.paymentHistory || [];
		const successfulPayments = paymentHistory.filter((p: any) => p.status === 'succeeded');
		const latestPayment = successfulPayments[successfulPayments.length - 1] || {};

		// Get user info if available
		let ownerInfo = null;
		if (data.ownerUid) {
			try {
				const userDoc = await adminDb.collection('users').doc(data.ownerUid).get();
				if (userDoc.exists) {
					const userData = userDoc.data()!;
					ownerInfo = {
						uid: data.ownerUid,
						email: userData.email || data.creatorEmail,
						displayName: userData.displayName || data.creatorName,
						phone: userData.phone || null
					};
				}
			} catch (e) {
				console.error('Error fetching owner info:', e);
			}
		}

		// Build receipt data
		const receipt = {
			id: memorialDoc.id,
			memorialId: memorialDoc.id,
			
			// Memorial info
			lovedOneName: data.lovedOneName || 'Unknown',
			fullSlug: data.fullSlug || '',
			memorialDate: data.memorialDate || null,
			memorialTime: data.memorialTime || null,
			memorialLocationName: data.memorialLocationName || data.services?.main?.location?.name || null,
			memorialLocationAddress: data.memorialLocationAddress || data.services?.main?.location?.address || null,

			// Customer info
			ownerEmail: ownerInfo?.email || data.creatorEmail || data.ownerEmail || '',
			ownerName: ownerInfo?.displayName || data.creatorName || data.ownerName || '',
			ownerPhone: ownerInfo?.phone || null,
			ownerUid: data.ownerUid || null,

			// Payment info
			amount: latestPayment.amount || data.calculatorConfig?.totalPrice || 0,
			paidAt: data.paidAt?.toDate?.()?.toISOString() || latestPayment.paidAt?.toDate?.()?.toISOString() || null,
			paymentIntentId: data.calculatorConfig?.paymentIntentId || latestPayment.paymentIntentId || null,
			checkoutSessionId: data.calculatorConfig?.checkoutSessionId || latestPayment.checkoutSessionId || null,
			status: data.calculatorConfig?.status || 'paid',

			// Calculator config (line items)
			calculatorConfig: data.calculatorConfig || null,
			
			// Services breakdown
			services: data.services || null,

			// Payment history
			paymentHistory: paymentHistory.map((p: any) => ({
				...p,
				paidAt: p.paidAt?.toDate?.()?.toISOString() || null,
				failedAt: p.failedAt?.toDate?.()?.toISOString() || null,
				actionRequiredAt: p.actionRequiredAt?.toDate?.()?.toISOString() || null
			})),

			// Timestamps
			createdAt: data.createdAt?.toDate?.()?.toISOString() || null
		};

		return { receipt };
	} catch (e: any) {
		if (e.status === 404) throw e;
		console.error('Error loading receipt:', e);
		throw error(500, 'Failed to load receipt');
	}
};
