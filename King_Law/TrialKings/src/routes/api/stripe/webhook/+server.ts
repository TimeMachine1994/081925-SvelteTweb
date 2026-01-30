import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { handleStripeWebhook } from '$lib/server/stripe';
import { sendOrderConfirmation } from '$lib/server/email';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import * as table from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request }) => {
	const payload = await request.text();
	const signature = request.headers.get('stripe-signature') || '';

	const result = await handleStripeWebhook(payload, signature);

	if (!result.success) {
		return json({ error: 'Webhook failed' }, { status: 400 });
	}

	if (result.orderId) {
		// Get order and user to send confirmation email
		const [order] = await db
			.select()
			.from(table.printOrder)
			.where(eq(table.printOrder.id, result.orderId));

		if (order) {
			const [user] = await db
				.select()
				.from(table.user)
				.where(eq(table.user.id, order.userId));

			if (user) {
				await sendOrderConfirmation(user.email, order.id, order.totalAmount);
			}
		}
	}

	return json({ received: true });
};
