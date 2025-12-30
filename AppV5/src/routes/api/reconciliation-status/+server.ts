import { json } from '@sveltejs/kit';
import { getJourneyReconciliationStatus } from '$lib/server/file-snapshot';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const journeyId = url.searchParams.get('journeyId');
	const projectPath = url.searchParams.get('projectPath') || process.cwd();

	if (!journeyId) {
		return json({ error: 'journeyId required' }, { status: 400 });
	}

	try {
		const status = await getJourneyReconciliationStatus(journeyId, projectPath);
		return json({
			journeyId,
			potjStatus: Object.fromEntries(status),
			checkedAt: new Date().toISOString()
		});
	} catch (error) {
		console.error('Error checking reconciliation status:', error);
		return json(
			{
				error: 'Failed to check status',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
