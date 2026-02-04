import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
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

	const [settings] = await db
		.select()
		.from(table.projectSettings)
		.where(eq(table.projectSettings.projectId, params.id));

	return json({ project, settings });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const [existing] = await db
		.select()
		.from(table.project)
		.where(eq(table.project.id, params.id));

	if (!existing) {
		throw error(404, 'Project not found');
	}

	const body = await request.json();
	const { title, dataSourceUrl, dataSourceType, settings } = body;

	await db
		.update(table.project)
		.set({
			...(title && { title }),
			...(dataSourceUrl !== undefined && { dataSourceUrl }),
			...(dataSourceType && { dataSourceType }),
			updatedAt: new Date()
		})
		.where(eq(table.project.id, params.id));

	if (settings) {
		await db
			.update(table.projectSettings)
			.set({
				...(settings.colorTheme && { colorTheme: settings.colorTheme }),
				...(settings.defaultZoomLevel && { defaultZoomLevel: settings.defaultZoomLevel }),
				...(settings.labelConfig && { labelConfig: JSON.stringify(settings.labelConfig) }),
				...(settings.masterTimelineHeight && {
					masterTimelineHeight: settings.masterTimelineHeight
				}),
				...(settings.zoomTimelineHeight && { zoomTimelineHeight: settings.zoomTimelineHeight }),
				...(settings.timelineStyle && { timelineStyle: settings.timelineStyle }),
				...(settings.calendarGranularity && { calendarGranularity: settings.calendarGranularity }),
				...(settings.colorMode && { colorMode: settings.colorMode }),
				...(settings.eventColor && { eventColor: settings.eventColor }),
				...(settings.showLegend !== undefined && { showLegend: settings.showLegend }),
				...(settings.columnMapping && { columnMapping: settings.columnMapping })
			})
			.where(eq(table.projectSettings.projectId, params.id));
	}

	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const [existing] = await db
		.select()
		.from(table.project)
		.where(eq(table.project.id, params.id));

	if (!existing) {
		throw error(404, 'Project not found');
	}

	await db.delete(table.project).where(eq(table.project.id, params.id));

	return json({ success: true });
};
