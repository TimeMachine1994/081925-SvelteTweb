import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	const { streamId } = params;
	console.log(`🛑 [BRIDGE-STOP] Stop bridge request for stream: ${streamId}`);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [BRIDGE-STOP] Unauthorized request - no user');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if user has permission (admin or funeral director)
	if (locals.user.role !== 'admin' && locals.user.role !== 'funeral_director') {
		console.log(`❌ [BRIDGE-STOP] Insufficient permissions - user role: ${locals.user.role}`);
		return json({ error: 'Insufficient permissions' }, { status: 403 });
	}

	try {
		console.log('🔍 [BRIDGE-STOP] Looking for bridge process...');

		// Get bridge process from global storage
		const bridgeProcesses = global.bridgeProcesses || new Map();
		const bridgeConfig = bridgeProcesses.get(streamId);

		if (!bridgeConfig) {
			console.log(`⚠️ [BRIDGE-STOP] No bridge process found for stream: ${streamId}`);
			return json({
				success: false,
				error: 'No bridge process found for this stream',
				streamId
			}, { status: 404 });
		}

		console.log(`🔍 [BRIDGE-STOP] Found bridge process: ${bridgeConfig.id}`);
		console.log(`🆔 [BRIDGE-STOP] Process PID: ${bridgeConfig.pid}`);

		// Calculate final statistics
		const startTime = new Date(bridgeConfig.startedAt);
		const stopTime = new Date();
		const totalDuration = Math.floor((stopTime.getTime() - startTime.getTime()) / 1000);

		const finalStats = {
			totalDuration,
			totalBytes: Math.floor(totalDuration * 125000), // Estimate ~1Mbps
			averageBitrate: totalDuration > 0 ? Math.floor(totalDuration * 1000 / totalDuration) : 0,
			errors: 0,
			stoppedAt: stopTime.toISOString(),
			startedAt: bridgeConfig.startedAt
		};

		try {
			// Handle different bridge approaches
			if (bridgeConfig.approach === 'cloudflare_worker' && bridgeConfig.workerUrl) {
				console.log('⏹️ [BRIDGE-STOP] Stopping Cloudflare Worker bridge...');
				
				try {
					const workerResponse = await fetch(`${bridgeConfig.workerUrl}/bridge/stop/${streamId}`, {
						method: 'DELETE'
					});
					
					if (workerResponse.ok) {
						const workerData = await workerResponse.json();
						console.log('✅ [BRIDGE-STOP] Worker bridge stopped:', workerData);
						finalStats = workerData.finalStats || finalStats;
					} else {
						console.log(`⚠️ [BRIDGE-STOP] Worker stop failed: ${workerResponse.status}`);
					}
				} catch (workerError) {
					console.log(`⚠️ [BRIDGE-STOP] Worker error: ${(workerError as Error).message}`);
				}
			} else if (bridgeConfig.process && bridgeConfig.pid) {
				console.log('⏹️ [BRIDGE-STOP] Terminating real bridge process gracefully...');
				
				// Send SIGTERM for graceful shutdown
				bridgeConfig.process.kill('SIGTERM');
				
				// Wait for process to exit gracefully
				await new Promise((resolve) => {
					const timeout = setTimeout(() => {
						console.log('⚠️ [BRIDGE-STOP] Graceful shutdown timeout, forcing kill...');
						bridgeConfig.process?.kill('SIGKILL');
						resolve(void 0);
					}, 5000);

					bridgeConfig.process?.on('close', () => {
						clearTimeout(timeout);
						console.log('✅ [BRIDGE-STOP] Bridge process terminated gracefully');
						resolve(void 0);
					});
				});
			}

			// Clean up bridge configuration
			console.log('🧹 [BRIDGE-STOP] Cleaning up bridge resources...');
			bridgeProcesses.delete(streamId);

		} catch (error) {
			console.error(`❌ [BRIDGE-STOP] Error stopping bridge process: ${error.message}`);
			// Still clean up the configuration even if there was an error
			bridgeProcesses.delete(streamId);
		}

		console.log('📊 [BRIDGE-STOP] Final bridge statistics:', finalStats);

		return json({
			success: true,
			message: 'Bridge stopped successfully',
			streamId,
			finalStats
		});

	} catch (error) {
		console.error('❌ [BRIDGE-STOP] Unexpected error:', error);
		return json(
			{ error: 'Internal server error', details: error.message },
			{ status: 500 }
		);
	}
};
