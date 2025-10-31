import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase';
import crypto from 'crypto';
import type {
	CreateDemoSessionRequest,
	CreateDemoSessionResponse,
	DemoUser
} from '$lib/types/demo';

/**
 * POST /api/demo/session
 * Creates a new demo session with 4 pre-created users (admin, funeral_director, owner, viewer)
 * Requires admin authentication
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	console.log('[DEMO_SESSION] Session creation request received');

	// 1. Verify admin access
	if (!locals.user || locals.user.role !== 'admin') {
		console.error('[DEMO_SESSION] Unauthorized access attempt');
		throw error(403, 'Admin access required to create demo sessions');
	}

	try {
		const body = await request.json() as CreateDemoSessionRequest;
		const { scenario = 'default', duration = 2, metadata } = body;

		console.log('[DEMO_SESSION] Creating session with scenario:', scenario);
		console.log('[DEMO_SESSION] Duration:', duration, 'hours');

		// 2. Validate duration (max 4 hours for safety)
		if (duration < 0.5 || duration > 4) {
			throw error(400, 'Session duration must be between 0.5 and 4 hours');
		}

		// 3. Create session ID and timestamps
		const sessionId = `demo_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
		const now = new Date();
		const expiresAt = new Date(now.getTime() + duration * 60 * 60 * 1000);

		console.log('[DEMO_SESSION] Session ID:', sessionId);
		console.log('[DEMO_SESSION] Expires at:', expiresAt.toISOString());

		// 4. Create 4 demo users in Firebase Auth
		console.log('[DEMO_SESSION] Creating 4 demo users...');
		const demoUsers = await createDemoUsers(sessionId, expiresAt);
		console.log('[DEMO_SESSION] Demo users created successfully');

		// 5. Create session document in Firestore
		const sessionData = {
			id: sessionId,
			createdAt: now,
			expiresAt: expiresAt,
			status: 'active',
			createdBy: locals.user.uid,
			users: demoUsers,
			currentRole: 'funeral_director', // Start with funeral director by default
			metadata: {
				ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
				userAgent: request.headers.get('user-agent') || 'unknown',
				entryPoint: metadata?.entryPoint || 'landing_page',
				scenario: scenario,
				referrer: metadata?.referrer
			}
		};

		await adminDb.collection('demoSessions').doc(sessionId).set(sessionData);
		console.log('[DEMO_SESSION] Session document created in Firestore');

		// 6. Generate custom token for initial role (funeral director)
		const initialUser = demoUsers.funeral_director;
		const customToken = await adminAuth.createCustomToken(initialUser.uid, {
			role: 'funeral_director',
			isDemo: true,
			demoSessionId: sessionId
		});
		console.log('[DEMO_SESSION] Custom token generated for initial login');

		// 7. Return success response
		const response: CreateDemoSessionResponse = {
			success: true,
			sessionId,
			customToken,
			expiresAt: expiresAt.toISOString(),
			initialRole: 'funeral_director'
		};

		console.log('[DEMO_SESSION] ✅ Session created successfully');
		return json(response);

	} catch (err: any) {
		console.error('[DEMO_SESSION] ❌ Error creating demo session:', err);
		
		// Handle specific error types
		if (err.status) {
			throw err; // Re-throw SvelteKit errors
		}

		throw error(500, 'Failed to create demo session: ' + (err.message || 'Unknown error'));
	}
};

/**
 * Helper function to create 4 demo users (one for each role)
 */
async function createDemoUsers(
	sessionId: string,
	expiresAt: Date
): Promise<{
	admin: DemoUser;
	funeral_director: DemoUser;
	owner: DemoUser;
	viewer: DemoUser;
}> {
	const roles = ['admin', 'funeral_director', 'owner', 'viewer'] as const;
	const demoUsers: any = {};

	for (const role of roles) {
		console.log(`[DEMO_SESSION] Creating ${role} user...`);

		// Generate unique email and password
		const email = `demo-${role}-${sessionId}@tributestream.demo`;
		const displayName = getDemoDisplayName(role);
		const password = crypto.randomBytes(32).toString('hex'); // Random secure password

		try {
			// Create user in Firebase Auth
			const userRecord = await adminAuth.createUser({
				email,
				emailVerified: true,
				password,
				displayName
			});

			console.log(`[DEMO_SESSION] Created Firebase Auth user for ${role}:`, userRecord.uid);

			// Set custom claims for the user
			await adminAuth.setCustomUserClaims(userRecord.uid, {
				role,
				isDemo: true,
				demoSessionId: sessionId
			});

			console.log(`[DEMO_SESSION] Set custom claims for ${role}`);

			// Create user document in Firestore
			await adminDb
				.collection('users')
				.doc(userRecord.uid)
				.set({
					uid: userRecord.uid,
					email,
					displayName,
					role,
					isDemo: true,
					demoSessionId: sessionId,
					demoExpiresAt: expiresAt.toISOString(),
					createdAt: new Date(),
					photoURL: null,
					// Add role-specific fields
					...(role === 'owner' && {
						memorialCount: 0,
						hasPaidForMemorial: false
					}),
					...(role === 'funeral_director' && {
						companyName: 'Demo Funeral Home',
						phone: '(555) 123-4567'
					})
				});

			console.log(`[DEMO_SESSION] Created Firestore document for ${role}`);

			demoUsers[role] = {
				uid: userRecord.uid,
				email,
				displayName,
				role
			};

		} catch (err: any) {
			console.error(`[DEMO_SESSION] ❌ Error creating ${role} user:`, err);
			throw new Error(`Failed to create demo ${role} user: ${err.message}`);
		}
	}

	return demoUsers as {
		admin: DemoUser;
		funeral_director: DemoUser;
		owner: DemoUser;
		viewer: DemoUser;
	};
}

/**
 * Get display name for demo user based on role
 */
function getDemoDisplayName(role: string): string {
	const names: Record<string, string> = {
		admin: 'Demo Admin User',
		funeral_director: 'Sarah Johnson (Johnson Funeral Home)',
		owner: 'Michael Anderson',
		viewer: 'Guest Viewer'
	};
	return names[role] || 'Demo User';
}
