import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const accessToken = env.SQUARE_ACCESS_TOKEN;
	if (!accessToken) {
		throw error(500, 'SQUARE_ACCESS_TOKEN is not configured');
	}

	const squareCardId = locals.user.squareCardId;
	if (!squareCardId) {
		throw error(400, 'No card on file to remove');
	}

	const baseUrl = accessToken.startsWith('EAAAl')
		? 'https://connect.squareupsandbox.com'
		: 'https://connect.squareup.com';

	try {
		// Disable the card in Square
		const disableRes = await fetch(`${baseUrl}/v2/cards/${squareCardId}/disable`, {
			method: 'POST',
			headers: {
				'Square-Version': '2024-12-18',
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			}
		});

		if (!disableRes.ok) {
			const data = await disableRes.json();
			console.error('Square disable card error:', JSON.stringify(data, null, 2));
			// Continue even if Square fails — still clear from our DB
		}

		// Clear card fields in DB (keep squareCustomerId for future use)
		const result = await db
			.update(userTable)
			.set({
				squareCardId: null,
				cardLastFour: null,
				cardBrand: null,
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
		console.error('Remove card error:', err);
		throw error(500, 'Failed to remove payment method');
	}
};
