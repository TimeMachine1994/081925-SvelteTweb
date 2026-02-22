import { env } from '$env/dynamic/private';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const DEFAULT_SCORE_THRESHOLD = 0.5;

export interface RecaptchaResult {
	success: boolean;
	score: number;
	action: string;
	errorCodes: string[];
}

/**
 * Verify a reCAPTCHA v3 token server-side.
 * Returns the verification result including the score.
 *
 * @param token - The reCAPTCHA token from the client
 * @param expectedAction - The expected action name (e.g., 'book_consultation')
 * @param scoreThreshold - Minimum score to consider valid (default 0.5)
 */
export async function verifyRecaptcha(
	token: string,
	expectedAction: string = 'book_consultation',
	scoreThreshold: number = DEFAULT_SCORE_THRESHOLD
): Promise<RecaptchaResult> {
	const secretKey = env.RECAPTCHA_SECRET_KEY;

	if (!secretKey) {
		console.warn('[recaptcha] RECAPTCHA_SECRET_KEY is not set — skipping verification in dev');
		return { success: true, score: 1.0, action: expectedAction, errorCodes: [] };
	}

	if (!token) {
		return { success: false, score: 0, action: '', errorCodes: ['missing-input-response'] };
	}

	try {
		const response = await fetch(RECAPTCHA_VERIFY_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				secret: secretKey,
				response: token
			})
		});

		const data = await response.json();

		const result: RecaptchaResult = {
			success: data.success && data.score >= scoreThreshold && data.action === expectedAction,
			score: data.score ?? 0,
			action: data.action ?? '',
			errorCodes: data['error-codes'] ?? []
		};

		if (!result.success) {
			console.warn('[recaptcha] Verification failed:', {
				score: result.score,
				action: result.action,
				expected: expectedAction,
				threshold: scoreThreshold,
				errors: result.errorCodes
			});
		}

		return result;
	} catch (err) {
		console.error('[recaptcha] Verification request failed:', err);
		return { success: false, score: 0, action: '', errorCodes: ['request-failed'] };
	}
}

/**
 * Returns the public reCAPTCHA site key for client-side use.
 */
export function getRecaptchaSiteKey(): string {
	return env.RECAPTCHA_SITE_KEY ?? '';
}
