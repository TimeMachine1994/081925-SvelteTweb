import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendContactFormEmails, validateContactFormTemplates, getTemplateIds } from '$lib/server/email';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { testEmail } = await request.json();

		// Validate contact form template configuration
		const templateValidation = validateContactFormTemplates();
		console.log('Contact form template validation:', templateValidation);
		console.log('Template IDs:', getTemplateIds());

		if (!templateValidation.valid) {
			return json({
				error: 'Contact form email templates not configured properly',
				missing: templateValidation.missing,
				templateIds: getTemplateIds()
			}, { status: 400 });
		}

		// Test sending contact form emails
		await sendContactFormEmails({
			name: 'Test User',
			email: testEmail || 'test@example.com',
			subject: 'Test Contact Form Submission',
			message: 'This is a test message to verify email functionality.',
			timestamp: new Date()
		});

		return json({
			success: true,
			message: 'Test emails sent successfully',
			templateIds: getTemplateIds()
		});

	} catch (error) {
		console.error('Test email error:', error);
		return json({
			error: 'Failed to send test emails',
			details: error instanceof Error ? error.message : 'Unknown error',
			templateIds: getTemplateIds()
		}, { status: 500 });
	}
};
