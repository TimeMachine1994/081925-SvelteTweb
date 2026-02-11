// @ts-nocheck
import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load = async ({ params, locals }: Parameters<PageServerLoad>[0]) => {
	if (!locals.user) {
		return redirect(302, '/demo/lucia/login');
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

	const [cachedEvents] = await db
		.select()
		.from(table.cachedEvents)
		.where(eq(table.cachedEvents.projectId, params.id));

	const [printLayout] = await db
		.select()
		.from(table.printLayout)
		.where(eq(table.printLayout.projectId, params.id));

	let events: { events: unknown[]; errors: string[] } = { events: [], errors: [] };
	if (cachedEvents?.eventData) {
		try {
			events = JSON.parse(cachedEvents.eventData);
		} catch {
			events = { events: [], errors: ['Failed to parse cached events'] };
		}
	}

	return {
		project,
		settings,
		events,
		printLayout: printLayout?.layoutData ? JSON.parse(printLayout.layoutData) : null
	};
};
