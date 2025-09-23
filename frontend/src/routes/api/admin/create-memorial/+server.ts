import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';
import { sendEnhancedRegistrationEmail } from '$lib/server/email';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		if (!locals.user.admin && locals.user.role !== 'admin') {
			return json({ error: 'Admin privileges required' }, { status: 403 });
		}

		const formData = await request.json();

		if (!formData.lovedOneName || !formData.creatorEmail) {
			return json({ error: 'Loved one name and creator email are required' }, { status: 400 });
		}

		const baseSlug = formData.lovedOneName
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');

		const fullSlug = `celebration-of-life-for-${baseSlug}`;

		const auth = getAuth();
		let userUid = null;
		let userExists = false;
		let password = '';

		try {
			const existingUser = await auth.getUserByEmail(formData.creatorEmail);
			userUid = existingUser.uid;
			userExists = true;
		} catch (userNotFoundError) {
			password = Math.random().toString(36).slice(-12);
			const newUser = await auth.createUser({
				email: formData.creatorEmail,
				displayName: formData.creatorName || formData.lovedOneName + ' Family',
				password: password
			});
			userUid = newUser.uid;
			await auth.setCustomUserClaims(userUid, {
				role: 'owner',
				canCreateMemorials: true
			});
		}

		if (!userExists) {
			await adminDb.collection('users').doc(userUid).set({
				email: formData.creatorEmail,
				displayName: formData.creatorName || formData.lovedOneName + ' Family',
				role: 'owner',
				createdAt: Timestamp.now(),
				updatedAt: Timestamp.now(),
				createdByAdmin: true,
				createdBy: locals.user.uid
			});
		}

		const memorial = {
			lovedOneName: formData.lovedOneName,
			slug: baseSlug,
			fullSlug: fullSlug,
			ownerUid: userUid, // V1: Single source of truth for ownership
			creatorEmail: formData.creatorEmail,
			creatorName: formData.creatorName || formData.lovedOneName + ' Family',
			content: formData.content || '',
			isPublic: formData.isPublic !== false,
			serviceDate: formData.serviceDate || null,
			serviceTime: formData.serviceTime || null,
			location: formData.location || '',
			allowComments: true,
			allowPhotos: true,
			allowTributes: true,
			livestreamEnabled: false,
			createdByAdmin: true,
			adminCreator: {
				uid: locals.user.uid,
				email: locals.user.email,
				createdAt: Timestamp.now()
			},
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),
			photos: [],
			embeds: [],
			calculatorConfig: {
				status: 'draft',
				formData: {},
				autoSave: {}
			}
		};

		const memorialRef = adminDb.collection('memorials').doc();
		await memorialRef.set(memorial);

		const memorialId = memorialRef.id;

		try {
			await adminDb.collection('admin_actions').add({
				action: 'create_memorial',
				targetId: memorialId,
				targetType: 'memorial',
				performedBy: locals.user.uid,
				performedByEmail: locals.user.email,
				timestamp: Timestamp.now(),
				details: {
					lovedOneName: formData.lovedOneName,
					creatorEmail: formData.creatorEmail,
					fullSlug: fullSlug,
					userCreated: !userExists
				}
			});
		} catch (auditError) {
			console.error('⚠️ [ADMIN API] Failed to create audit log:', auditError);
		}

		if (!userExists && password) {
			try {
				await sendEnhancedRegistrationEmail({
					email: formData.creatorEmail,
					password: password,
					lovedOneName: formData.lovedOneName,
					tributeUrl: `https://tributestream.com/tributes/${fullSlug}`,
					familyContactEmail: formData.creatorEmail,
					familyContactName: formData.creatorName || `${formData.lovedOneName} Family`,
					familyContactPhone: '',
					contactPreference: 'email',
					directorName: 'TributeStream Admin',
					funeralHomeName: 'TributeStream',
				});
			} catch (emailError) {
				console.error('⚠️ [ADMIN API] Failed to send welcome email:', emailError);
			}
		}

		return json({
			success: true,
			message: 'Memorial created successfully',
			memorialId,
			fullSlug,
			userUid,
			userCreated: !userExists,
			memorialUrl: `/tributes/${fullSlug}`
		});

	} catch (error: any) {
		console.error('💥 [ADMIN API] Error creating memorial:', {
			error: error.message,
			stack: error.stack,
			user: locals.user?.email
		});
		
		return json({ 
			error: 'Internal server error occurred while creating memorial' 
		}, { status: 500 });
	}
};
