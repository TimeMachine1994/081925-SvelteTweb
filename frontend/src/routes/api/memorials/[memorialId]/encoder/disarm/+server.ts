import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

/**
 * POST /api/memorials/[memorialId]/encoder/disarm
 * Disarm the encoder for this memorial (FD or Admin)
 * When disarmed, incoming streams will NOT show on the memorial page
 */
export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		throw svelteError(401, 'Authentication required');
	}

	const { memorialId } = params;

	try {
		console.log(`🔇 [ENCODER DISARM] Disarming encoder for memorial ${memorialId}`);

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
			throw svelteError(400, 'No encoder assigned to this memorial');
		}

		// Check if already disarmed
		if (!memorial.encoderConfig?.encoderArmed) {
			return json({
				success: true,
				message: 'Encoder is already disarmed',
				alreadyDisarmed: true
			});
		}

		// Update memorial with disarmed status
		await memorialDoc.ref.update({
			'encoderConfig.encoderArmed': false,
			'encoderConfig.armedAt': null,
			'encoderConfig.armedBy': null,
			'encoderConfig.streamStatus': 'offline',
			'encoderConfig.liveStartedAt': null,
			'encoderConfig.liveWatchUrl': null,
			'encoderConfig.hlsUrl': null,
			updatedAt: new Date()
		});

		console.log(`✅ [ENCODER DISARM] Encoder ${encoderId} disarmed for memorial ${memorialId}`);

		return json({
			success: true,
			message: 'Encoder disarmed successfully. Stream will no longer show on memorial page.'
		});
	} catch (err: any) {
		if (err.status) throw err;
		console.error('❌ [ENCODER DISARM] Error:', err);
		throw svelteError(500, `Failed to disarm encoder: ${err.message}`);
	}
};
