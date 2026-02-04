import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateId } from '$lib/utils/id';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return redirect(302, '/demo/lucia/login');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			return redirect(302, '/demo/lucia/login');
		}

		const formData = await request.formData();
		
		// Basic info
		const title = formData.get('title') as string;
		const dataSourceUrl = formData.get('dataSourceUrl') as string;
		const dataSourceType = (formData.get('dataSourceType') as string) || 'google_sheets';
		const columnMapping = formData.get('columnMapping') as string;
		
		// Timeline style
		const timelineStyle = (formData.get('timelineStyle') as string) || 'line';
		
		// Line timeline options
		const colorTheme = (formData.get('colorTheme') as string) || 'default';
		const defaultZoomLevel = (formData.get('defaultZoomLevel') as string) || 'month';
		const masterTimelineHeight = parseInt(formData.get('masterTimelineHeight') as string) || 120;
		const zoomTimelineHeight = parseInt(formData.get('zoomTimelineHeight') as string) || 400;
		
		// Calendar timeline options
		const calendarGranularity = (formData.get('calendarGranularity') as string) || 'month';
		const colorMode = (formData.get('colorMode') as string) || 'binary';
		const eventColor = (formData.get('eventColor') as string) || '#3B82F6';
		const showLegend = formData.get('showLegend') === 'true';
		
		// Date range filter
		const dateRangeStartStr = formData.get('dateRangeStart') as string;
		const dateRangeEndStr = formData.get('dateRangeEnd') as string;
		const dateRangeStart = dateRangeStartStr ? new Date(dateRangeStartStr) : null;
		const dateRangeEnd = dateRangeEndStr ? new Date(dateRangeEndStr) : null;

		if (!title || title.trim().length === 0) {
			return fail(400, { error: 'Title is required', title, dataSourceUrl });
		}

		if (!dataSourceUrl || dataSourceUrl.trim().length === 0) {
			return fail(400, { error: 'Data source URL is required', title, dataSourceUrl });
		}

		const projectId = generateId();
		const settingsId = generateId();
		const now = new Date();

		try {
			await db.insert(table.project).values({
				id: projectId,
				userId: locals.user.id,
				title: title.trim(),
				dataSourceUrl: dataSourceUrl || null,
				dataSourceType,
				createdAt: now,
				updatedAt: now
			});

			await db.insert(table.projectSettings).values({
				id: settingsId,
				projectId,
				colorTheme,
				defaultZoomLevel,
				masterTimelineHeight,
				zoomTimelineHeight,
				timelineStyle,
				calendarGranularity,
				colorMode,
				eventColor,
				showLegend,
				dateRangeStart,
				dateRangeEnd,
				columnMapping
			});
		} catch (err) {
			console.error('Failed to create project:', err);
			return fail(500, { error: 'Failed to create project', title, dataSourceUrl });
		}

		return redirect(302, `/projects/${projectId}`);
	}
};
