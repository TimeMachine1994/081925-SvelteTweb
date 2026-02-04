import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '$lib/utils/id';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const [project] = await db
		.select()
		.from(table.project)
		.where(eq(table.project.id, params.id));

	if (!project) {
		throw error(404, 'Project not found');
	}

	const [layout] = await db
		.select()
		.from(table.printLayout)
		.where(eq(table.printLayout.projectId, params.id));

	if (!layout) {
		return json({ layout: null });
	}

	return json({
		layout: {
			...layout,
			layoutData: layout.layoutData ? JSON.parse(layout.layoutData) : null
		}
	});
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const [project] = await db
		.select()
		.from(table.project)
		.where(eq(table.project.id, params.id));

	if (!project) {
		throw error(404, 'Project not found');
	}

	const body = await request.json();
	const { layoutData } = body;

	const [existing] = await db
		.select()
		.from(table.printLayout)
		.where(eq(table.printLayout.projectId, params.id));

	if (existing) {
		await db
			.update(table.printLayout)
			.set({
				layoutData: JSON.stringify(layoutData),
				updatedAt: new Date()
			})
			.where(eq(table.printLayout.projectId, params.id));
	} else {
		await db.insert(table.printLayout).values({
			id: generateId(),
			projectId: params.id,
			layoutData: JSON.stringify(layoutData),
			updatedAt: new Date()
		});
	}

	return json({ success: true });
};
