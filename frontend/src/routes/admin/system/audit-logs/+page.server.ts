import { requireAdmin } from '$lib/server/adminGuard';
import * as audit from '$lib/server/db/repos/audit';

export const load = async ({ locals, url }: any) => {
	requireAdmin(locals, { resource: 'audit_log', action: 'read' });

	// Get query params
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '100');
	const sortBy = url.searchParams.get('sortBy') || 'timestamp';
	const sortDir = (url.searchParams.get('sortDir') || 'desc') as 'asc' | 'desc';

	const logs = await audit.listRecent({ limit, sortBy, sortDir });

	return {
		logs,
		pagination: {
			page,
			limit,
			total: logs.length
		}
	};
};
