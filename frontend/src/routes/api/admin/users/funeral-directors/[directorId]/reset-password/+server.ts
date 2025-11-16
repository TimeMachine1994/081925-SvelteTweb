/**
 * RESET FUNERAL DIRECTOR PASSWORD API
 * 
 * Send password reset email to funeral director
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export async function POST({ params, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { directorId } = params;

	try {
		const directorDoc = await adminDb.collection('funeral_directors').doc(directorId).get();

		if (!directorDoc.exists) {
			return json({ error: 'Funeral director not found' }, { status: 404 });
		}

		const directorData = directorDoc.data();
		const email = directorData?.email;

		if (!email) {
			return json({ error: 'No email address found for this funeral director' }, { status: 400 });
		}

		// Generate password reset link
		const auth = (await import('firebase-admin/auth')).getAuth();
		const resetLink = await auth.generatePasswordResetLink(email);

		// TODO: Send password reset email via SendGrid
		// For now, just log the link
		console.log('Password reset link for', email, ':', resetLink);

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: 'reset_funeral_director_password',
			resourceType: 'funeral_director',
			resourceId: directorId,
			targetEmail: email,
			timestamp: new Date()
		});

		return json({ 
			success: true, 
			message: 'Password reset email sent',
			// In development, return the link
			resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
		});
	} catch (error: any) {
		console.error('Error resetting funeral director password:', error);
		return json({ error: 'Failed to reset password' }, { status: 500 });
	}
}
