import { browser } from '$app/environment';

export interface BannerState {
	shouldShow: boolean;
	reason?: string;
}

/**
 * Determines if the booking reminder banner should be shown for a user on a memorial page
 */
export function shouldShowBookingBanner(
	memorialId: string,
	user: any,
	memorial: any
): BannerState {
	// Only run in browser environment
	if (!browser) {
		return { shouldShow: false, reason: 'server-side' };
	}

	// Must have a logged-in user
	if (!user || !user.uid) {
		return { shouldShow: false, reason: 'no-user' };
	}

	// Must have memorial data
	if (!memorial || !memorial.id) {
		return { shouldShow: false, reason: 'no-memorial' };
	}

	// Check if user has already seen banner for this memorial in this session
	const bannerSeenKey = `memorial-booking-banner-seen-${memorialId}`;
	const hasSeenBanner = sessionStorage.getItem(bannerSeenKey) === 'true';
	
	if (hasSeenBanner) {
		return { shouldShow: false, reason: 'already-seen' };
	}

	// Only show for memorial owners (users who created/own the memorial)
	const isMemorialOwner = memorial.ownerUid === user.uid;
	
	if (!isMemorialOwner) {
		return { shouldShow: false, reason: 'not-owner' };
	}

	// Check if memorial service has been paid for/completed
	// This would need to be expanded based on your payment tracking system
	const hasCompletedBooking = memorial.isPaid === true || memorial.bookingStatus === 'completed';
	
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
 * Mark the banner as seen for this memorial
 */
export function markBannerAsSeen(memorialId: string): void {
	if (!browser) return;
	
	const bannerSeenKey = `memorial-booking-banner-seen-${memorialId}`;
	sessionStorage.setItem(bannerSeenKey, 'true');
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
 * Clear all banner-related session storage
 * Useful for testing or when user logs out
 */
export function clearBannerState(): void {
	if (!browser) return;
	
	// Clear login timestamp
	sessionStorage.removeItem('login-timestamp');
	
	// Clear all banner seen flags
	const keys = Object.keys(sessionStorage);
	keys.forEach(key => {
		if (key.startsWith('memorial-booking-banner-seen-')) {
			sessionStorage.removeItem(key);
		}
	});
}

/**
 * Debug function to check banner state
 */
export function debugBannerState(memorialId: string): void {
	if (!browser) return;
	
	console.log('🎯 [BOOKING_BANNER] Debug State:', {
		memorialId,
		bannerSeen: sessionStorage.getItem(`memorial-booking-banner-seen-${memorialId}`),
		loginTimestamp: sessionStorage.getItem('login-timestamp'),
		sessionKeys: Object.keys(sessionStorage).filter(k => k.includes('banner') || k.includes('login'))
	});
}
