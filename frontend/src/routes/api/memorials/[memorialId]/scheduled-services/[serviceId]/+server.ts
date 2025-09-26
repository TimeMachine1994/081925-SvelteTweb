import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { requireEditAccess } from '$lib/server/memorialMiddleware';
import { FieldValue } from 'firebase-admin/firestore';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	const { memorialId, serviceId } = params;
	const { uid, role } = locals.user;

	// Verify memorial access (edit permission required)
	await requireEditAccess({ memorialId, user: { uid, email: locals.user.email, role, isAdmin: locals.user.isAdmin } });

	try {
		const body = await request.json();
		const { status, sessionId, isVisible } = body;

		// Update service status
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const updateData: any = {
			updatedAt: new Date()
		};

		if (status) {
			updateData[`customStreams.${serviceId}.status`] = status;
		}

		if (sessionId) {
			updateData[`customStreams.${serviceId}.sessionId`] = sessionId;
		}

		if (typeof isVisible === 'boolean') {
			updateData[`customStreams.${serviceId}.isVisible`] = isVisible;
		}

		await memorialRef.update(updateData);

		console.log(`✅ Updated service ${serviceId} for memorial ${memorialId}`);

		return json({
			success: true,
			message: 'Service updated successfully'
		});

	} catch (err) {
		console.error('Error updating scheduled service:', err);
		throw error(500, 'Failed to update scheduled service');
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	const { memorialId, serviceId } = params;
	const { uid, role } = locals.user;

	// Verify memorial access (edit permission required)
	await requireEditAccess({ memorialId, user: { uid, email: locals.user.email, role, isAdmin: locals.user.isAdmin } });

	try {
		// Remove custom stream
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		await memorialRef.update({
			[`customStreams.${serviceId}`]: FieldValue.delete(),
			updatedAt: new Date()
		});

		console.log(`🗑️ Deleted service ${serviceId} for memorial ${memorialId}`);

		return json({
			success: true,
			message: 'Service deleted successfully'
		});

	} catch (err) {
		console.error('Error deleting scheduled service:', err);
		throw error(500, 'Failed to delete scheduled service');
	}
};
