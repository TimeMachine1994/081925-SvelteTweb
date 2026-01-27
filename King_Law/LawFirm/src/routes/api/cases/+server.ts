import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { cases, user as userTable, messages, documents } from '$lib/server/db/schema';
import { eq, or, isNull, and } from 'drizzle-orm';
import { generateId } from '$lib/server/auth';
import { alias } from 'drizzle-orm/sqlite-core';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const caseId = url.searchParams.get('id');

		if (caseId) {
			// Create aliases for client and lawyer joins
			const clientTable = alias(userTable, 'client');
			const lawyerTable = alias(userTable, 'lawyer');

			const [caseData] = await db
				.select({
					case: cases,
					client: clientTable,
					lawyer: lawyerTable
				})
				.from(cases)
				.leftJoin(clientTable, eq(cases.clientId, clientTable.id))
				.leftJoin(lawyerTable, eq(cases.lawyerId, lawyerTable.id))
				.where(eq(cases.id, caseId))
				.limit(1);

			if (!caseData) {
				throw error(404, 'Case not found');
			}

			if (
				locals.user.role !== 'admin' &&
				caseData.case.clientId !== locals.user.id &&
				caseData.case.lawyerId !== locals.user.id
			) {
				throw error(403, 'Access denied');
			}

			return json({ case: caseData });
		}

		let userCases;
		if (locals.user.role === 'client') {
			userCases = await db
				.select({
					case: cases,
					lawyer: userTable
				})
				.from(cases)
				.leftJoin(userTable, eq(cases.lawyerId, userTable.id))
				.where(eq(cases.clientId, locals.user.id));
		} else {
			userCases = await db
				.select({
					case: cases,
					client: userTable
				})
				.from(cases)
				.leftJoin(userTable, eq(cases.clientId, userTable.id))
				.where(
					or(eq(cases.lawyerId, locals.user.id), eq(userTable.role, 'admin'))
				);
		}

		return json({ cases: userCases });
	} catch (err) {
		console.error('Get cases error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to fetch cases');
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role === 'client') {
		throw error(403, 'Only lawyers can create cases');
	}

	try {
		const { clientId, title, description, status } = await request.json();

		if (!clientId || !title) {
			throw error(400, 'Client ID and title are required');
		}

		const [newCase] = await db
			.insert(cases)
			.values({
				id: generateId(),
				clientId,
				lawyerId: locals.user.id,
				title,
				description: description || null,
				status: status || 'pending'
			})
			.returning();

		// Link uncategorized messages from this client to the new case
		await db
			.update(messages)
			.set({ caseId: newCase.id })
			.where(
				and(
					eq(messages.senderId, clientId),
					isNull(messages.caseId)
				)
			);

		// Also link messages sent TO this client (from lawyers) that are uncategorized
		await db
			.update(messages)
			.set({ caseId: newCase.id })
			.where(
				and(
					eq(messages.recipientId, clientId),
					isNull(messages.caseId)
				)
			);

		// Link uncategorized documents uploaded by this client to the new case
		await db
			.update(documents)
			.set({ caseId: newCase.id })
			.where(
				and(
					eq(documents.uploadedById, clientId),
					isNull(documents.caseId)
				)
			);

		return json({ success: true, case: newCase });
	} catch (err) {
		console.error('Create case error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to create case');
	}
};
