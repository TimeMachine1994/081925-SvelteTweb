// @ts-nocheck
import type { PageServerLoad } from './$types';
import { getUserOrders } from '$lib/server/stripe';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
	const orders = await getUserOrders(locals.user!.id);

	return {
		orders
	};
};
