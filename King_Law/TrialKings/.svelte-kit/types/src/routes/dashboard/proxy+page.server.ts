// @ts-nocheck
import type { PageServerLoad } from './$types';
import { getUserFiles } from '$lib/server/files';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
	const files = await getUserFiles(locals.user!.id);

	return {
		files
	};
};
