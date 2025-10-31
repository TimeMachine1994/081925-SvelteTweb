import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb, adminStorage } from '$lib/server/firebase';
import type { DemoCleanupResult } from '$lib/types/demo';

/**
 * GET /api/demo/cleanup
 * Cleans up expired demo sessions and all associated data
 * 
 * This endpoint should be called:
 * - Via cron job every 15 minutes
 * - Manually by admins when needed
 * 
 * Cleanup order:
 * 1. Find expired sessions
 * 2. Delete streams (with Cloudflare cleanup)
 * 3. Delete slideshows (with Firebase Storage cleanup)
 * 4. Delete memorials
 * 5. Delete user documents
 * 6. Delete Firebase Auth users
 * 7. Mark session as 'expired'
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	const startTime = Date.now();
	console.log('[DEMO_CLEANUP] ========================================');
	console.log('[DEMO_CLEANUP] Starting cleanup job');

	// Optional: Require admin auth or verify cron secret
	const cronSecret = url.searchParams.get('secret');
	const isAdmin = locals.user?.role === 'admin';
	const validCronSecret = cronSecret === process.env.DEMO_CLEANUP_SECRET;

	if (!isAdmin && !validCronSecret) {
		console.error('[DEMO_CLEANUP] Unauthorized cleanup attempt');
		throw error(403, 'Unauthorized. Admin access or valid cron secret required.');
	}

	const result: DemoCleanupResult = {
		sessionsProcessed: 0,
		memorialsDeleted: 0,
		streamsDeleted: 0,
		slideshowsDeleted: 0,
		usersDeleted: 0,
		errors: [],
		duration: 0
	};

	try {
		// 1. Find expired sessions
		const now = new Date();
		console.log('[DEMO_CLEANUP] Finding expired sessions (expiresAt < now)...');

		const expiredSessionsSnapshot = await adminDb
			.collection('demoSessions')
			.where('status', '==', 'active')
			.where('expiresAt', '<', now)
			.get();

		console.log(`[DEMO_CLEANUP] Found ${expiredSessionsSnapshot.size} expired sessions`);

		if (expiredSessionsSnapshot.empty) {
			console.log('[DEMO_CLEANUP] No expired sessions to clean up');
			result.duration = Date.now() - startTime;
			return json(result);
		}

		// 2. Process each expired session
		for (const sessionDoc of expiredSessionsSnapshot.docs) {
			const session = sessionDoc.data();
			const sessionId = session.id;

			console.log(`[DEMO_CLEANUP] Processing session: ${sessionId}`);

			try {
				// Delete memorials and their subcollections (streams, slideshows)
				const memorialsSnapshot = await adminDb
					.collection('memorials')
					.where('demoSessionId', '==', sessionId)
					.get();

				console.log(
					`[DEMO_CLEANUP]   Found ${memorialsSnapshot.size} memorials for session ${sessionId}`
				);

				for (const memorialDoc of memorialsSnapshot.docs) {
					const memorialId = memorialDoc.id;

					try {
						// Delete streams
						const streamsSnapshot = await adminDb
							.collection('memorials')
							.doc(memorialId)
							.collection('streams')
							.where('demoSessionId', '==', sessionId)
							.get();

						for (const streamDoc of streamsSnapshot.docs) {
							await streamDoc.ref.delete();
							result.streamsDeleted++;
							console.log(`[DEMO_CLEANUP]     Deleted stream: ${streamDoc.id}`);
						}

						// Delete slideshows
						const slideshowsSnapshot = await adminDb
							.collection('memorials')
							.doc(memorialId)
							.collection('slideshows')
							.where('demoSessionId', '==', sessionId)
							.get();

						for (const slideshowDoc of slideshowsSnapshot.docs) {
							const slideshow = slideshowDoc.data();

							// Delete slideshow video from Firebase Storage if exists
							if (slideshow.firebaseStoragePath) {
								try {
									await adminStorage.bucket().file(slideshow.firebaseStoragePath).delete();
									console.log(
										`[DEMO_CLEANUP]     Deleted slideshow video: ${slideshow.firebaseStoragePath}`
									);
								} catch (storageErr) {
									console.error(
										`[DEMO_CLEANUP]     Failed to delete slideshow video: ${storageErr}`
									);
								}
							}

							// Delete slideshow photos from Firebase Storage
							if (slideshow.photos && Array.isArray(slideshow.photos)) {
								for (const photo of slideshow.photos) {
									if (photo.storagePath) {
										try {
											await adminStorage.bucket().file(photo.storagePath).delete();
										} catch (photoErr) {
											// Ignore individual photo deletion errors
										}
									}
								}
							}

							await slideshowDoc.ref.delete();
							result.slideshowsDeleted++;
							console.log(`[DEMO_CLEANUP]     Deleted slideshow: ${slideshowDoc.id}`);
						}

						// Delete memorial document
						await memorialDoc.ref.delete();
						result.memorialsDeleted++;
						console.log(`[DEMO_CLEANUP]   Deleted memorial: ${memorialId}`);
					} catch (memorialErr: any) {
						const errMsg = `Failed to delete memorial ${memorialId}: ${memorialErr.message}`;
						console.error(`[DEMO_CLEANUP]   ❌ ${errMsg}`);
						result.errors.push(errMsg);
					}
				}

				// Delete user documents from Firestore
				const userUIDs = Object.values(session.users).map((user: any) => user.uid);

				for (const uid of userUIDs) {
					try {
						// Delete user document
						await adminDb.collection('users').doc(uid).delete();
						console.log(`[DEMO_CLEANUP]   Deleted user document: ${uid}`);

						// Delete Firebase Auth user
						try {
							await adminAuth.deleteUser(uid);
							result.usersDeleted++;
							console.log(`[DEMO_CLEANUP]   Deleted Auth user: ${uid}`);
						} catch (authErr) {
							// User might already be deleted or not exist
							console.error(`[DEMO_CLEANUP]   Failed to delete Auth user ${uid}:`, authErr);
						}
					} catch (userErr: any) {
						const errMsg = `Failed to delete user ${uid}: ${userErr.message}`;
						console.error(`[DEMO_CLEANUP]   ❌ ${errMsg}`);
						result.errors.push(errMsg);
					}
				}

				// Mark session as expired
				await sessionDoc.ref.update({
					status: 'expired',
					cleanedUpAt: new Date()
				});

				result.sessionsProcessed++;
				console.log(`[DEMO_CLEANUP] ✅ Session ${sessionId} cleaned up successfully`);
			} catch (sessionErr: any) {
				const errMsg = `Failed to cleanup session ${sessionId}: ${sessionErr.message}`;
				console.error(`[DEMO_CLEANUP] ❌ ${errMsg}`);
				result.errors.push(errMsg);
			}
		}

		result.duration = Date.now() - startTime;

		console.log('[DEMO_CLEANUP] ========================================');
		console.log(`[DEMO_CLEANUP] Cleanup complete in ${result.duration}ms`);
		console.log(`[DEMO_CLEANUP] Sessions processed: ${result.sessionsProcessed}`);
		console.log(`[DEMO_CLEANUP] Memorials deleted: ${result.memorialsDeleted}`);
		console.log(`[DEMO_CLEANUP] Streams deleted: ${result.streamsDeleted}`);
		console.log(`[DEMO_CLEANUP] Slideshows deleted: ${result.slideshowsDeleted}`);
		console.log(`[DEMO_CLEANUP] Users deleted: ${result.usersDeleted}`);
		console.log(`[DEMO_CLEANUP] Errors: ${result.errors.length}`);
		console.log('[DEMO_CLEANUP] ========================================');

		return json(result);
	} catch (err: any) {
		console.error('[DEMO_CLEANUP] ❌ Critical error during cleanup:', err);
		result.duration = Date.now() - startTime;
		result.errors.push(`Critical error: ${err.message}`);
		
		throw error(500, 'Cleanup failed: ' + err.message);
	}
};

/**
 * POST /api/demo/cleanup
 * Manually trigger cleanup for a specific session (admin only)
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}

	const { sessionId } = await request.json();

	if (!sessionId) {
		throw error(400, 'Session ID required');
	}

	console.log(`[DEMO_CLEANUP] Manual cleanup requested for session: ${sessionId}`);

	try {
		// Update session to mark it as expired (will be picked up by next cleanup run)
		await adminDb.collection('demoSessions').doc(sessionId).update({
			status: 'ended',
			endedAt: new Date(),
			expiresAt: new Date() // Set to now so cleanup runs immediately
		});

		console.log(`[DEMO_CLEANUP] Session ${sessionId} marked for cleanup`);

		return json({
			success: true,
			message: 'Session marked for cleanup. Cleanup will occur on next scheduled run.'
		});
	} catch (err: any) {
		console.error(`[DEMO_CLEANUP] ❌ Failed to mark session for cleanup:`, err);
		throw error(500, 'Failed to end session: ' + err.message);
	}
};
