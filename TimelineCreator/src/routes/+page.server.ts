import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
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

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		if (!locals.user) {
			return redirect(302, '/demo/lucia/login');
		}

		const formData = await request.formData();
		const projectId = formData.get('projectId') as string;

		if (!projectId) {
			return { success: false, error: 'Project ID is required' };
		}

		await db.delete(table.project).where(eq(table.project.id, projectId));

		return { success: true };
	}
};
