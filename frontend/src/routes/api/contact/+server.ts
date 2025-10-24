import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyRecaptcha, RECAPTCHA_ACTIONS, getScoreThreshold } from '$lib/utils/recaptcha';

import { sendContactFormEmails } from '$lib/server/email';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { name, email, subject, message, recaptchaToken } = await request.json();

		// Validate required fields
		if (!name || !email || !subject || !message) {
			return json({ error: 'All fields are required' }, { status: 400 });
		}

		// Verify reCAPTCHA
		const isDev = process.env.NODE_ENV === 'development';
		const isRecaptchaConfigured = process.env.RECAPTCHA_SECRET_KEY && process.env.RECAPTCHA_SECRET_KEY !== 'your_recaptcha_secret_key_here';
		
		if (recaptchaToken && isRecaptchaConfigured) {
			try {
				const recaptchaResult = await verifyRecaptcha(
					recaptchaToken,
					RECAPTCHA_ACTIONS.CONTACT_FORM,
					getScoreThreshold(RECAPTCHA_ACTIONS.CONTACT_FORM)
				);

				if (!recaptchaResult.success) {
					console.error('[CONTACT_API] reCAPTCHA verification failed:', recaptchaResult.error);
					if (!isDev) {
						return json({ error: 'Security verification failed. Please try again.' }, { status: 400 });
					} else {
						console.warn('[CONTACT_API] reCAPTCHA failed in dev mode, proceeding anyway');
					}
				} else {
					console.log(`[CONTACT_API] reCAPTCHA verified successfully. Score: ${recaptchaResult.score}`);
				}
			} catch (error) {
				console.warn('[CONTACT_API] reCAPTCHA verification error:', error);
				if (!isDev) {
					return json({ error: 'Security verification error. Please try again.' }, { status: 400 });
				}
			}
		} else if (!isRecaptchaConfigured) {
			console.warn('[CONTACT_API] reCAPTCHA not configured, skipping verification');
		} else if (!recaptchaToken && !isDev) {
			// Only require reCAPTCHA in production when it's configured
			console.warn('[CONTACT_API] No reCAPTCHA token provided in production');
			return json({ error: 'Security verification required. Please refresh and try again.' }, { status: 400 });
		} else {
			console.log('[CONTACT_API] reCAPTCHA skipped in development mode');
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ error: 'Please enter a valid email address' }, { status: 400 });
		}

		// Send contact form emails using dynamic templates
		console.log('[CONTACT_API] Attempting to send emails...');
		try {
			await sendContactFormEmails({
				name,
				email,
				subject,
				message,
				timestamp: new Date()
			});
			console.log('[CONTACT_API] Emails sent successfully');
		} catch (emailError) {
			console.error('[CONTACT_API] Email sending failed:', emailError);
			// Don't fail the entire request if email fails
			console.warn('[CONTACT_API] Continuing despite email failure');
		}

		return json(
			{
				success: true,
				message: 'Message sent successfully. Confirmation email sent to your inbox.'
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Contact form error:', error);

		// Handle SendGrid specific errors
		if (error && typeof error === 'object' && 'response' in error) {
			const sgError = error as any;
			console.error('SendGrid error:', sgError.response?.body);

			return json(
				{ error: 'Failed to send email. Please try again or contact us directly.' },
				{ status: 500 }
			);
		}

		return json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
	}
};
