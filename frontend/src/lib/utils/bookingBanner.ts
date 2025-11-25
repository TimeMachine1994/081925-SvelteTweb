import { browser } from '$app/environment';

export interface BannerState {
	shouldShow: boolean;
	reason?: string;
}

/**
 * Determines if the booking reminder banner should be shown for a user on a event page
 */
export function shouldShowBookingBanner(
	memorialId: string,
	user: any,
	event: any
): BannerState {
	// Only run in browser environment
	if (!browser) {
		return { shouldShow: false, reason: 'server-side' };
	}

	// Must have a logged-in user
	if (!user || !user.uid) {
		return { shouldShow: false, reason: 'no-user' };
	}

	// Must have event data
	if (!event || !event.id) {
		return { shouldShow: false, reason: 'no-event' };
	}

	// Check if user has already seen banner for this event (persistent across sessions)
	const bannerSeenKey = `event-booking-banner-views-${memorialId}`;
	const viewCount = parseInt(localStorage.getItem(bannerSeenKey) || '0', 10);
	const MAX_VIEWS = 1; // Show banner only once, ever
	
	if (viewCount >= MAX_VIEWS) {
		return { shouldShow: false, reason: `already-seen-${viewCount}-times` };
	}

	// Only show for event owners (users who created/own the event)
	const isMemorialOwner = event.ownerUid === user.uid;
	
	if (!isMemorialOwner) {
		return { shouldShow: false, reason: 'not-owner' };
	}

	// Check if event service has been paid for/completed
	// This would need to be expanded based on your payment tracking system
	const hasCompletedBooking = event.isPaid === true || event.bookingStatus === 'completed';
	
	if (hasCompletedBooking) {
		return { shouldShow: false, reason: 'booking-completed' };
	}

	// Check if user just came from registration/login (within last few minutes)
	// This helps ensure we only show to users who just logged in
	const loginTimestamp = sessionStorage.getItem('login-timestamp');
	const now = Date.now();
	const fiveMinutesAgo = now - (5 * 60 * 1000); // 5 minutes in milliseconds
	
	let isRecentLogin = false;
	if (loginTimestamp) {
		const loginTime = parseInt(loginTimestamp, 10);
		isRecentLogin = loginTime > fiveMinutesAgo;
	}

	// Show banner if this is a recent login or if no login timestamp (fallback)
	if (isRecentLogin || !loginTimestamp) {
		return { shouldShow: true, reason: 'recent-login' };
	}

	return { shouldShow: false, reason: 'old-session' };
}

/**
 * Mark the banner as seen for this event (increments view counter)
 */
export function markBannerAsSeen(memorialId: string): void {
	if (!browser) return;
	
	const bannerSeenKey = `event-booking-banner-views-${memorialId}`;
	const currentViews = parseInt(localStorage.getItem(bannerSeenKey) || '0', 10);
	const newViewCount = currentViews + 1;
	
	localStorage.setItem(bannerSeenKey, newViewCount.toString());
	console.log(`🔔 [BOOKING_BANNER] View count for event ${memorialId}: ${newViewCount}`);
}

/**
 * Get current view count for a event banner
 */
export function getBannerViewCount(memorialId: string): number {
	if (!browser) return 0;
	
	const bannerSeenKey = `event-booking-banner-views-${memorialId}`;
	return parseInt(localStorage.getItem(bannerSeenKey) || '0', 10);
}

/**
 * Reset banner view count for a event (useful for testing or special cases)
 */
export function resetBannerViewCount(memorialId: string): void {
	if (!browser) return;
	
	const bannerSeenKey = `event-booking-banner-views-${memorialId}`;
	localStorage.removeItem(bannerSeenKey);
	console.log(`🔄 [BOOKING_BANNER] Reset view count for event ${memorialId}`);
}

/**
 * Set login timestamp for tracking recent logins
 * Call this when user successfully logs in
 */
export function setLoginTimestamp(): void {
	if (!browser) return;
	
	sessionStorage.setItem('login-timestamp', Date.now().toString());
}

/**
 * Clear all banner-related storage (both session and local storage)
 * Useful for testing or when user logs out
 */
export function clearBannerState(): void {
	if (!browser) return;
	
	// Clear login timestamp from sessionStorage
	sessionStorage.removeItem('login-timestamp');
	
	// Clear all banner view counters from localStorage
	const localKeys = Object.keys(localStorage);
	localKeys.forEach(key => {
		if (key.startsWith('event-booking-banner-views-')) {
			localStorage.removeItem(key);
		}
	});
	
	console.log('🧹 [BOOKING_BANNER] Cleared all banner state');
}

/**
 * Debug function to check banner state
 */
export function debugBannerState(memorialId: string): void {
	if (!browser) return;
	
	const viewCount = getBannerViewCount(memorialId);
	const loginTimestamp = sessionStorage.getItem('login-timestamp');
	const loginTime = loginTimestamp ? new Date(parseInt(loginTimestamp)) : null;
	
	console.log('🎯 [BOOKING_BANNER] Debug State:', {
		memorialId,
		viewCount,
		maxViews: 1,
		willShowAgain: viewCount < 1,
		loginTimestamp: loginTime?.toLocaleString() || 'none',
		allBannerKeys: Object.keys(localStorage).filter(k => k.includes('event-booking-banner'))
	});
}
