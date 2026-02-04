import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateId } from '$lib/utils/id';
import { desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const projects = await db
		.select({
			id: table.project.id,
			title: table.project.title,
			dataSourceUrl: table.project.dataSourceUrl,
			dataSourceType: table.project.dataSourceType,
			createdAt: table.project.createdAt,
			updatedAt: table.project.updatedAt
		})
		.from(table.project)
		.orderBy(desc(table.project.updatedAt));

	return json({ projects });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { title, dataSourceUrl, dataSourceType, settings } = body;

	if (!title || typeof title !== 'string') {
		throw error(400, 'Title is required');
	}

	const projectId = generateId();
	const settingsId = generateId();
	const now = new Date();

	await db.insert(table.project).values({
		id: projectId,
		userId: locals.user.id,
		title,
		dataSourceUrl: dataSourceUrl || null,
		dataSourceType: dataSourceType || 'google_sheets',
		createdAt: now,
		updatedAt: now
	});

	await db.insert(table.projectSettings).values({
		id: settingsId,
		projectId,
		colorTheme: settings?.colorTheme || 'default',
		defaultZoomLevel: settings?.defaultZoomLevel || 'month',
		labelConfig: settings?.labelConfig ? JSON.stringify(settings.labelConfig) : null,
		masterTimelineHeight: settings?.masterTimelineHeight || 120,
		zoomTimelineHeight: settings?.zoomTimelineHeight || 400
	});

	return json({ id: projectId }, { status: 201 });
};
