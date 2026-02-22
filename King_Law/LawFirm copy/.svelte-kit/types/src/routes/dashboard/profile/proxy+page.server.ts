// @ts-nocheck
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const rows = await db
		.select({
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
		})
		.from(userTable)
		.where(eq(userTable.id, locals.user.id))
		.limit(1);

	return {
		profile: rows[0] ?? null,
		squareLocationId: env.SQUARE_LOCATION_ID ?? null
	};
};
