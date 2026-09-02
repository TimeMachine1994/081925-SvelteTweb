import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getAuth } from 'firebase-admin/auth';
import { findOrCreateOwner } from '$lib/server/memorialOwner';
import { Timestamp } from 'firebase-admin/firestore';
import { sendEnhancedRegistrationEmail } from '$lib/server/email';
import { hasPermission } from '$lib/admin/permissions';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		if (locals.user.role !== 'admin') {
			return json({ error: 'Admin privileges required' }, { status: 403 });
		}

		if (
			!hasPermission(
				{ uid: locals.user.uid, email: locals.user.email || '', adminRole: locals.user.adminRole },
				'memorial',
				'create'
			)
		) {
			return json({ error: 'Permission denied' }, { status: 403 });
		}

		const formData = await request.json();

		if (!formData.lovedOneName) {
			return json({ error: 'Loved one name is required' }, { status: 400 });
		}

		const creatorEmail: string | null = formData.creatorEmail?.trim() || null;
		const creatorName: string = formData.creatorName || formData.lovedOneName + ' Family';

		const baseSlug = formData.lovedOneName
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');

		const fullSlug = `celebration-of-life-for-${baseSlug}`;

		// Owner is optional: an admin can create an unowned memorial and assign a family member later.
		const owner = creatorEmail
			? await findOrCreateOwner(creatorEmail, creatorName, locals.user.uid)
			: null;
		const userUid = owner?.uid ?? null;
		const userExists = owner ? !owner.created : false;
		const password = owner?.password ?? '';

		const memorial = {
			lovedOneName: formData.lovedOneName,
			slug: baseSlug,
			fullSlug: fullSlug,
			ownerUid: userUid, // V1: Single source of truth for ownership
			creatorEmail,
			creatorName,
			content: formData.content || '',
			isPublic: true, // Always set to true for new memorials
			isComplete: false, // New memorials start as incomplete/scheduled
			serviceDate: formData.serviceDate || null,
			serviceTime: formData.serviceTime || null,
			location: formData.location || '',
			allowComments: true,
			allowPhotos: true,
			allowTributes: true,
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
					creatorEmail,
					fullSlug: fullSlug,
					userCreated: !!creatorEmail && !userExists
				}
			});
		} catch (auditError) {
			console.error('⚠️ [ADMIN API] Failed to create audit log:', auditError);
		}

		if (creatorEmail && userUid && !userExists && password) {
			try {
				// Generate custom token for magic link authentication
				console.log('🎟️ [ADMIN API] Generating magic link token...');
				const customToken = await getAuth().createCustomToken(userUid, {
					role: 'owner',
					email: creatorEmail,
					memorial_id: memorialId
				});

				// Create magic link URL that goes directly to their memorial page
				const baseUrl = process.env.PUBLIC_BASE_URL || 'https://tributestream.com';
				const magicLink = `${baseUrl}/auth/session?token=${customToken}&fullSlug=${fullSlug}`;
				console.log('🔗 [ADMIN API] Magic link created for memorial page:', fullSlug);

				await sendEnhancedRegistrationEmail({
					email: creatorEmail,
					password: password,
					lovedOneName: formData.lovedOneName,
					ownerName: creatorName,
					memorialUrl: `${baseUrl}/${fullSlug}`,
					magicLink: magicLink // Pass magic link to email
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
			hasOwner: !!userUid,
			userCreated: !!creatorEmail && !userExists,
			memorialUrl: `/${fullSlug}`
		});
	} catch (error: any) {
		console.error('💥 [ADMIN API] Error creating memorial:', {
			error: error.message,
			stack: error.stack,
			user: locals.user?.email
		});

		return json(
			{
				error: 'Internal server error occurred while creating memorial'
			},
			{ status: 500 }
		);
	}
};
