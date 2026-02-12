import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

function getSquareBaseUrl(accessToken: string): string {
	return accessToken.startsWith('EAAAl')
		? 'https://connect.squareupsandbox.com'
		: 'https://connect.squareup.com';
}

function squareHeaders(accessToken: string) {
	return {
		'Square-Version': '2024-12-18',
		Authorization: `Bearer ${accessToken}`,
		'Content-Type': 'application/json'
	};
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const accessToken = env.SQUARE_ACCESS_TOKEN;
	if (!accessToken) {
		throw error(500, 'SQUARE_ACCESS_TOKEN is not configured');
	}

	const baseUrl = getSquareBaseUrl(accessToken);
	const headers = squareHeaders(accessToken);

	const { sourceId } = await request.json();
	if (!sourceId) {
		throw error(400, 'sourceId (card nonce) is required');
	}

	try {
		// 1. Look up existing Square customer or create one
		let squareCustomerId = locals.user.squareCustomerId;

		if (!squareCustomerId) {
			const createCustomerRes = await fetch(`${baseUrl}/v2/customers`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					idempotency_key: crypto.randomUUID(),
					given_name: locals.user.firstName,
					family_name: locals.user.lastName,
					email_address: locals.user.email,
					reference_id: locals.user.id
				})
			});

			const customerData = await createCustomerRes.json();
			if (!createCustomerRes.ok) {
				console.error('Square create customer error:', JSON.stringify(customerData, null, 2));
				throw error(
					502,
					customerData.errors?.[0]?.detail || 'Failed to create Square customer'
				);
			}
			squareCustomerId = customerData.customer.id;
		}

		// 2. Attach card to customer
		const createCardRes = await fetch(`${baseUrl}/v2/cards`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				idempotency_key: crypto.randomUUID(),
				source_id: sourceId,
				card: {
					customer_id: squareCustomerId
				}
			})
		});

		const cardData = await createCardRes.json();
		if (!createCardRes.ok) {
			console.error('Square create card error:', JSON.stringify(cardData, null, 2));
			throw error(502, cardData.errors?.[0]?.detail || 'Failed to save card');
		}

		const card = cardData.card;
		const cardLastFour = card.last_4;
		const cardBrand = card.card_brand; // e.g. "VISA", "MASTERCARD"
		const squareCardId = card.id;

		// 3. Save to DB
		const result = await db
			.update(userTable)
			.set({
				squareCustomerId,
				squareCardId,
				cardLastFour,
				cardBrand,
				updatedAt: Math.floor(Date.now() / 1000)
			})
			.where(eq(userTable.id, locals.user.id))
			.returning({
				id: userTable.id,
				email: userTable.email,
				role: userTable.role,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				phoneNumber: userTable.phoneNumber,
				addressLine1: userTable.addressLine1,
				addressLine2: userTable.addressLine2,
				city: userTable.city,
				state: userTable.state,
				zipCode: userTable.zipCode,
				dateOfBirth: userTable.dateOfBirth,
				preferredContact: userTable.preferredContact,
				emergencyContactName: userTable.emergencyContactName,
				emergencyContactPhone: userTable.emergencyContactPhone,
				squareCustomerId: userTable.squareCustomerId,
				squareCardId: userTable.squareCardId,
				cardLastFour: userTable.cardLastFour,
				cardBrand: userTable.cardBrand
			});

		return json({ success: true, user: result[0] });
	} catch (err: any) {
		if (err?.status && err?.body) throw err;
		console.error('Save card error:', err);
		throw error(500, 'Failed to save payment method');
	}
};
