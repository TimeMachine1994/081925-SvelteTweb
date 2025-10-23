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
		
		if (recaptchaToken) {
			try {
				const recaptchaResult = await verifyRecaptcha(
					recaptchaToken,
					RECAPTCHA_ACTIONS.CONTACT_FORM,
					getScoreThreshold(RECAPTCHA_ACTIONS.CONTACT_FORM)
				);

				if (!recaptchaResult.success) {
					console.error('[CONTACT_API] reCAPTCHA verification failed:', recaptchaResult.error);
					return json({ error: 'Security verification failed. Please try again.' }, { status: 400 });
				}

				console.log(`[CONTACT_API] reCAPTCHA verified successfully. Score: ${recaptchaResult.score}`);
			} catch (error) {
				console.warn('[CONTACT_API] reCAPTCHA verification error, proceeding without verification:', error);
			}
		} else if (!isDev) {
			// Require reCAPTCHA in production
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
		await sendContactFormEmails({
			name,
			email,
			subject,
			message,
			timestamp: new Date()
		});

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
