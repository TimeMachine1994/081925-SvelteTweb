import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { sendEmail } from '$lib/server/email';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const email = data.get('email')?.toString();
		const phone = data.get('phone')?.toString();
		const subject = data.get('subject')?.toString();
		const message = data.get('message')?.toString();

		if (!name || !email || !subject || !message) {
			return fail(400, { error: 'All required fields must be filled' });
		}

		try {
			const result = await sendEmail({
				to: 'print@trialkings.law',
				replyTo: email,
				subject: `[King Law Contact] ${subject}`,
				text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\nMessage:\n${message}`,
				html: `
					<h2>New Contact Form Submission</h2>
					<p><strong>Name:</strong> ${name}</p>
					<p><strong>Email:</strong> ${email}</p>
					<p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
					<p><strong>Subject:</strong> ${subject}</p>
					<hr />
					<p><strong>Message:</strong></p>
					<p>${message.replace(/\n/g, '<br />')}</p>
				`
			});

			if (!result.success) {
				return fail(500, { error: result.error || 'Failed to send message. Please try again later.' });
			}

			return { success: true };
		} catch (error) {
			console.error('Contact form error:', error);
			return fail(500, { error: 'Failed to send message. Please try again later.' });
		}
	}
};
