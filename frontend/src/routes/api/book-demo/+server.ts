import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		// Validate required fields
		const { funeralHomeName, contactName, email, phone } = data;
		if (!funeralHomeName || !contactName || !email || !phone) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Here you would typically:
		// 1. Save to database
		// 2. Send notification emails
		// 3. Add to calendar/CRM system
		
		console.log('📅 Demo booking request received:', {
			funeralHomeName: data.funeralHomeName,
			contactName: data.contactName,
			email: data.email,
			phone: data.phone,
			preferredDate: data.preferredDate,
			preferredTime: data.preferredTime,
			address: data.address,
			notes: data.notes,
			wantAdvertising: data.wantAdvertising,
			timestamp: new Date().toISOString()
		});

		// For now, just log the request
		// TODO: Implement actual booking logic
		// - Save to Firestore
		// - Send email notifications
		// - Add to Google Calendar
		// - Create CRM entry

		return json({ 
			success: true, 
			message: 'Demo request submitted successfully' 
		});

	} catch (error) {
		console.error('Error processing demo booking:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
