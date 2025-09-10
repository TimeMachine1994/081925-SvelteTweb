import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Admin API endpoint to create a new memorial
 * Creates memorial document and user account for the family
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('📝 [ADMIN API] Memorial creation request received');
	
	try {
		// Verify admin authentication
		if (!locals.user) {
			console.log('❌ [ADMIN API] No authenticated user');
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Verify admin privileges
		if (!locals.user.admin && locals.user.role !== 'admin') {
			console.log('❌ [ADMIN API] User is not admin:', {
				uid: locals.user.uid,
				admin: locals.user.admin,
				role: locals.user.role
			});
			return json({ error: 'Admin privileges required' }, { status: 403 });
		}

		console.log('✅ [ADMIN API] Admin verification passed for:', locals.user.email);

		const formData = await request.json();
		console.log('📋 [ADMIN API] Memorial form data received:', {
			lovedOneName: formData.lovedOneName,
			creatorEmail: formData.creatorEmail,
			hasServiceDate: !!formData.serviceDate
		});

		// Validate required fields
		if (!formData.lovedOneName || !formData.creatorEmail) {
			console.log('❌ [ADMIN API] Missing required fields');
			return json({ error: 'Loved one name and creator email are required' }, { status: 400 });
		}

		// Generate slug from loved one's name
		const baseSlug = formData.lovedOneName
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '') // Remove special characters
			.replace(/\s+/g, '-') // Replace spaces with hyphens
			.replace(/-+/g, '-') // Replace multiple hyphens with single
			.replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

		const timestamp = Date.now();
		const fullSlug = `celebration-of-life-for-${baseSlug}-${timestamp}`;

		console.log('🔗 [ADMIN API] Generated memorial slug:', fullSlug);

		// Check if user already exists with this email
		const auth = getAuth();
		let userUid = null;
		let userExists = false;

		try {
			const existingUser = await auth.getUserByEmail(formData.creatorEmail);
			userUid = existingUser.uid;
			userExists = true;
			console.log('👤 [ADMIN API] User already exists:', formData.creatorEmail);
		} catch (userNotFoundError) {
			console.log('👤 [ADMIN API] Creating new user for:', formData.creatorEmail);
			
			// Create new Firebase Auth user
			const newUser = await auth.createUser({
				email: formData.creatorEmail,
				displayName: formData.creatorName || formData.lovedOneName + ' Family',
				password: Math.random().toString(36).slice(-12) // Generate random password
			});
			
			userUid = newUser.uid;
			
			// Set custom claims for owner role
			await auth.setCustomUserClaims(userUid, {
				role: 'owner',
				canCreateMemorials: true
			});

			console.log('✅ [ADMIN API] New user created with UID:', userUid);
		}

		// Create user profile document if new user
		if (!userExists) {
			const userProfile = {
				email: formData.creatorEmail,
				displayName: formData.creatorName || formData.lovedOneName + ' Family',
				role: 'owner',
				createdAt: Timestamp.now(),
				updatedAt: Timestamp.now(),
				createdByAdmin: true,
				createdBy: locals.user.uid
			};

			await adminDb.collection('users').doc(userUid).set(userProfile);
			console.log('👤 [ADMIN API] User profile created');
		}

		// Create memorial document
		const memorial = {
			// Basic memorial information
			lovedOneName: formData.lovedOneName,
			slug: baseSlug,
			fullSlug: fullSlug,
			
			// Creator/Owner information
			createdByUserId: userUid,
			creatorUid: userUid, // Legacy field
			ownerUid: userUid,
			creatorEmail: formData.creatorEmail,
			creatorName: formData.creatorName || formData.lovedOneName + ' Family',
			
			// Memorial content
			content: formData.content || '',
			isPublic: formData.isPublic !== false, // Default to true
			
			// Service information
			serviceDate: formData.serviceDate || null,
			serviceTime: formData.serviceTime || null,
			location: formData.location || '',
			
			// Memorial settings
			allowComments: true,
			allowPhotos: true,
			allowTributes: true,
			livestreamEnabled: false,
			
			// Admin creation metadata
			createdByAdmin: true,
			adminCreator: {
				uid: locals.user.uid,
				email: locals.user.email,
				createdAt: Timestamp.now()
			},
			
			// Timestamps
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),
			
			// Default empty arrays/objects
			photos: [],
			embeds: [],
			familyMemberUids: [],
			
			// Calculator config placeholder
			calculatorConfig: {
				status: 'draft',
				formData: {},
				autoSave: {}
			}
		};

		console.log('💾 [ADMIN API] Creating memorial document');
		const memorialRef = adminDb.collection('memorials').doc();
		await memorialRef.set(memorial);

		const memorialId = memorialRef.id;
		console.log('✅ [ADMIN API] Memorial created with ID:', memorialId);

		// Log the creation action for audit trail
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
			console.log('✅ [ADMIN API] Audit log created');
		} catch (auditError) {
			console.error('⚠️ [ADMIN API] Failed to create audit log:', auditError);
		}

		// TODO: Send welcome email to family with login credentials
		console.log('📧 [ADMIN API] TODO: Send welcome email to family');

		console.log('🎉 [ADMIN API] Memorial creation completed successfully');

		return json({
			success: true,
			message: 'Memorial created successfully',
			memorialId,
			fullSlug,
			userUid,
			userCreated: !userExists,
			memorialUrl: `/tributes/${fullSlug}`
		});

	} catch (error) {
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
