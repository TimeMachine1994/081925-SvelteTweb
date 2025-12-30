import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

// GET - List all projects
export const GET: RequestHandler = async () => {
	try {
		const projects = await db.select().from(project).orderBy(desc(project.updatedAt));
		return json({ projects });
	} catch (err) {
		console.error('Error fetching projects:', err);
		throw error(500, 'Failed to fetch projects');
	}
};

// POST - Create a new project
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { name, description, directoryPath, scanData } = body;

		if (!name || !directoryPath) {
			throw error(400, 'Name and directory path are required');
		}

		const id = crypto.randomUUID();
		const now = new Date();

		await db.insert(project).values({
			id,
			name,
			description: description || null,
			directoryPath,
			scanData: scanData ? JSON.stringify(scanData) : null,
			createdAt: now,
			updatedAt: now
		});

		const [newProject] = await db.select().from(project).where(eq(project.id, id));

		return json({ project: newProject }, { status: 201 });
	} catch (err) {
		if (err instanceof Error && 'status' in err) throw err;
		console.error('Error creating project:', err);
		throw error(500, 'Failed to create project');
	}
};

// DELETE - Delete multiple projects
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { ids } = body;

		if (!ids || !Array.isArray(ids) || ids.length === 0) {
			throw error(400, 'Project IDs are required');
		}

		await db.delete(project).where(inArray(project.id, ids));

		return json({ deleted: ids.length });
	} catch (err) {
		if (err instanceof Error && 'status' in err) throw err;
		console.error('Error deleting projects:', err);
		throw error(500, 'Failed to delete projects');
	}
};
