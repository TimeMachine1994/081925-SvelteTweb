import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createMagicLink } from '$lib/server/auth';
import { sendMagicLinkEmail } from '$lib/server/email';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import * as table from '$lib/server/db/schema';

const APP_URL = env.PUBLIC_APP_URL || 'http://localhost:5173';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();

		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ error: 'Invalid email address' }, { status: 400 });
		}

		const normalizedEmail = email.toLowerCase().trim();

		// Check if user exists
		const [user] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.email, normalizedEmail));

		if (!user) {
			// Don't reveal that the user doesn't exist
			return json({ success: true, message: 'If an account exists, a login link will be sent.' });
		}

		// Create magic link
		const token = await createMagicLink(normalizedEmail);
		const magicLinkUrl = `${APP_URL}/auth/verify?token=${token}`;

		// Send email
		await sendMagicLinkEmail(normalizedEmail, magicLinkUrl);

		return json({ success: true, message: 'Login link sent!' });
	} catch (error) {
		console.error('Magic link error:', error);
		return json({ error: 'Failed to send login link' }, { status: 500 });
	}
};
