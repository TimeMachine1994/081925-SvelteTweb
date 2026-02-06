import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '$lib/utils/id';
import { parseCSV, fetchGoogleSheetsCSV, type ColumnMapping } from '$lib/utils/csv-parser';
import type { RequestHandler } from './$types';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const POST: RequestHandler = async ({ params, request, locals }) => {
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
	const { events, errors } = body;

	// Upsert into cached_events
	const [existingCache] = await db
		.select()
		.from(table.cachedEvents)
		.where(eq(table.cachedEvents.projectId, params.id));

	const eventData = JSON.stringify({ events, errors });

	if (existingCache) {
		await db
			.update(table.cachedEvents)
			.set({ eventData, cachedAt: new Date() })
			.where(eq(table.cachedEvents.projectId, params.id));
	} else {
		await db.insert(table.cachedEvents).values({
			id: generateId(),
			projectId: params.id,
			eventData,
			cachedAt: new Date()
		});
	}

	return json({ success: true, count: events.length });
};

export const GET: RequestHandler = async ({ params, url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const forceRefresh = url.searchParams.get('refresh') === 'true';

	const [project] = await db
		.select()
		.from(table.project)
		.where(eq(table.project.id, params.id));

	if (!project) {
		throw error(404, 'Project not found');
	}

	if (!project.dataSourceUrl) {
		return json({ events: [], errors: ['No data source configured'], cached: false });
	}

	// Fetch project settings to get column mapping
	const [settings] = await db
		.select()
		.from(table.projectSettings)
		.where(eq(table.projectSettings.projectId, params.id));

	let columnMapping: ColumnMapping | undefined;
	if (settings?.columnMapping) {
		try {
			columnMapping = JSON.parse(settings.columnMapping);
			console.log('Using saved column mapping:', columnMapping);
		} catch (e) {
			console.error('Failed to parse column mapping:', e);
		}
	}

	// Check cache
	if (!forceRefresh) {
		const [cached] = await db
			.select()
			.from(table.cachedEvents)
			.where(eq(table.cachedEvents.projectId, params.id));

		if (cached && cached.cachedAt) {
			const age = Date.now() - cached.cachedAt.getTime();
			if (age < CACHE_TTL_MS) {
				const eventData = cached.eventData ? JSON.parse(cached.eventData) : { events: [], errors: [] };
				return json({ ...eventData, cached: true, cachedAt: cached.cachedAt });
			}
		}
	}

	// Fetch fresh data
	try {
		const csvText = await fetchGoogleSheetsCSV(project.dataSourceUrl);
		const parsed = parseCSV(csvText, columnMapping);

		// Update cache
		const [existingCache] = await db
			.select()
			.from(table.cachedEvents)
			.where(eq(table.cachedEvents.projectId, params.id));

		if (existingCache) {
			await db
				.update(table.cachedEvents)
				.set({
					eventData: JSON.stringify(parsed),
					cachedAt: new Date()
				})
				.where(eq(table.cachedEvents.projectId, params.id));
		} else {
			await db.insert(table.cachedEvents).values({
				id: generateId(),
				projectId: params.id,
				eventData: JSON.stringify(parsed),
				cachedAt: new Date()
			});
		}

		return json({ ...parsed, cached: false });
	} catch (err) {
		// Try to return cached data if fetch fails
		const [cached] = await db
			.select()
			.from(table.cachedEvents)
			.where(eq(table.cachedEvents.projectId, params.id));

		if (cached && cached.eventData) {
			const eventData = JSON.parse(cached.eventData);
			return json({
				...eventData,
				cached: true,
				cachedAt: cached.cachedAt,
				warning: 'Using cached data - fetch failed: ' + (err instanceof Error ? err.message : 'Unknown error')
			});
		}

		throw error(500, 'Failed to fetch CSV: ' + (err instanceof Error ? err.message : 'Unknown error'));
	}
};
