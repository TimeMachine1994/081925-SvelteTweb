import { db } from '$lib/server/db';
import { cases, documents, invoices, messages, user } from '$lib/server/db/schema';
import { eq, isNull, and, notInArray, sql } from 'drizzle-orm';
import { listClientFiles } from '$lib/server/s3';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const lawyerId = locals.user!.id;

	// Load all lawyer's cases with client info
	const lawyerCases = await db
		.select({
			case: cases,
			client: user
		})
		.from(cases)
		.innerJoin(user, eq(cases.clientId, user.id))
		.where(eq(cases.lawyerId, lawyerId));

	// Load all documents
	const allDocuments = await db
		.select()
		.from(documents)
		.limit(10);

	// Load all invoices
	const allInvoices = await db
		.select()
		.from(invoices)
		.limit(10);

	// Load uncategorized messages (messages without a case, from clients only)
	const uncategorizedMessages = await db
		.select({
			message: messages,
			sender: user
		})
		.from(messages)
		.innerJoin(user, eq(messages.senderId, user.id))
		.where(and(
			isNull(messages.caseId),
			eq(user.role, 'client')
		))
		.limit(50);

	// Get all client IDs that already have cases
	const clientIdsWithCases = lawyerCases.map(c => c.client.id);
	
	// Also get ALL client IDs with any case (not just this lawyer's)
	const allCasesResult = await db
		.select({ clientId: cases.clientId })
		.from(cases);
	const allClientIdsWithCases = [...new Set(allCasesResult.map(c => c.clientId))];

	// Load clients without any cases (new registrations)
	let newClients: any[] = [];
	if (allClientIdsWithCases.length > 0) {
		newClients = await db
			.select({
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				phoneNumber: user.phoneNumber,
				createdAt: user.createdAt
			})
			.from(user)
			.where(and(
				eq(user.role, 'client'),
				notInArray(user.id, allClientIdsWithCases)
			));
	} else {
		// No cases exist yet, get all clients
		newClients = await db
			.select({
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				phoneNumber: user.phoneNumber,
				createdAt: user.createdAt
			})
			.from(user)
			.where(eq(user.role, 'client'));
	}

	// Fetch S3 files for each new client
	const newClientsWithFiles = await Promise.all(
		newClients.map(async (client) => {
			try {
				const files = await listClientFiles(client.id);
				return {
					...client,
					files: files.map(f => ({
						key: f.key,
						name: f.key.split('/').pop() || f.key,
						size: f.size,
						lastModified: f.lastModified
					}))
				};
			} catch (error) {
				console.error(`Failed to fetch files for client ${client.id}:`, error);
				return { ...client, files: [] };
			}
		})
	);

	// Calculate stats
	const totalCases = lawyerCases.length;
	const activeCases = lawyerCases.filter((c) => c.case.status === 'active').length;
	const totalDocuments = allDocuments.length;
	const paidInvoices = allInvoices.filter((i) => i.status === 'paid');
	const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

	// Group uncategorized messages by client
	const messagesByClient = uncategorizedMessages.reduce((acc, { message, sender }) => {
		const clientId = message.senderId;
		if (!acc[clientId]) {
			acc[clientId] = {
				client: sender,
				messages: []
			};
		}
		acc[clientId].messages.push(message);
		return acc;
	}, {} as Record<string, { client: any; messages: any[] }>);

	return {
		cases: lawyerCases,
		documents: allDocuments,
		invoices: allInvoices,
		uncategorizedThreads: Object.values(messagesByClient),
		newClients: newClientsWithFiles,
		stats: {
			totalCases,
			activeCases,
			totalDocuments,
			totalRevenue
		}
	};
};
