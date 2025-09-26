import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb, FieldValue } from '$lib/firebase-admin';
import { requireLivestreamAccess, createMemorialRequest } from '$lib/server/memorialMiddleware';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from '$env/static/private';

// Optional Cloudflare customer code - fallback to empty string if not set
const CLOUDFLARE_CUSTOMER_CODE = process.env.CLOUDFLARE_CUSTOMER_CODE || '';
console.log('🔧 CLOUDFLARE_CUSTOMER_CODE loaded:', CLOUDFLARE_CUSTOMER_CODE ? 'SET' : 'EMPTY');
console.log('🔧 CLOUDFLARE_CUSTOMER_CODE value:', CLOUDFLARE_CUSTOMER_CODE);
console.log('🔧 CLOUDFLARE_ACCOUNT_ID:', CLOUDFLARE_ACCOUNT_ID ? 'SET' : 'EMPTY');
console.log('🔧 CLOUDFLARE_API_TOKEN:', CLOUDFLARE_API_TOKEN ? 'SET' : 'EMPTY');

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
		console.log('📡 Cloudflare API Response:', JSON.stringify(cfData, null, 2));
		const liveInput = cfData.result;
		console.log('📡 Live Input Data:', JSON.stringify(liveInput, null, 2));

		// 2. Create livestream session document in Firestore
		// Generate playback URLs - prioritize working formats
		const alternativePlaybackUrl = `https://cloudflarestream.com/${liveInput.uid}/iframe`;
		const customerPlaybackUrl = CLOUDFLARE_CUSTOMER_CODE ? 
			`https://customer-${CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com/${liveInput.uid}/iframe` : null;
		const directPlaybackUrl = liveInput.playback?.hls || liveInput.playback?.dash || null;
		
		// Use the best available URL format
		const playbackUrl = alternativePlaybackUrl; // This format works without customer code
		
		console.log('🎥 Primary playback URL (standard format):', playbackUrl);
		console.log('🎥 Customer playback URL:', customerPlaybackUrl);
		console.log('🎥 Alternative playback URL:', alternativePlaybackUrl);
		console.log('🎥 Direct playback URL from API:', directPlaybackUrl);
		console.log('🎥 Live Input UID:', liveInput.uid);
		console.log('🎥 Live Input RTMPS URL:', liveInput.rtmps?.url);
		console.log('🎥 Live Input Stream Key:', liveInput.rtmps?.streamKey ? 'SET' : 'MISSING');
		
		const livestreamData = {
			memorialId,
			startedBy: locals.user?.uid,
			startedByEmail: locals.user?.email,
			startedByRole: locals.user?.role,
			title: streamTitle || `${memorial?.lovedOneName} Memorial Service`,
			description: streamDescription || '',
			status: 'starting',
			startedAt: new Date(),
			cloudflareId: liveInput.uid,
			streamKey: liveInput.rtmps.streamKey,
			streamUrl: liveInput.rtmps.url,
			playbackUrl,
			alternativePlaybackUrl,
			customerPlaybackUrl,
			directPlaybackUrl,
			permissions: {
				canStart: accessResult.accessLevel === 'admin' || accessResult.accessLevel === 'edit',
				canStop: accessResult.accessLevel === 'admin' || accessResult.accessLevel === 'edit',
				canModerate: accessResult.accessLevel === 'admin'
			}
		};
		
		console.log('💾 Livestream data to be saved:', JSON.stringify(livestreamData, null, 2));

		const livestreamRef = await adminDb.collection('livestreams').add(livestreamData);

		// 3. Update memorial with active livestream details
		const memorialUpdateData = {
			'livestream.isActive': true,
			'livestream.sessionId': livestreamRef.id,
			'livestream.cloudflareId': liveInput.uid,
			'livestream.startedAt': new Date(),
			'livestream.startedBy': locals.user.uid,
			'livestream.streamUrl': liveInput.rtmps.url,
			'livestream.streamKey': liveInput.rtmps.streamKey,
			'livestream.playbackUrl': livestreamData.playbackUrl,
			'livestream.alternativePlaybackUrl': livestreamData.alternativePlaybackUrl,
			'livestream.customerPlaybackUrl': livestreamData.customerPlaybackUrl,
			'livestream.directPlaybackUrl': livestreamData.directPlaybackUrl
		};
		
		console.log('💾 Memorial update data:', JSON.stringify(memorialUpdateData, null, 2));
		await memorialRef.update(memorialUpdateData);

		console.log('✅ Livestream started successfully:', livestreamRef.id);

		const responseData = {
			success: true,
			sessionId: livestreamRef.id,
			streamKey: liveInput.rtmps.streamKey,
			streamUrl: liveInput.rtmps.url,
			playbackUrl: livestreamData.playbackUrl,
			alternativePlaybackUrl: livestreamData.alternativePlaybackUrl,
			customerPlaybackUrl: livestreamData.customerPlaybackUrl,
			directPlaybackUrl: livestreamData.directPlaybackUrl,
			cloudflareId: liveInput.uid,
			permissions: livestreamData.permissions
		};
		
		console.log('📤 API Response:', JSON.stringify(responseData, null, 2));
		return json(responseData);

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
		const cloudflareId = memorial?.livestream?.cloudflareId;

		if (!sessionId) {
			return json({ error: 'No active livestream found' }, { status: 404 });
		}

		// Optionally disconnect the Cloudflare Live Input (this will force stop any active streams)
		if (cloudflareId) {
			try {
				console.log('🌩️ Disconnecting Cloudflare Live Input:', cloudflareId);
				// Note: Cloudflare doesn't have a direct "stop" API, but we can delete the live input
				// This will force disconnect any active streams
				const cfResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${cloudflareId}`, {
					method: 'DELETE',
					headers: {
						'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
						'Content-Type': 'application/json'
					}
				});
				
				if (cfResponse.ok) {
					console.log('✅ Cloudflare Live Input deleted successfully');
				} else {
					const errorBody = await cfResponse.text();
					console.warn('⚠️ Could not delete Cloudflare Live Input:', errorBody);
				}
			} catch (cfError) {
				console.warn('⚠️ Error disconnecting Cloudflare Live Input:', cfError);
			}
		}

		// Update livestream session
		await adminDb.collection('livestreams').doc(sessionId).update({
			status: 'ended',
			endedAt: new Date(),
			endedBy: locals.user.uid,
			endedByEmail: locals.user.email,
			endedByRole: locals.user.role
		});

		// Try to get the recorded video from Cloudflare
		let recordingPlaybackUrl = '';
		let recordingReady = false;
		let recordingThumbnail = '';
		
		if (cloudflareId) {
			try {
				console.log('🎬 Checking for recorded video:', cloudflareId);
				const videoResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${cloudflareId}`, {
					headers: {
						'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
						'Content-Type': 'application/json'
					}
				});

				if (videoResponse.ok) {
					const videoData = await videoResponse.json();
					const video = videoData.result;
					
					console.log('🎥 Video data from Cloudflare:', JSON.stringify(video, null, 2));
					
					if (video.status === 'ready' && video.playback) {
						recordingReady = true;
						recordingPlaybackUrl = video.playback.hls || video.playback.dash || '';
						recordingThumbnail = video.thumbnail || '';
						console.log('✅ Recording is ready:', recordingPlaybackUrl);
					} else {
						console.log('⏳ Recording not ready yet, status:', video.status);
					}
				} else {
					console.warn('⚠️ Could not fetch video data from Cloudflare:', videoResponse.status);
				}
			} catch (error) {
				console.warn('⚠️ Error fetching recorded video:', error);
			}
		}

		// Create archive entry for this livestream
		const archiveEntry = {
			id: sessionId,
			title: memorial.livestream?.title || `${memorial.lovedOneName} Memorial Service`,
			description: memorial.livestream?.description || '',
			cloudflareId: cloudflareId,
			playbackUrl: recordingPlaybackUrl || memorial.livestream?.playbackUrl || '', // Use recording URL if available
			recordingPlaybackUrl: recordingPlaybackUrl,
			recordingThumbnail: recordingThumbnail,
			startedAt: memorial.livestream?.startedAt,
			endedAt: new Date(),
			isVisible: true, // Default to visible
			recordingReady: recordingReady, // True if recording is immediately available
			startedBy: memorial.livestream?.startedBy || locals.user.uid,
			startedByName: locals.user?.displayName || 'Unknown',
			viewerCount: 0, // Could be updated with actual viewer count
			createdAt: new Date(),
			updatedAt: new Date()
		};

		// Add to archive and update memorial
		await memorialRef.update({
			'livestream.isActive': false,
			'livestream.endedAt': new Date(),
			'livestream.endedBy': locals.user.uid,
			'livestream.status': 'ended',
			'livestreamArchive': FieldValue.arrayUnion(archiveEntry)
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
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

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

		// Check actual Cloudflare status to verify if stream is really live
		let cloudflareStatus = null;
		let actuallyLive = false;
		if (livestreamInfo.cloudflareId) {
			try {
				console.log('🔍 Checking actual Cloudflare status for:', livestreamInfo.cloudflareId);
				const cfResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${livestreamInfo.cloudflareId}`, {
					headers: {
						'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
						'Content-Type': 'application/json'
					}
				});

				if (cfResponse.ok) {
					const cfData = await cfResponse.json();
					cloudflareStatus = cfData.result;
					actuallyLive = cloudflareStatus.status === 'live';
					console.log('🌩️ Cloudflare Live Input status:', cloudflareStatus.status);
					
					// If Cloudflare says not live but our DB says active, sync the status
					if (!actuallyLive && livestreamInfo.isActive) {
						console.log('🔄 Syncing status: Cloudflare not live, updating memorial');
						await memorialRef.update({
							'livestream.isActive': false,
							'livestream.status': 'ended',
							'livestream.syncedAt': new Date()
						});
						livestreamInfo.isActive = false;
					}
				} else if (cfResponse.status === 404) {
					// Live input was deleted, update our status
					console.log('🔄 Live input not found, marking as ended');
					if (livestreamInfo.isActive) {
						await memorialRef.update({
							'livestream.isActive': false,
							'livestream.status': 'ended',
							'livestream.syncedAt': new Date()
						});
						livestreamInfo.isActive = false;
					}
				}
			} catch (cfError) {
				console.warn('⚠️ Could not check Cloudflare status:', cfError);
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
				actuallyLive,
				startedAt: livestreamInfo.startedAt || null,
				endedAt: livestreamInfo.endedAt || null,
				streamUrl: livestreamInfo.streamUrl || null,
				playbackUrl: livestreamInfo.playbackUrl || null,
				status: livestreamInfo.status || 'unknown',
				cloudflareId: livestreamInfo.cloudflareId || null,
				currentSession,
				permissions,
				cloudflareStatus: cloudflareStatus ? {
					status: cloudflareStatus.status,
					connectionCount: cloudflareStatus.connectionCount || 0,
					recording: cloudflareStatus.recording
				} : null,
				debugging: {
					dbSaysActive: livestreamInfo.isActive || false,
					cloudflareSaysLive: actuallyLive,
					statusMatch: (livestreamInfo.isActive || false) === actuallyLive,
					lastSyncedAt: livestreamInfo.syncedAt || null
				}
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
