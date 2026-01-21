import { json, error, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user as userTable, cases as casesTable } from '$lib/server/db/schema';
import { eq, sql, and } from 'drizzle-orm';

export const GET = async ({ locals }: RequestEvent) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		throw error(403, 'Forbidden');
	}

	try {
		// Get all clients with their case counts
		const clients = await db
			.select({
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				phoneNumber: userTable.phoneNumber,
				createdAt: userTable.createdAt
			})
			.from(userTable)
			.where(eq(userTable.role, 'client'));

		// Get case counts for each client
		const clientsWithStats = await Promise.all(
			clients.map(async (client) => {
				const caseStats = await db
					.select({
						total: sql<number>`count(*)`,
						active: sql<number>`sum(case when ${casesTable.status} = 'active' then 1 else 0 end)`
					})
					.from(casesTable)
					.where(eq(casesTable.clientId, client.id));

				return {
					...client,
					caseCount: Number(caseStats[0]?.total) || 0,
					activeCaseCount: Number(caseStats[0]?.active) || 0
				};
			})
		);

		// Sort by name
		clientsWithStats.sort((a, b) => 
			`${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
		);

		return json({ clients: clientsWithStats });
	} catch (err) {
		console.error('Fetch clients error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to fetch clients');
	}
};
