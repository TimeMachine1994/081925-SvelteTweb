import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { AssignEncoderRequest } from '$lib/types/encoder';

/**
 * POST /api/memorials/[memorialId]/encoder/assign
 * Assign an encoder to a memorial (FD or Admin)
 */
export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		throw svelteError(401, 'Authentication required');
	}

	const { memorialId } = params;

	try {
		const body: AssignEncoderRequest = await request.json();

		if (!body.encoderId) {
			throw svelteError(400, 'Encoder ID is required');
		}

		console.log(`📡 [ENCODER ASSIGN] Assigning encoder ${body.encoderId} to memorial ${memorialId}`);

		// Get memorial and verify permission
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		if (!memorialDoc.exists) {
			throw svelteError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;
		const isAdmin = locals.user.role === 'admin';
		const isFD = memorial.funeralDirector?.id === locals.user.uid || 
		             memorial.funeralDirectorUid === locals.user.uid;
		const isOwner = memorial.ownerUid === locals.user.uid;

		if (!isAdmin && !isFD && !isOwner) {
			throw svelteError(403, 'Permission denied');
		}

		// Get encoder and verify it's available
		const encoderDoc = await adminDb.collection('encoders').doc(body.encoderId).get();
		if (!encoderDoc.exists) {
			throw svelteError(404, 'Encoder not found');
		}

		const encoder = encoderDoc.data()!;

		// Check if encoder is available or being reassigned
		if (encoder.status === 'assigned' && encoder.currentAssignment?.memorialId !== memorialId) {
			throw svelteError(400, 'Encoder is already assigned to another memorial');
		}

		if (encoder.status === 'maintenance') {
			throw svelteError(400, 'Encoder is under maintenance');
		}

		// If memorial already has an encoder, unassign it first
		const currentEncoderId = memorial.encoderConfig?.assignedEncoderId;
		if (currentEncoderId && currentEncoderId !== body.encoderId) {
			await adminDb.collection('encoders').doc(currentEncoderId).update({
				status: 'available',
				currentAssignment: null,
				updatedAt: new Date()
			});
			console.log(`📡 [ENCODER ASSIGN] Unassigned previous encoder: ${currentEncoderId}`);
		}

		// Update encoder with assignment
		await encoderDoc.ref.update({
			status: 'assigned',
			currentAssignment: {
				memorialId,
				memorialName: memorial.lovedOneName || memorial.title || 'Memorial',
				funeralDirectorId: locals.user.uid,
				funeralDirectorName: locals.user.displayName || locals.user.email || 'Unknown',
				assignedAt: new Date().toISOString()
			},
			updatedAt: new Date()
		});

		// Update memorial with encoder config
		await memorialDoc.ref.update({
			encoderConfig: {
				assignedEncoderId: body.encoderId,
				assignedEncoderName: encoder.name,
				streamStatus: 'offline'
			},
			updatedAt: new Date()
		});

		console.log(`✅ [ENCODER ASSIGN] Encoder ${body.encoderId} assigned to memorial ${memorialId}`);

		return json({
			success: true,
			message: 'Encoder assigned successfully',
			encoderId: body.encoderId,
			encoderName: encoder.name
		});
	} catch (err: any) {
		if (err.status) throw err;
		console.error('❌ [ENCODER ASSIGN] Error:', err);
		throw svelteError(500, `Failed to assign encoder: ${err.message}`);
	}
};

/**
 * DELETE /api/memorials/[memorialId]/encoder/assign
 * Unassign encoder from memorial
 */
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		throw svelteError(401, 'Authentication required');
	}

	const { memorialId } = params;

	try {
		// Get memorial and verify permission
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		if (!memorialDoc.exists) {
			throw svelteError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;
		const isAdmin = locals.user.role === 'admin';
		const isFD = memorial.funeralDirector?.id === locals.user.uid || 
		             memorial.funeralDirectorUid === locals.user.uid;

		if (!isAdmin && !isFD) {
			throw svelteError(403, 'Permission denied');
		}

		const encoderId = memorial.encoderConfig?.assignedEncoderId;
		if (!encoderId) {
			throw svelteError(400, 'No encoder assigned to this memorial');
		}

		// Update encoder
		await adminDb.collection('encoders').doc(encoderId).update({
			status: 'available',
			currentAssignment: null,
			updatedAt: new Date()
		});

		// Update memorial
		await memorialDoc.ref.update({
			encoderConfig: {
				assignedEncoderId: null,
				assignedEncoderName: null,
				streamStatus: 'offline'
			},
			updatedAt: new Date()
		});

		console.log(`✅ [ENCODER ASSIGN] Encoder ${encoderId} unassigned from memorial ${memorialId}`);

		return json({
			success: true,
			message: 'Encoder unassigned successfully'
		});
	} catch (err: any) {
		if (err.status) throw err;
		console.error('❌ [ENCODER ASSIGN] Error:', err);
		throw svelteError(500, `Failed to unassign encoder: ${err.message}`);
	}
};
