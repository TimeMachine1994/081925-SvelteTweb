/**
 * reCAPTCHA v3 Utilities for TributeStream
 * Provides client and server-side reCAPTCHA verification functions
 */

import { PUBLIC_RECAPTCHA_SITE_KEY } from '$env/static/public';
import { env } from '$env/dynamic/private';

// reCAPTCHA v3 score thresholds
export const RECAPTCHA_THRESHOLDS = {
	HIGH_SECURITY: 0.7,    // For registration, memorial creation
	MEDIUM_SECURITY: 0.5,  // For contact forms, demo booking
	LOW_SECURITY: 0.3      // For search, newsletter signup
} as const;

/**
 * Client-side: Execute reCAPTCHA and get token
 */
export async function executeRecaptcha(action: string): Promise<string | null> {
	if (typeof window === 'undefined') {
		console.error('executeRecaptcha called on server side');
		return null;
	}

	try {
		// Wait for reCAPTCHA to be ready
		await new Promise<void>((resolve) => {
			const checkReady = () => {
				if (window.grecaptcha && window.grecaptcha.ready) {
					window.grecaptcha.ready(() => resolve());
				} else {
					setTimeout(checkReady, 100);
				}
			};
			checkReady();
		});

		// Execute reCAPTCHA
		const token = await window.grecaptcha.execute(PUBLIC_RECAPTCHA_SITE_KEY, { action });
		return token;
	} catch (error) {
		console.error('reCAPTCHA execution failed:', error);
		return null;
	}
}

/**
 * Server-side: Verify reCAPTCHA token
 */
export async function verifyRecaptcha(
	token: string, 
	expectedAction: string,
	minScore: number = RECAPTCHA_THRESHOLDS.MEDIUM_SECURITY
): Promise<{ success: boolean; score?: number; error?: string }> {
	if (!token) {
		return { success: false, error: 'No reCAPTCHA token provided' };
	}

	if (!env.RECAPTCHA_SECRET_KEY) {
		console.error('RECAPTCHA_SECRET_KEY not configured');
		return { success: false, error: 'reCAPTCHA not configured' };
	}

	try {
		const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				secret: env.RECAPTCHA_SECRET_KEY,
				response: token,
			}),
		});

		const result = await response.json();

		if (!result.success) {
			return { 
				success: false, 
				error: `reCAPTCHA verification failed: ${result['error-codes']?.join(', ') || 'Unknown error'}` 
			};
		}

		// Check action matches
		if (result.action !== expectedAction) {
			return { 
				success: false, 
				error: `Action mismatch: expected ${expectedAction}, got ${result.action}` 
			};
		}

		// Check score threshold
		const score = result.score || 0;
		if (score < minScore) {
			return { 
				success: false, 
				score,
				error: `Score too low: ${score} < ${minScore}` 
			};
		}

		return { success: true, score };
	} catch (error) {
		console.error('reCAPTCHA verification error:', error);
		return { success: false, error: 'Verification request failed' };
	}
}

/**
 * reCAPTCHA actions used throughout the application
 */
export const RECAPTCHA_ACTIONS = {
	REGISTER_OWNER: 'register_owner',
	REGISTER_VIEWER: 'register_viewer',
	REGISTER_ADMIN: 'register_admin',
	REGISTER_FUNERAL_DIRECTOR: 'register_funeral_director',
	CREATE_MEMORIAL: 'create_memorial',
	CONTACT_FORM: 'contact_form',
	BOOK_DEMO: 'book_demo',
	LOGIN: 'login',
	SEARCH: 'search'
} as const;

/**
 * Get appropriate score threshold for an action
 */
export function getScoreThreshold(action: string): number {
	switch (action) {
		case RECAPTCHA_ACTIONS.REGISTER_OWNER:
		case RECAPTCHA_ACTIONS.REGISTER_VIEWER:
		case RECAPTCHA_ACTIONS.REGISTER_ADMIN:
		case RECAPTCHA_ACTIONS.REGISTER_FUNERAL_DIRECTOR:
		case RECAPTCHA_ACTIONS.CREATE_MEMORIAL:
			return RECAPTCHA_THRESHOLDS.HIGH_SECURITY;
		
		case RECAPTCHA_ACTIONS.CONTACT_FORM:
		case RECAPTCHA_ACTIONS.BOOK_DEMO:
		case RECAPTCHA_ACTIONS.LOGIN:
			return RECAPTCHA_THRESHOLDS.MEDIUM_SECURITY;
		
		case RECAPTCHA_ACTIONS.SEARCH:
		default:
			return RECAPTCHA_THRESHOLDS.LOW_SECURITY;
	}
}

// Type declarations for window.grecaptcha
declare global {
	interface Window {
		grecaptcha: {
			ready: (callback: () => void) => void;
			execute: (siteKey: string, options: { action: string }) => Promise<string>;
		};
	}
}
