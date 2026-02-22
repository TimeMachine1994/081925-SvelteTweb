import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { cases, user } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateId } from '$lib/server/auth';

// GET /api/cases - Get all cases for current user
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	let userCases;

	if (locals.user.role === 'lawyer') {
		userCases = await db
			.select({
				case: cases,
				client: {
					id: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email
				}
			})
			.from(cases)
			.innerJoin(user, eq(cases.clientId, user.id))
			.where(eq(cases.lawyerId, locals.user.id));
	} else if (locals.user.role === 'client') {
		userCases = await db
			.select({
				case: cases,
				lawyer: {
					id: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email
				}
			})
			.from(cases)
			.innerJoin(user, eq(cases.lawyerId, user.id))
			.where(eq(cases.clientId, locals.user.id));
	} else {
		// Admin sees all
		userCases = await db.select().from(cases);
	}

	return json({ cases: userCases });
};

// POST /api/cases - Create a new case (lawyers only)
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		throw error(403, 'Only lawyers can create cases');
	}

	const body = await request.json();
	const { clientId, title, description, status } = body;

	if (!clientId || !title) {
		throw error(400, 'clientId and title are required');
	}

	// Verify client exists and is a client
	const client = await db.query.user.findFirst({
		where: and(eq(user.id, clientId), eq(user.role, 'client'))
	});

	if (!client) {
		throw error(404, 'Client not found');
	}

	const caseId = generateId();
	const now = new Date();

	await db.insert(cases).values({
		id: caseId,
		clientId,
		lawyerId: locals.user.id,
		title: title.trim(),
		description: description?.trim() || null,
		status: status || 'pending',
		createdAt: now,
		updatedAt: now
	});

	const newCase = {
		id: caseId,
		clientId,
		lawyerId: locals.user.id,
		title: title.trim(),
		description: description?.trim() || null,
		status: status || 'pending',
		createdAt: now,
		updatedAt: now
	};

	return json({ case: newCase }, { status: 201 });
};
