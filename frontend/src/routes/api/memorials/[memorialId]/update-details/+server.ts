import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminDb } from '$lib/server/firebase';

export const PUT: RequestHandler = async ({ locals, request, params }) => {
	console.log('Memorial details update request received 📝');

	try {
		// Verify user authentication
		if (!locals.user) {
			console.error('🚫 User is not authenticated');
			error(401, 'Unauthorized: Please log in to update memorial details.');
		}

		const { memorialId } = params;
		if (!memorialId) {
			console.error('🚫 Memorial ID is missing from parameters');
			error(400, 'Bad Request: Memorial ID is required.');
		}

		// Get the memorial document to verify ownership
		const memorialRef = getAdminDb().collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			console.error(`🚫 Memorial ${memorialId} not found`);
			error(404, 'Memorial not found.');
		}

		const memorialData = memorialDoc.data();

		// Check if user is authorized to update this memorial
		// User must be the owner (creatorUid) or have admin privileges
		const isOwner = memorialData?.creatorUid === locals.user.uid || memorialData?.userId === locals.user.uid;
		const isAdmin = locals.user.admin === true;
		
		if (!isOwner && !isAdmin) {
			console.error(`🚫 User ${locals.user.uid} is not authorized to update memorial ${memorialId}`);
			error(403, 'Forbidden: You do not have permission to update this memorial.');
		}

		// Parse request body
		const body = await request.json();

		// Validate and sanitize input data
		const allowedFields = [
			'memorialDate',
			'memorialTime',
			'memorialLocationName',
			'memorialLocationAddress',
			'website',
			'livestreamUrl',
			'livestreamDate',
			'livestreamTime'
		];

		const updateData: Record<string, any> = {};

		// Only include allowed fields that are present in the request
		for (const field of allowedFields) {
			if (body[field] !== undefined) {
				// Validate field types
				switch (field) {
					case 'memorialDate':
					case 'livestreamDate':
						// Validate date format (YYYY-MM-DD)
						if (body[field] && !/^\d{4}-\d{2}-\d{2}$/.test(body[field])) {
							return json({ error: `Invalid date format for ${field}` }, { status: 400 });
						}
						updateData[field] = body[field];
						break;
					
					case 'memorialTime':
					case 'livestreamTime':
						// Validate time format (HH:MM)
						if (body[field] && !/^\d{2}:\d{2}$/.test(body[field])) {
							return json({ error: `Invalid time format for ${field}` }, { status: 400 });
						}
						updateData[field] = body[field];
						break;
					
					case 'memorialLocationName':
					case 'memorialLocationAddress':
					case 'website':
					case 'livestreamUrl':
						// Ensure these are strings
						if (body[field] !== null && typeof body[field] !== 'string') {
							return json({ error: `Invalid type for ${field}` }, { status: 400 });
						}
						updateData[field] = body[field];
						break;
					
					default:
						updateData[field] = body[field];
				}
			}
		}

		// Add metadata
		updateData.lastUpdated = new Date().toISOString();
		updateData.updatedBy = locals.user.uid;

		// Update the memorial document
		console.log(`Updating memorial ${memorialId} with data:`, updateData);
		await memorialRef.update(updateData);

		// Fetch the updated document
		const updatedDoc = await memorialRef.get();
		const updatedData = updatedDoc.data();

		console.log(`✅ Successfully updated memorial ${memorialId}`);
		
		return json({
			success: true,
			memorial: {
				id: memorialId,
				...updatedData
			}
		});

	} catch (e) {
		console.error('🔥 Error updating memorial details:', e);
		error(500, 'Internal Server Error: Failed to update memorial details.');
	}
};