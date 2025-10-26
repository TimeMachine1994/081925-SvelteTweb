import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendRegistrationEmail, debugTemplateConfiguration } from '$lib/server/email';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { testEmail, lovedOneName, password } = await request.json();

		if (!testEmail) {
			return json({ error: 'testEmail is required' }, { status: 400 });
		}

		// Debug configuration first
		console.log('🔍 Testing SendGrid with debug info:');
		debugTemplateConfiguration();

		// Test the same function used in funeral director registration
		await sendRegistrationEmail(
			testEmail,
			password || 'TestPassword123!',
			lovedOneName || 'Test Loved One'
		);

		return json({
			success: true,
			message: `Test registration email sent to ${testEmail}`,
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		console.error('SendGrid test error:', error);
		
		// Extract detailed error information
		let errorDetails = 'Unknown error';
		let statusCode = 500;
		
		if (error instanceof Error) {
			errorDetails = error.message;
			
			// Check if it's a SendGrid specific error
			if ('response' in error && error.response) {
				const response = error.response as any;
				statusCode = response.status || 500;
				
				if (response.body && response.body.errors) {
					errorDetails = `SendGrid API Error: ${JSON.stringify(response.body.errors)}`;
				}
			}
		}

		return json(
			{
				error: 'SendGrid test failed',
				details: errorDetails,
				timestamp: new Date().toISOString()
			},
			{ status: statusCode }
		);
	}
};
