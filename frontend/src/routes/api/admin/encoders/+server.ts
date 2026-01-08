import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { createLiveInput } from '$lib/server/cloudflare-stream';
import type { Encoder, CreateEncoderRequest } from '$lib/types/encoder';

/**
 * GET /api/admin/encoders
 * List all encoders (Admin only)
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw svelteError(403, 'Admin access required');
	}

	try {
		const status = url.searchParams.get('status');
		const limit = parseInt(url.searchParams.get('limit') || '50');

		let query: FirebaseFirestore.Query = adminDb.collection('encoders');

		if (status) {
			query = query.where('status', '==', status);
		}

		const snapshot = await query.orderBy('createdAt', 'desc').limit(limit).get();

		const encoders: Encoder[] = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				name: data.name,
				description: data.description || '',
				credentials: data.credentials,
				status: data.status || 'available',
				currentAssignment: data.currentAssignment || null,
				deviceType: data.deviceType || null,
				location: data.location || null,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
				createdBy: data.createdBy,
				updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
			};
		});

		return json({
			encoders,
			total: encoders.length
		});
	} catch (err: any) {
		console.error('❌ [ENCODERS API] Error listing encoders:', err);
		throw svelteError(500, `Failed to list encoders: ${err.message}`);
	}
};

/**
 * POST /api/admin/encoders
 * Create a new encoder with Cloudflare Live Input (Admin only)
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw svelteError(403, 'Admin access required');
	}

	try {
		const body: CreateEncoderRequest = await request.json();

		if (!body.name || body.name.trim() === '') {
			throw svelteError(400, 'Encoder name is required');
		}

		console.log('🎬 [ENCODERS API] Creating encoder:', body.name);

		// Create Cloudflare Live Input (persistent credentials)
		const liveInput = await createLiveInput(body.name);

		console.log('✅ [ENCODERS API] Cloudflare Live Input created:', liveInput.liveInputId);

		// Create encoder document
		const encoderData = {
			name: body.name.trim(),
			description: body.description?.trim() || '',
			credentials: {
				cloudflareInputId: liveInput.liveInputId,
				rtmpUrl: liveInput.rtmpsUrl,
				streamKey: liveInput.rtmpsStreamKey,
				whipUrl: liveInput.whipUrl,
				whepUrl: liveInput.whepUrl || null
			},
			status: 'available',
			currentAssignment: null,
			deviceType: body.deviceType || null,
			location: body.location?.trim() || null,
			createdAt: new Date(),
			createdBy: locals.user.uid,
			updatedAt: new Date()
		};

		const docRef = await adminDb.collection('encoders').add(encoderData);

		console.log('✅ [ENCODERS API] Encoder created:', docRef.id);

		return json({
			success: true,
			encoder: {
				id: docRef.id,
				...encoderData,
				createdAt: encoderData.createdAt.toISOString(),
				updatedAt: encoderData.updatedAt.toISOString()
			}
		});
	} catch (err: any) {
		console.error('❌ [ENCODERS API] Error creating encoder:', err);

		if (err.status) {
			throw err;
		}

		throw svelteError(500, `Failed to create encoder: ${err.message}`);
	}
};
