import { json, error } from '@sveltejs/kit';
import { createEmbed, deleteEmbed, updateEmbed } from '$lib/server/db/repos/memorialEmbeds';
import type { RequestHandler } from './$types';

// Helper function to check for admin privileges
function requireAdmin(locals: App.Locals) {
	if (!locals.user?.admin) {
		throw error(403, 'Permission denied. You must be an admin to perform this action.');
	}
}

export const POST: RequestHandler = async ({ locals, params, request }) => {
	console.log('POST /api/memorials/[memorialId]/embeds called POST 🚀');
	requireAdmin(locals);

	const { memorialId } = params;
	const { title, type, embedUrl } = await request.json();

	if (!title || !type || !embedUrl) {
		throw error(400, 'Missing required fields: title, type, and embedUrl are required.');
	}

	try {
		const newEmbed = await createEmbed(memorialId, { title, type, embedUrl });
		return json(newEmbed, { status: 201 });
	} catch (err) {
		console.error('Error creating embed:', err);
		throw error(500, 'Failed to create embed.');
	}
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	console.log('PUT /api/memorials/[memorialId]/embeds called PUT 🚀');
	requireAdmin(locals);

	const { memorialId } = params;
	const { embedId, data } = await request.json();

	if (!embedId || !data) {
		throw error(400, 'Missing required fields: embedId and data are required.');
	}

	try {
		const updatedEmbed = await updateEmbed(memorialId, embedId, data);
		return json(updatedEmbed);
	} catch (err) {
		console.error('Error updating embed:', err);
		throw error(500, 'Failed to update embed.');
	}
};

export const DELETE: RequestHandler = async ({ locals, params, request }) => {
	console.log('DELETE /api/memorials/[memorialId]/embeds called DELETE 🚀');
	requireAdmin(locals);

	const { memorialId } = params;
	const { embedId } = await request.json();

	if (!embedId) {
		throw error(400, 'Missing required field: embedId is required.');
	}

	try {
		await deleteEmbed(memorialId, embedId);
		return json({ success: true }, { status: 200 });
	} catch (err) {
		console.error('Error deleting embed:', err);
		throw error(500, 'Failed to delete embed.');
	}
};
