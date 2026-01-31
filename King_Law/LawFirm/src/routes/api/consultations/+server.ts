import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// POST - Handle consultation form submissions
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { firstName, lastName, email, phone, message } = await request.json();

		// Validate required fields
		if (!firstName || !lastName || !email || !message) {
			return json({ error: 'Please fill in all required fields' }, { status: 400 });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ error: 'Please enter a valid email address' }, { status: 400 });
		}

		// Log the consultation request (in production, you'd store this or send an email)
		console.log('📋 New consultation request:', {
			name: `${firstName} ${lastName}`,
			email,
			phone: phone || 'Not provided',
			message,
			timestamp: new Date().toISOString()
		});

		// TODO: In production, you might want to:
		// 1. Store in database
		// 2. Send email notification to the firm
		// 3. Send confirmation email to the client

		return json({ 
			success: true, 
			message: 'Consultation request received successfully' 
		});
	} catch (err) {
		console.error('Consultation form error:', err);
		return json({ error: 'Failed to submit consultation request' }, { status: 500 });
	}
};
