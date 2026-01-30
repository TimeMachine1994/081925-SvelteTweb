import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateId } from '$lib/server/auth';
import { eq } from 'drizzle-orm';

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

const PRICE_PER_PRINT_CENTS = 500; // $5.00 per print

export interface CartItem {
	fileId: string;
	quantity: number;
}

export async function createCheckoutSession(
	userId: string,
	userEmail: string,
	items: CartItem[],
	successUrl: string,
	cancelUrl: string
): Promise<{ sessionId: string; url: string } | null> {
	if (!stripe) {
		console.log('[DEV] Stripe checkout for:', userEmail, items);
		return null;
	}

	// Get file details for line items
	const files = await db.select().from(table.file).where(eq(table.file.userId, userId));
	const fileMap = new Map(files.map((f) => [f.id, f]));

	const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items
		.filter((item) => fileMap.has(item.fileId))
		.map((item) => {
			const file = fileMap.get(item.fileId)!;
			return {
				price_data: {
					currency: 'usd',
					product_data: {
						name: `Print: ${file.originalName}`,
						description: `Quantity: ${item.quantity}`
					},
					unit_amount: PRICE_PER_PRINT_CENTS
				},
				quantity: item.quantity
			};
		});

	if (lineItems.length === 0) {
		return null;
	}

	const totalAmount = items.reduce((sum, item) => sum + item.quantity * PRICE_PER_PRINT_CENTS, 0);

	// Create order record
	const orderId = generateId();
	await db.insert(table.printOrder).values({
		id: orderId,
		userId,
		status: 'pending',
		totalAmount,
		createdAt: new Date()
	});

	// Create order items
	for (const item of items) {
		if (fileMap.has(item.fileId)) {
			await db.insert(table.printOrderItem).values({
				id: generateId(),
				orderId,
				fileId: item.fileId,
				quantity: item.quantity,
				pricePerUnit: PRICE_PER_PRINT_CENTS
			});
		}
	}

	const session = await stripe.checkout.sessions.create({
		mode: 'payment',
		customer_email: userEmail,
		line_items: lineItems,
		success_url: `${successUrl}?order_id=${orderId}`,
		cancel_url: cancelUrl,
		metadata: {
			orderId,
			userId
		}
	});

	// Update order with stripe session ID
	await db
		.update(table.printOrder)
		.set({ stripeSessionId: session.id })
		.where(eq(table.printOrder.id, orderId));

	return {
		sessionId: session.id,
		url: session.url!
	};
}

export async function handleStripeWebhook(
	payload: string,
	signature: string
): Promise<{ success: boolean; orderId?: string }> {
	if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
		return { success: false };
	}

	try {
		const event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);

		if (event.type === 'checkout.session.completed') {
			const session = event.data.object as Stripe.Checkout.Session;
			const orderId = session.metadata?.orderId;

			if (orderId) {
				await db
					.update(table.printOrder)
					.set({ status: 'paid' })
					.where(eq(table.printOrder.id, orderId));

				return { success: true, orderId };
			}
		}

		return { success: true };
	} catch {
		return { success: false };
	}
}

export async function getUserOrders(userId: string) {
	return await db
		.select()
		.from(table.printOrder)
		.where(eq(table.printOrder.userId, userId))
		.orderBy(table.printOrder.createdAt);
}

export async function getOrderWithItems(orderId: string, userId: string) {
	const [order] = await db
		.select()
		.from(table.printOrder)
		.where(eq(table.printOrder.id, orderId));

	if (!order || order.userId !== userId) {
		return null;
	}

	const items = await db
		.select({
			item: table.printOrderItem,
			file: table.file
		})
		.from(table.printOrderItem)
		.leftJoin(table.file, eq(table.printOrderItem.fileId, table.file.id))
		.where(eq(table.printOrderItem.orderId, orderId));

	return { order, items };
}
