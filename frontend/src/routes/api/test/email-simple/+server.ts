import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { sendContactFormEmails } from '$lib/server/email';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();
		
		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		// Test contact form email with minimal data
		await sendContactFormEmails({
			name: 'Test User',
			email: email,
			subject: 'Test Email Configuration',
			message: 'This is a test message to verify email configuration is working.',
			timestamp: new Date()
		});

		return json({ 
			success: true, 
			message: 'Test email sent successfully' 
		});
	} catch (error) {
		console.error('Test email error:', error);
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown error' 
		}, { status: 500 });
	}
};
