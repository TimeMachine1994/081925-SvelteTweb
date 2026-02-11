// @ts-nocheck
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { generateId } from '$lib/utils/id';
import type { PageServerLoad, Actions } from './$types';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
	if (!locals.user) {
		return redirect(302, '/demo/lucia/login');
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
		.where(eq(table.project.userId, locals.user.id))
		.orderBy(desc(table.project.updatedAt));

	return { projects, user: locals.user };
};

export const actions = {
	create: async ({ locals }: import('./$types').RequestEvent) => {
		if (!locals.user) {
			return redirect(302, '/demo/lucia/login');
		}

		const projectId = generateId();
		const settingsId = generateId();
		const now = new Date();

		await db.insert(table.project).values({
			id: projectId,
			userId: locals.user.id,
			title: 'Untitled Timeline',
			dataSourceUrl: null,
			dataSourceType: 'google_sheets',
			createdAt: now,
			updatedAt: now
		});

		await db.insert(table.projectSettings).values({
			id: settingsId,
			projectId
		});

		throw redirect(302, `/projects/${projectId}`);
	},

	delete: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) {
			return redirect(302, '/demo/lucia/login');
		}

		const formData = await request.formData();
		const projectId = formData.get('projectId') as string;

		if (!projectId) {
			return fail(400, { error: 'Project ID is required' });
		}

		// Manually delete child rows (libsql doesn't enforce FK cascades by default)
		await db.delete(table.printLayout).where(eq(table.printLayout.projectId, projectId));
		await db.delete(table.cachedEvents).where(eq(table.cachedEvents.projectId, projectId));
		await db.delete(table.projectSettings).where(eq(table.projectSettings.projectId, projectId));
		await db.delete(table.project).where(eq(table.project.id, projectId));

		return { success: true };
	}
};
;null as any as Actions;