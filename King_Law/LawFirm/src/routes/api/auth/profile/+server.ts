import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// GET full profile for authenticated user
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
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

	if (rows.length === 0) {
		throw error(404, 'User not found');
	}

	return json({ user: rows[0] });
};

// Allowed fields that the user can update on their own profile
const ALLOWED_FIELDS = [
	'firstName',
	'lastName',
	'phoneNumber',
	'addressLine1',
	'addressLine2',
	'city',
	'state',
	'zipCode',
	'dateOfBirth',
	'preferredContact',
	'emergencyContactName',
	'emergencyContactPhone'
] as const;

// PATCH — update profile fields
export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();

	// Filter to only allowed fields
	const updates: Record<string, string | null> = {};
	for (const key of ALLOWED_FIELDS) {
		if (key in body) {
			const val = body[key];
			updates[key] = typeof val === 'string' && val.trim() !== '' ? val.trim() : null;
		}
	}

	// Validate preferredContact enum
	if ('preferredContact' in updates && updates.preferredContact !== null) {
		if (!['email', 'phone', 'text'].includes(updates.preferredContact)) {
			throw error(400, 'preferredContact must be email, phone, or text');
		}
	}

	// Validate state is 2-letter code
	if ('state' in updates && updates.state !== null) {
		if (!/^[A-Za-z]{2}$/.test(updates.state)) {
			throw error(400, 'State must be a 2-letter code');
		}
		updates.state = updates.state.toUpperCase();
	}

	// Validate ZIP code
	if ('zipCode' in updates && updates.zipCode !== null) {
		if (!/^\d{5}(-\d{4})?$/.test(updates.zipCode)) {
			throw error(400, 'ZIP code must be 5 digits (or 5+4 format)');
		}
	}

	// Validate firstName / lastName not empty
	if ('firstName' in updates && !updates.firstName) {
		throw error(400, 'First name is required');
	}
	if ('lastName' in updates && !updates.lastName) {
		throw error(400, 'Last name is required');
	}

	if (Object.keys(updates).length === 0) {
		throw error(400, 'No valid fields to update');
	}

	try {
		const result = await db
			.update(userTable)
			.set({ ...updates, updatedAt: Math.floor(Date.now() / 1000) })
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

		return json({ user: result[0] });
	} catch (err) {
		console.error('Profile update error:', err);
		throw error(500, 'Failed to update profile');
	}
};
