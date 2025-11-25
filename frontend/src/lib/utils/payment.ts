import type { Event } from '$lib/types/event';

/**
 * 🎯 Payment status utility functions for Owner Portal
 */

export type PaymentStatus = 'complete' | 'incomplete' | 'none';

/**
 * 💳 Determines the payment status for a event based on service configuration
 */
export function getPaymentStatus(event: Event): PaymentStatus {
	console.log('💳 Checking payment status for event:', event.id);

	if (!event.services?.paymentStatus) {
		console.log('📋 No payment status found - status: none');
		return 'none';
	}

	const status = event.services.paymentStatus;
	console.log('🔍 Service payment status:', status);

	if (status === 'paid') {
		console.log('✅ Payment complete!');
		return 'complete';
	} else if (status === 'pending_payment' || status === 'saved') {
		console.log('⚠️ Payment incomplete');
		return 'incomplete';
	}

	console.log('❓ Unknown status, defaulting to none');
	return 'none';
}

/**
 * 🏆 Gets the default event (latest created) from a list of memorials
 */
export function getDefaultMemorial(memorials: Event[]): Event | null {
	console.log('🏆 Finding default event from', memorials.length, 'memorials');

	if (memorials.length === 0) {
		console.log('📭 No memorials found');
		return null;
	}

	// Sort by createdAt descending, return latest
	const sorted = memorials.sort((a, b) => {
		// Handle both string (serialized) and Timestamp types
		const dateA =
			typeof a.createdAt === 'string'
				? new Date(a.createdAt).getTime()
				: a.createdAt?.toDate
					? a.createdAt.toDate().getTime()
					: 0;
		const dateB =
			typeof b.createdAt === 'string'
				? new Date(b.createdAt).getTime()
				: b.createdAt?.toDate
					? b.createdAt.toDate().getTime()
					: 0;
		return dateB - dateA;
	});

	const defaultMemorial = sorted[0];
	console.log(
		'🎯 Default event selected:',
		defaultMemorial.lovedOneName,
		'(',
		defaultMemorial.id,
		')'
	);

	return defaultMemorial;
}

/**
 * 📅 Formats event date and time for display
 */
export function formatMemorialDateTime(event: Event): string {
	const date = event.memorialDate;
	const time = event.memorialTime;

	if (!date && !time) return 'Date and time TBD';
	if (!date) return `Time: ${time}`;
	if (!time) return `Date: ${date}`;

	return `${date} @ ${time}`;
}

/**
 * 🏠 Formats event location for display
 */
export function formatMemorialLocation(event: Event): string {
	const name = event.memorialLocationName;
	const address = event.memorialLocationAddress;

	if (!name && !address) return 'Location TBD';
	if (!address) return name || '';
	if (!name) return address;

	return `${name}\n${address}`;
}
