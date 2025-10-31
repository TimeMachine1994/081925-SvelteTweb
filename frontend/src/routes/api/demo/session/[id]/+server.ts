import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

/**
 * GET /api/demo/session/[id]
 * Gets the status and details of a demo session
 * Used by demo mode banner to check time remaining and session status
 */
export const GET: RequestHandler = async ({ params }) => {
	const sessionId = params.id;

	if (!sessionId) {
		throw error(400, 'Session ID required');
	}

	console.log('[DEMO_SESSION] Fetching session:', sessionId);

	try {
		const sessionDoc = await adminDb.collection('demoSessions').doc(sessionId).get();

		if (!sessionDoc.exists) {
			console.error('[DEMO_SESSION] Session not found:', sessionId);
			throw error(404, 'Demo session not found');
		}

		const session = sessionDoc.data();
		if (!session) {
			throw error(404, 'Demo session data is empty');
		}

		const now = new Date();
		const expiresAt = session.expiresAt.toDate();
		const isExpired = now > expiresAt;
		const timeRemaining = isExpired ? 0 : Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

		console.log('[DEMO_SESSION] Session status:', session.status);
		console.log('[DEMO_SESSION] Is expired:', isExpired);
		console.log('[DEMO_SESSION] Time remaining:', timeRemaining, 'seconds');

		return json({
			id: session.id,
			status: isExpired ? 'expired' : session.status,
			isExpired,
			timeRemaining,
			currentRole: session.currentRole,
			users: session.users,
			metadata: session.metadata,
			createdAt: session.createdAt.toDate().toISOString(),
			expiresAt: expiresAt.toISOString()
		});

	} catch (err: any) {
		console.error('[DEMO_SESSION] ❌ Error fetching session:', err);
		
		if (err.status) {
			throw err;
		}

		throw error(500, 'Failed to fetch demo session: ' + (err.message || 'Unknown error'));
	}
};
