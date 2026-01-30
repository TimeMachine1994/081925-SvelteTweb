import type { PageServerLoad } from './$types';
import { getUserFiles } from '$lib/server/files';

export const load: PageServerLoad = async ({ locals }) => {
	const files = await getUserFiles(locals.user!.id);

	return {
		files
	};
};
