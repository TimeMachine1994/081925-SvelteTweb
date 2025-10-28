import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const MUX_TOKEN_ID = env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = env.MUX_TOKEN_SECRET;

/**
 * Mux Bridge Stop Endpoint
 * 
 * URL: /api/streams/[streamId]/bridge/stop
 * Purpose: Stop Mux bridge and finalize recording
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	const { streamId } = params;

	console.log('🛑 [BRIDGE_STOP] Stopping bridge for stream:', streamId);

	try {
		// Validate user authentication
		if (!locals.user) {
			console.error('❌ [BRIDGE_STOP] Unauthorized request');
			throw error(401, 'Authentication required');
		}

		// Find Mux bridge session for this stream
		const bridgeDoc = await adminDb
			.collection('mux_bridges')
			.doc(streamId)
			.get();

		if (!bridgeDoc.exists) {
			console.log('ℹ️ [MUX_BRIDGE_STOP] No bridge session found for stream:', streamId);
			return json({
				success: true,
				message: 'No Mux bridge session to stop'
			});
		}

		const bridgeSession = bridgeDoc.data();

		// Check if bridge is already stopped
		if (bridgeSession?.status === 'completed') {
			return json({
				success: true,
				bridgeId: bridgeSession.muxLiveStreamId,
				stoppedAt: bridgeSession.completedAt,
				message: 'Bridge already stopped'
			});
		}

		console.log('📋 [MUX_BRIDGE_STOP] Bridge session found:', {
			bridgeId: bridgeSession?.muxLiveStreamId,
			status: bridgeSession?.status,
			muxStreamKey: bridgeSession?.muxStreamKey
		});

		// Check user permissions
		const hasPermission = await checkStopPermissions(locals.user.uid, bridgeSession);
		if (!hasPermission) {
			console.error('❌ [MUX_BRIDGE_STOP] Insufficient permissions');
			throw error(403, 'Insufficient permissions to stop bridge');
		}

		// Signal end of live stream to Mux (optional - Mux handles automatically)
		const stopResult = await stopMuxLiveStream(bridgeSession);

		// Update bridge session status
		const updateData: any = {
			status: 'completed',
			completedAt: new Date().toISOString()
		};

		if (!stopResult.success) {
			console.warn('⚠️ [MUX_BRIDGE_STOP] Mux stop signal failed, but marking as completed');
			updateData.error = stopResult.error;
		}

		await adminDb.collection('mux_bridges').doc(streamId).update(updateData);

		// No server load management needed with Mux

		// Get final recording information from Mux
		const finalRecording = await getFinalMuxRecordingInfo(bridgeSession);

		// Log stop event
		console.log('📝 [MUX_BRIDGE_STOP] Bridge stopped:', {
			bridgeId: bridgeSession?.muxLiveStreamId,
			stoppedBy: locals.user.uid,
			finalRecording,
			muxResponse: stopResult
		});

		console.log('✅ [MUX_BRIDGE_STOP] Bridge stopped successfully:', bridgeSession?.muxLiveStreamId);

		const response: any = {
			success: true,
			bridgeId: bridgeSession?.muxLiveStreamId,
			stoppedAt: new Date().toISOString()
		};

		if (finalRecording) {
			response.finalRecording = finalRecording;
		}

		return json(response);

	} catch (err) {
		console.error('❌ [MUX_BRIDGE_STOP] Error stopping bridge:', err);

		if (err instanceof Error && 'status' in err) {
			throw err;
		}

		throw error(500, 'Failed to stop bridge');
	}
};

/**
 * Check if user has permission to stop bridge
 */
async function checkStopPermissions(userId: string, bridgeSession: any): Promise<boolean> {
	try {
		// Get user data
		const userDoc = await adminDb.collection('users').doc(userId).get();
		const user = userDoc.data();

		// Admins can always stop bridges
		if (user?.role === 'admin') {
			return true;
		}

		// User who started the bridge can stop it
		if (bridgeSession?.createdBy === userId) {
			return true;
		}

		// Funeral directors can stop bridges
		if (user?.role === 'funeral_director') {
			return true;
		}

		// Memorial owners can stop bridges for their memorials
		const streamDoc = await adminDb.collection('streams').doc(bridgeSession?.streamId).get();
		const stream = streamDoc.data();
		
		if (stream?.memorialId) {
			const memorialDoc = await adminDb.collection('memorials').doc(stream.memorialId).get();
			const memorial = memorialDoc.data();
			
			if (memorial?.createdBy === userId) {
				return true;
			}
		}

		return false;
	} catch (error) {
		console.error('❌ [MUX_BRIDGE_STOP] Error checking permissions:', error);
		return false;
	}
}

/**
 * Signal end of live stream to Mux
 */
async function stopMuxLiveStream(bridgeSession: any) {
	try {
		if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
			return {
				success: false,
				error: 'Mux credentials not configured'
			};
		}

		console.log('🛑 [MUX_BRIDGE_STOP] Signaling end of live stream to Mux...');

		// Signal completion to Mux (optional - streams auto-complete on disconnect)
		const response = await fetch(`https://api.mux.com/video/v1/live-streams/${bridgeSession.muxLiveStreamId}/complete`, {
			method: 'PUT',
			headers: {
				'Authorization': 'Basic ' + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)
			},
			signal: AbortSignal.timeout(10000) // 10 second timeout
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.warn('⚠️ [MUX_BRIDGE_STOP] Mux complete signal failed:', response.status, errorText);
			// This is not critical - streams will complete automatically
			return {
				success: false,
				error: `Mux API responded with ${response.status}: ${errorText}`
			};
		}

		return {
			success: true,
			data: 'Stream completion signaled to Mux'
		};

	} catch (error) {
		console.error('❌ [MUX_BRIDGE_STOP] Error communicating with Mux:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown Mux error'
		};
	}
}

/**
 * Get final recording information from Mux
 */
async function getFinalMuxRecordingInfo(bridgeSession: any) {
	try {
		// Check if we have asset information
		if (bridgeSession?.muxAssetId) {
			// Get asset details from Mux
			const response = await fetch(`https://api.mux.com/video/v1/assets/${bridgeSession.muxAssetId}`, {
				headers: {
					'Authorization': 'Basic ' + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)
				}
			});

			if (response.ok) {
				const assetData = await response.json();
				const asset = assetData.data;

				return {
					recordingId: asset.id,
					duration: asset.duration || 0,
					fileSize: 0, // Mux doesn't provide file size
					downloadUrl: asset.playback_ids?.[0]?.id ? 
						`https://stream.mux.com/${asset.playback_ids[0].id}.mp4` : null,
					status: asset.status
				};
			}
		}

		// No recording available yet - may still be processing
		return {
			recordingId: null,
			duration: 0,
			fileSize: 0,
			downloadUrl: null,
			status: 'processing'
		};

	} catch (error) {
		console.error('❌ [MUX_BRIDGE_STOP] Error getting final recording info:', error);
		return null;
	}
}
