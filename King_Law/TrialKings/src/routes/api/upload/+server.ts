import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOrCreateUser, createMagicLink, generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';
import { saveFile } from '$lib/server/files';
import { sendMagicLinkEmail, sendFileUploadConfirmation, sendAdminNotification } from '$lib/server/email';
import { env } from '$env/dynamic/private';

const APP_URL = env.PUBLIC_APP_URL || 'http://localhost:5173';

export const POST: RequestHandler = async (event) => {
	try {
		const formData = await event.request.formData();
		const email = formData.get('email') as string;
		const files = formData.getAll('files') as File[];

		if (!email || !files.length) {
			return json({ error: 'Email and at least one file are required' }, { status: 400 });
		}

		// Validate email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ error: 'Invalid email address' }, { status: 400 });
		}

		// Get or create user
		const user = await getOrCreateUser(email);

		// Create session and log user in
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		// Save files
		const savedFiles = [];
		for (const file of files) {
			if (file.size > 0) {
				const savedFile = await saveFile(user.id, file);
				savedFiles.push(savedFile);

				// Send admin notification for each file
				await sendAdminNotification(email, file.name, file.size);
			}
		}

		if (savedFiles.length === 0) {
			return json({ error: 'No valid files uploaded' }, { status: 400 });
		}

		// Create magic link for future logins
		const magicToken = await createMagicLink(email);
		const magicLinkUrl = `${APP_URL}/auth/verify?token=${magicToken}`;

		// Send emails
		await sendMagicLinkEmail(email, magicLinkUrl);
		await sendFileUploadConfirmation(
			email,
			savedFiles.map((f) => f.originalName).join(', '),
			`${APP_URL}/dashboard`
		);

		return json({
			success: true,
			message: `${savedFiles.length} file(s) uploaded successfully! Check your email for confirmation and login link.`,
			fileCount: savedFiles.length
		});
	} catch (error) {
		console.error('Upload error:', error);
		return json({ error: 'Upload failed. Please try again.' }, { status: 500 });
	}
};
