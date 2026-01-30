import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getUserFiles } from '$lib/server/files';
import { createCheckoutSession } from '$lib/server/stripe';
import { env } from '$env/dynamic/private';

const APP_URL = env.PUBLIC_APP_URL || 'http://localhost:5173';

export const load: PageServerLoad = async ({ locals, url }) => {
	const fileIds = url.searchParams.get('files')?.split(',').filter(Boolean) || [];
	const allFiles = await getUserFiles(locals.user!.id);
	
	const selectedFiles = allFiles.filter(f => fileIds.includes(f.id));

	return {
		files: allFiles,
		selectedFileIds: fileIds,
		selectedFiles
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const items: { fileId: string; quantity: number }[] = [];

		for (const [key, value] of formData.entries()) {
			if (key.startsWith('qty_')) {
				const fileId = key.replace('qty_', '');
				const quantity = parseInt(value as string) || 0;
				if (quantity > 0) {
					items.push({ fileId, quantity });
				}
			}
		}

		if (items.length === 0) {
			return { error: 'Please select at least one file with quantity > 0' };
		}

		const result = await createCheckoutSession(
			locals.user!.id,
			locals.user!.email,
			items,
			`${APP_URL}/dashboard/orders`,
			`${APP_URL}/dashboard/checkout`
		);

		if (!result) {
			return { error: 'Failed to create checkout session. Stripe may not be configured.' };
		}

		throw redirect(303, result.url);
	}
};
