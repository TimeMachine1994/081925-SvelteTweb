import { error } from '@sveltejs/kit';
import {
	EventAccessVerifier,
	type UserContext,
	type AccessCheckResult,
	logAccessAttempt
} from '$lib/utils/eventAccess';

export interface EventRequest {
	eventId: string;
	user: UserContext;
}

export async function requireViewAccess(request: EventRequest): Promise<AccessCheckResult> {
	const accessResult = await EventAccessVerifier.checkViewAccess(
		request.eventId,
		request.user
	);

	if (!accessResult.hasAccess) {
		console.error('❌ View access denied:', accessResult.reason);
		throw error(403, `Access denied: ${accessResult.reason}`);
	}

	return accessResult;
}

export async function requireEditAccess(request: EventRequest): Promise<AccessCheckResult> {
	const accessResult = await EventAccessVerifier.checkEditAccess(
		request.eventId,
		request.user
	);

	if (!accessResult.hasAccess) {
		console.error('❌ Edit access denied:', accessResult.reason);
		throw error(403, `Edit access denied: ${accessResult.reason}`);
	}

	return accessResult;
}

export async function requirePhotoUploadAccess(
	request: EventRequest
): Promise<AccessCheckResult> {
	const accessResult = await EventAccessVerifier.checkPhotoUploadAccess(
		request.eventId,
		request.user
	);

	if (!accessResult.hasAccess) {
		console.error('❌ Photo upload access denied:', accessResult.reason);
		throw error(403, `Photo upload access denied: ${accessResult.reason}`);
	}

	return accessResult;
}

export function createUserContext(user: any): UserContext {
	return {
		uid: user.uid,
		email: user.email,
		role: user.role,
		isAdmin: user.admin || user.role === 'admin'
	};
}

export async function verifyMemorialPermissions(event: any): Promise<AccessCheckResult> {
	if (!event.locals?.user) {
		return {
			hasAccess: false,
			accessLevel: 'none',
			reason: 'Authentication required'
		};
	}

	const memorialId = event.params?.memorialId || 'unknown';
	const request = createEventRequest(memorialId, event.locals);

	logAccessAttempt({
		userId: request.user.uid,
		memorialId: request.eventId,
		action: 'view',
		timestamp: new Date().toISOString()
	});

	return await requireViewAccess(request);
}

export function createEventRequest(eventId: string, locals: any): EventRequest {
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	if (!eventId) {
		throw error(400, 'Event ID is required');
	}

	return {
		eventId,
		user: createUserContext(locals.user)
	};
}
