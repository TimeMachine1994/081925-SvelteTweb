import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/firebase-admin';
import { requireLivestreamAccess, createMemorialRequest } from '$lib/server/memorialMiddleware';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from '$env/static/private';

// Optional Cloudflare customer code - fallback to empty string if not set
const CLOUDFLARE_CUSTOMER_CODE = process.env.CLOUDFLARE_CUSTOMER_CODE || '';

/**
 * Start livestream for a memorial
 */
export const POST: RequestHandler = async ({ request, params, locals }) => {
	console.log('📺 Start livestream request for memorial:', params.memorialId);

	try {
		const { memorialId } = params;
		
		// Verify livestream permissions
		const memorialRequest = createMemorialRequest(memorialId, locals);
		const accessResult = await requireLivestreamAccess(memorialRequest);
		
		console.log('✅ Livestream access verified:', accessResult.reason);

		const { streamTitle, streamDescription } = await request.json();

		// Get memorial document
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data();

		// 1. Create a new Live Input in Cloudflare Stream
		const cfResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				meta: { name: `${memorial?.lovedOneName} - ${streamTitle}` },
				recording: { mode: 'automatic' }
			})
		});

		if (!cfResponse.ok) {
			const errorBody = await cfResponse.text();
			console.error(`Cloudflare API error: ${cfResponse.status} - ${errorBody}`);
			return json({ error: 'Failed to create livestream input', details: errorBody }, { status: 502 });
		}

		const cfData = await cfResponse.json();
		const liveInput = cfData.result;

		// 2. Create livestream session document in Firestore
		const livestreamData = {
			memorialId,
			startedBy: locals.user.uid,
			startedByEmail: locals.user.email,
			startedByRole: locals.user.role,
			title: streamTitle || `${memorial?.lovedOneName} Memorial Service`,
			description: streamDescription || '',
			status: 'starting',
			startedAt: new Date(),
			cloudflareId: liveInput.uid,
			streamKey: liveInput.rtmps.streamKey,
			streamUrl: liveInput.rtmps.url,
			playbackUrl: `https://customer-${CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com/${liveInput.uid}/iframe`,
			permissions: {
				canStart: accessResult.accessLevel === 'admin' || accessResult.accessLevel === 'edit',
				canStop: accessResult.accessLevel === 'admin' || accessResult.accessLevel === 'edit',
				canModerate: accessResult.accessLevel === 'admin'
			}
		};

		const livestreamRef = await adminDb.collection('livestreams').add(livestreamData);

		// 3. Update memorial with active livestream details
		await memorialRef.update({
			'livestream.isActive': true,
			'livestream.sessionId': livestreamRef.id,
			'livestream.cloudflareId': liveInput.uid,
			'livestream.startedAt': new Date(),
			'livestream.startedBy': locals.user.uid,
			'livestream.streamUrl': liveInput.rtmps.url,
			'livestream.streamKey': liveInput.rtmps.streamKey,
			'livestream.playbackUrl': livestreamData.playbackUrl
		});

		console.log('✅ Livestream started successfully:', livestreamRef.id);

		return json({
			success: true,
			sessionId: livestreamRef.id,
			streamKey: liveInput.rtmps.streamKey,
			streamUrl: liveInput.rtmps.url,
			playbackUrl: livestreamData.playbackUrl,
			permissions: livestreamData.permissions
		});

	} catch (error) {
		console.error('💥 Error starting livestream:', error);
		return json(
			{ error: 'Failed to start livestream', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};

/**
 * Stop livestream for a memorial
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	console.log('🛑 Stop livestream request for memorial:', params.memorialId);

	try {
		const { memorialId } = params;
		
		// Verify livestream permissions
		const memorialRequest = createMemorialRequest(memorialId, locals);
		const accessResult = await requireLivestreamAccess(memorialRequest);
		
		console.log('✅ Livestream stop access verified:', accessResult.reason);

		// Get memorial document
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data();
		const sessionId = memorial?.livestream?.sessionId;

		if (!sessionId) {
			return json({ error: 'No active livestream found' }, { status: 404 });
		}

		// Update livestream session
		await adminDb.collection('livestreams').doc(sessionId).update({
			status: 'ended',
			endedAt: new Date(),
			endedBy: locals.user.uid,
			endedByEmail: locals.user.email,
			endedByRole: locals.user.role
		});

		// Update memorial to remove active livestream
		await memorialRef.update({
			'livestream.isActive': false,
			'livestream.endedAt': new Date(),
			'livestream.endedBy': locals.user.uid
		});

		console.log('✅ Livestream stopped successfully:', sessionId);

		return json({
			success: true,
			message: 'Livestream stopped successfully'
		});

	} catch (error) {
		console.error('💥 Error stopping livestream:', error);
		return json(
			{ error: 'Failed to stop livestream', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};

/**
 * Get livestream status for a memorial
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	console.log('📊 Get livestream status for memorial:', params.memorialId);

	try {
		const { memorialId } = params;
		
		// Basic view access is sufficient for getting livestream status
		const memorialRequest = createMemorialRequest(memorialId, locals);
		// Note: We could use requireViewAccess here, but livestream status might be public
		
		// Get memorial document
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data();
		const livestreamInfo = memorial?.livestream || {};

		// Get current session if active
		let currentSession = null;
		if (livestreamInfo.isActive && livestreamInfo.sessionId) {
			const sessionDoc = await adminDb.collection('livestreams').doc(livestreamInfo.sessionId).get();
			if (sessionDoc.exists) {
				currentSession = {
					id: sessionDoc.id,
					...sessionDoc.data()
				};
			}
		}

		// Check user permissions for livestream control
		let permissions = {
			canStart: false,
			canStop: false,
			canModerate: false
		};

		try {
			const accessResult = await requireLivestreamAccess(memorialRequest);
			permissions = {
				canStart: !livestreamInfo.isActive && (accessResult.accessLevel === 'admin' || accessResult.accessLevel === 'edit'),
				canStop: livestreamInfo.isActive && (accessResult.accessLevel === 'admin' || accessResult.accessLevel === 'edit'),
				canModerate: accessResult.accessLevel === 'admin'
			};
		} catch {
			// User doesn't have livestream control permissions, keep defaults
		}

		return json({
			success: true,
			livestream: {
				isActive: livestreamInfo.isActive || false,
				startedAt: livestreamInfo.startedAt || null,
				streamUrl: livestreamInfo.streamUrl || null,
				playbackUrl: livestreamInfo.playbackUrl || null,
				currentSession,
				permissions
			}
		});

	} catch (error) {
		console.error('💥 Error getting livestream status:', error);
		return json(
			{ error: 'Failed to get livestream status', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
