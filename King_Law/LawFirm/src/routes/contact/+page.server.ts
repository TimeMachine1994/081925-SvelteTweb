import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

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

		// In production, you would send an email or save to database
		console.log('Contact form submission:', { name, email, phone, subject, message });

		return { success: true };
	}
};
