import { adminAuth, adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Stream } from '$lib/types/stream';
import { deleteLiveInput, isCloudflareConfigured } from '$lib/server/cloudflare-stream';

// PUT - Update stream properties
export const PUT: RequestHandler = async ({ locals, params, request }) => {
	console.log('🎬 [STREAM API] PUT - Updating stream:', params.id);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [STREAM API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const streamId = params.id;

	try {
		// Parse request body
		const updates = await request.json();

		// Fetch and verify stream exists
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [STREAM API] Stream not found:', streamId);
			throw SvelteKitError(404, 'Stream not found');
		}

		const streamData = streamDoc.data() as Stream;

		// Check permissions
		const memorialDoc = await adminDb.collection('memorials').doc(streamData.memorialId).get();
		if (!memorialDoc.exists) {
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;
		const hasPermission =
			locals.user.role === 'admin' ||
			memorial.ownerUid === userId ||
			memorial.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [STREAM API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// Update stream
		const updateData = {
			...updates,
			updatedAt: new Date().toISOString()
		};

		await adminDb.collection('streams').doc(streamId).update(updateData);

		console.log('✅ [STREAM API] Stream updated:', streamId, updates);

		// If scheduledStartTime was updated and stream is linked to calculator, sync back to calculator
		if (updates.scheduledStartTime && streamData.calculatorServiceType) {
			try {
				console.log('🔄 [STREAM API] Syncing stream time change back to calculator...');
				
				// Parse the new date/time
				const newDateTime = new Date(updates.scheduledStartTime);
				const newDate = newDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
				const newTime = newDateTime.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

				// Update the appropriate service in memorial.services directly
				const memorialUpdateData: any = {
					updatedAt: new Date().toISOString()
				};

				if (streamData.calculatorServiceType === 'main') {
					// Update main service
					memorialUpdateData['services.main.time.date'] = newDate;
					memorialUpdateData['services.main.time.time'] = newTime;
				} else if (streamData.calculatorServiceType === 'location' || streamData.calculatorServiceType === 'day') {
					// Update additional service
					const serviceIndex = streamData.calculatorServiceIndex;
					if (serviceIndex !== null && serviceIndex !== undefined) {
						memorialUpdateData[`services.additional.${serviceIndex}.time.date`] = newDate;
						memorialUpdateData[`services.additional.${serviceIndex}.time.time`] = newTime;
					}
				}

				// Update memorial with new calculator data
				await adminDb.collection('memorials').doc(streamData.memorialId).update(memorialUpdateData);

				console.log('✅ [STREAM API] Calculator sync successful:', {
					serviceType: streamData.calculatorServiceType,
					serviceIndex: streamData.calculatorServiceIndex,
					newDate,
					newTime
				});
			} catch (syncError) {
				console.error('❌ [STREAM API] Calculator sync error:', syncError);
				// Don't fail the stream update if sync fails
			}
		}

		return json({
			success: true,
			message: 'Stream updated successfully'
		});
	} catch (error: any) {
		console.error('❌ [STREAM API] Error updating stream:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw SvelteKitError(500, 'Failed to update stream');
	}
};

// DELETE - Delete stream
export const DELETE: RequestHandler = async ({ locals, params }) => {
	console.log('🎬 [STREAM API] DELETE - Deleting stream:', params.id);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [STREAM API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const streamId = params.id;

	try {
		// Fetch and verify stream exists
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [STREAM API] Stream not found:', streamId);
			throw SvelteKitError(404, 'Stream not found');
		}

		const streamData = streamDoc.data() as Stream;

		// Check permissions
		const memorialDoc = await adminDb.collection('memorials').doc(streamData.memorialId).get();
		if (!memorialDoc.exists) {
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;
		const hasPermission =
			locals.user.role === 'admin' ||
			memorial.ownerUid === userId ||
			memorial.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [STREAM API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// Clean up Cloudflare Live Input if it exists
		if (streamData.cloudflareInputId && isCloudflareConfigured()) {
			try {
				console.log(
					'🗑️ [STREAM API] Deleting Cloudflare Live Input:',
					streamData.cloudflareInputId
				);
				await deleteLiveInput(streamData.cloudflareInputId);
				console.log('✅ [STREAM API] Cloudflare Live Input deleted');
			} catch (error) {
				console.error('⚠️ [STREAM API] Failed to delete Cloudflare Live Input:', error);
				// Continue with stream deletion even if Cloudflare cleanup fails
			}
		}

		// Delete stream from database
		await adminDb.collection('streams').doc(streamId).delete();

		console.log('✅ [STREAM API] Stream deleted:', streamId);

		return json({
			success: true,
			message: 'Stream deleted successfully'
		});
	} catch (error: any) {
		console.error('❌ [STREAM API] Error deleting stream:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw SvelteKitError(500, 'Failed to delete stream');
	}
};
