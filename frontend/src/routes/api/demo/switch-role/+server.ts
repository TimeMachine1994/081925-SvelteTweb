import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase';
import type { SwitchRoleRequest, SwitchRoleResponse } from '$lib/types/demo';

/**
 * POST /api/demo/switch-role
 * Switches the current user to a different demo role within their session
 * Generates a new custom token for the target role
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('[DEMO_SWITCH_ROLE] Role switch request received');

	// 1. Verify user is authenticated
	if (!locals.user) {
		console.error('[DEMO_SWITCH_ROLE] User not authenticated');
		throw error(401, 'Not authenticated');
	}

	// 2. Verify user is in demo mode
	if (!locals.user.isDemo || !locals.user.demoSessionId) {
		console.error('[DEMO_SWITCH_ROLE] User not in demo mode');
		throw error(403, 'Not in demo mode. Only demo users can switch roles.');
	}

	try {
		const body = (await request.json()) as SwitchRoleRequest;
		const { targetRole } = body;

		console.log('[DEMO_SWITCH_ROLE] Current role:', locals.user.role);
		console.log('[DEMO_SWITCH_ROLE] Target role:', targetRole);
		console.log('[DEMO_SWITCH_ROLE] Session ID:', locals.user.demoSessionId);

		// 3. Validate target role
		const validRoles = ['admin', 'funeral_director', 'owner', 'viewer'];
		if (!targetRole || !validRoles.includes(targetRole)) {
			throw error(400, 'Invalid target role. Must be one of: admin, funeral_director, owner, viewer');
		}

		// Prevent switching to same role
		if (targetRole === locals.user.role) {
			console.log('[DEMO_SWITCH_ROLE] Already in target role, no switch needed');
			throw error(400, 'Already in the target role');
		}

		// 4. Get demo session
		const sessionDoc = await adminDb
			.collection('demoSessions')
			.doc(locals.user.demoSessionId)
			.get();

		if (!sessionDoc.exists) {
			console.error('[DEMO_SWITCH_ROLE] Demo session not found');
			throw error(404, 'Demo session not found');
		}

		const session = sessionDoc.data();
		if (!session) {
			throw error(404, 'Demo session data is empty');
		}

		// 5. Check if session is expired
		const now = new Date();
		const expiresAt = session.expiresAt.toDate();
		if (now > expiresAt) {
			console.error('[DEMO_SWITCH_ROLE] Demo session expired');
			throw error(410, 'Demo session has expired. Please start a new demo.');
		}

		// Check if session is active
		if (session.status !== 'active') {
			throw error(410, `Demo session is ${session.status}. Cannot switch roles.`);
		}

		// 6. Get target user info from session
		const targetUser = session.users[targetRole];
		if (!targetUser) {
			console.error('[DEMO_SWITCH_ROLE] Target user not found in session');
			throw error(404, 'Target user not found in demo session');
		}

		console.log('[DEMO_SWITCH_ROLE] Target user UID:', targetUser.uid);

		// 7. Generate custom token for target role
		const customToken = await adminAuth.createCustomToken(targetUser.uid, {
			role: targetRole,
			isDemo: true,
			demoSessionId: locals.user.demoSessionId
		});

		console.log('[DEMO_SWITCH_ROLE] Custom token generated for', targetRole);

		// 8. Update session's current role
		await adminDb
			.collection('demoSessions')
			.doc(locals.user.demoSessionId)
			.update({
				currentRole: targetRole,
				lastRoleSwitch: new Date()
			});

		console.log('[DEMO_SWITCH_ROLE] Session updated with new role');

		// 9. Return success response
		const response: SwitchRoleResponse = {
			success: true,
			customToken,
			role: targetRole,
			user: targetUser
		};

		console.log('[DEMO_SWITCH_ROLE] ✅ Role switch successful');
		return json(response);

	} catch (err: any) {
		console.error('[DEMO_SWITCH_ROLE] ❌ Error switching role:', err);

		// Handle specific error types
		if (err.status) {
			throw err; // Re-throw SvelteKit errors
		}

		throw error(500, 'Failed to switch role: ' + (err.message || 'Unknown error'));
	}
};
