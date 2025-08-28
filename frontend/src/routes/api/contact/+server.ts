import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendEmail } from '$lib/server/email';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { name, email, subject, message } = await request.json();

		// Basic validation
		if (!name || !email || !subject || !message) {
			error(400, 'All fields are required.');
		}

		// Send confirmation email to the user
		const userEmailSubject = 'Tributestream: Your Contact Message Has Been Received';
		const userEmailBody = `
			<p>Dear ${name},</p>
			<p>Thank you for contacting Tributestream. We have received your message and will get back to you shortly.</p>
			<p>Here is a copy of your message:</p>
			<p><strong>Subject:</strong> ${subject}</p>
			<p><strong>Message:</strong><br>${message}</p>
			<p>Sincerely,<br>The Tributestream Team</p>
		`;
		await sendEmail(email, userEmailSubject, userEmailBody);
		console.log(`📧 Confirmation email sent to ${email}`);

		// Send notification email to administrators (replace with actual admin email)
		const adminEmail = 'admin@tributestream.com'; // TODO: Replace with actual admin email from environment variables
		const adminNotificationSubject = `Tributestream: New Contact Form Submission - ${subject}`;
		const adminNotificationBody = `
			<p>A new contact form submission has been received:</p>
			<p><strong>Name:</strong> ${name}</p>
			<p><strong>Email:</strong> ${email}</p>
			<p><strong>Subject:</strong> ${subject}</p>
			<p><strong>Message:</strong><br>${message}</p>
		`;
		await sendEmail(adminEmail, adminNotificationSubject, adminNotificationBody);
		console.log(`📧 Admin notification email sent to ${adminEmail}`);

		return json({ message: 'Message sent successfully!' }, { status: 200 });
	} catch (err) {
		console.error('❌ Error handling contact form submission:', err);
		error(500, 'Failed to send message.');
	}
};