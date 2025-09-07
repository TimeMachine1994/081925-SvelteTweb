import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/firebase-admin';
import type { CalculatorFormData } from '$lib/types/livestream';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	console.log('💾 Auto-save schedule API called for memorial:', params.memorialId);

	try {
		// Check authentication
		if (!locals.user) {
			console.log('❌ No authenticated user');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { memorialId } = params;
		if (!memorialId) {
			return json({ error: 'Memorial ID is required' }, { status: 400 });
		}

		// Parse request body
		const { formData, timestamp } = await request.json();
		if (!formData) {
			return json({ error: 'Form data is required' }, { status: 400 });
		}

		console.log('📝 Auto-saving schedule data:', {
			memorialId,
			userId: locals.user.uid,
			timestamp,
			hasFormData: !!formData
		});

		// Verify user has permission to edit this memorial
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			console.log('❌ Memorial not found:', memorialId);
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data();
		const userRole = locals.user.role;
		const userId = locals.user.uid;

		// Check permissions
		const hasPermission = 
			userRole === 'admin' ||
			memorial?.ownerUid === userId ||
			memorial?.funeralDirectorUid === userId ||
			(userRole === 'family_member' && memorial?.familyMemberUids?.includes(userId));

		if (!hasPermission) {
			console.log('❌ User lacks permission to edit memorial:', {
				userRole,
				userId,
				ownerUid: memorial?.ownerUid,
				funeralDirectorUid: memorial?.funeralDirectorUid
			});
			return json({ error: 'Insufficient permissions' }, { status: 403 });
		}

		// Create auto-save data structure
		const autoSaveData = {
			formData: formData as CalculatorFormData,
			lastModified: new Date(),
			lastModifiedBy: userId,
			autoSave: true,
			timestamp: timestamp || Date.now()
		};

		// Save to memorial's livestreamConfig with auto-save flag
		await memorialRef.update({
			'livestreamConfig.autoSave': autoSaveData,
			'livestreamConfig.lastAutoSave': new Date()
		});

		console.log('✅ Schedule auto-saved successfully for memorial:', memorialId);

		return json({
			success: true,
			timestamp: autoSaveData.timestamp,
			message: 'Schedule auto-saved successfully'
		});

	} catch (error) {
		console.error('💥 Error in schedule auto-save:', error);
		return json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};

export const GET: RequestHandler = async ({ params, locals }) => {
	console.log('📖 Get auto-saved schedule for memorial:', params.memorialId);

	try {
		// Check authentication
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { memorialId } = params;
		if (!memorialId) {
			return json({ error: 'Memorial ID is required' }, { status: 400 });
		}

		// Get memorial and check permissions
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data();
		const userRole = locals.user.role;
		const userId = locals.user.uid;

		// Check permissions
		const hasPermission = 
			userRole === 'admin' ||
			memorial?.ownerUid === userId ||
			memorial?.funeralDirectorUid === userId ||
			(userRole === 'family_member' && memorial?.familyMemberUids?.includes(userId));

		if (!hasPermission) {
			return json({ error: 'Insufficient permissions' }, { status: 403 });
		}

		// Return auto-saved data if it exists
		const autoSaveData = memorial?.livestreamConfig?.autoSave;
		
		if (autoSaveData) {
			console.log('✅ Auto-saved schedule found for memorial:', memorialId);
			return json({
				success: true,
				autoSave: autoSaveData,
				hasAutoSave: true
			});
		} else {
			console.log('ℹ️ No auto-saved schedule found for memorial:', memorialId);
			return json({
				success: true,
				hasAutoSave: false
			});
		}

	} catch (error) {
		console.error('💥 Error getting auto-saved schedule:', error);
		return json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
