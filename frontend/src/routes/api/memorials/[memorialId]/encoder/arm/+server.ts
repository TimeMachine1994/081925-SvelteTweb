import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

/**
 * POST /api/memorials/[memorialId]/encoder/arm
 * Arm the assigned encoder for this memorial (FD or Admin)
 * When armed, incoming streams will show on the memorial page
 */
export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		throw svelteError(401, 'Authentication required');
	}

	const { memorialId } = params;

	try {
		console.log(`🎯 [ENCODER ARM] Arming encoder for memorial ${memorialId}`);

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

		// Check if encoder is assigned
		const encoderId = memorial.encoderConfig?.assignedEncoderId;
		if (!encoderId) {
			throw svelteError(400, 'No encoder assigned to this memorial. Please assign an encoder first.');
		}

		// Check if already armed
		if (memorial.encoderConfig?.encoderArmed) {
			return json({
				success: true,
				message: 'Encoder is already armed',
				alreadyArmed: true
			});
		}

		// Get encoder for credentials
		const encoderDoc = await adminDb.collection('encoders').doc(encoderId).get();
		if (!encoderDoc.exists) {
			throw svelteError(404, 'Assigned encoder not found');
		}

		const encoder = encoderDoc.data()!;

		// Update memorial with armed status
		await memorialDoc.ref.update({
			'encoderConfig.encoderArmed': true,
			'encoderConfig.armedAt': new Date().toISOString(),
			'encoderConfig.armedBy': locals.user.uid,
			'encoderConfig.streamStatus': 'offline',
			updatedAt: new Date()
		});

		console.log(`✅ [ENCODER ARM] Encoder ${encoderId} armed for memorial ${memorialId}`);

		return json({
			success: true,
			message: 'Encoder armed successfully. Stream will appear when you go live.',
			encoderId,
			encoderName: encoder.name,
			credentials: {
				rtmpUrl: encoder.credentials.rtmpUrl,
				streamKey: encoder.credentials.streamKey,
				whipUrl: encoder.credentials.whipUrl
			}
		});
	} catch (err: any) {
		if (err.status) throw err;
		console.error('❌ [ENCODER ARM] Error:', err);
		throw svelteError(500, `Failed to arm encoder: ${err.message}`);
	}
};
