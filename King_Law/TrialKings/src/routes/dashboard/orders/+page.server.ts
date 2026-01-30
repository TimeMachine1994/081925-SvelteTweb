import type { PageServerLoad } from './$types';
import { getUserOrders } from '$lib/server/stripe';

export const load: PageServerLoad = async ({ locals }) => {
	const orders = await getUserOrders(locals.user!.id);

	return {
		orders
	};
};
