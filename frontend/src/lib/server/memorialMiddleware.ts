import { error } from '@sveltejs/kit';
import { MemorialAccessVerifier, type UserContext, type AccessCheckResult, logAccessAttempt } from '$lib/utils/memorialAccess';

/**
 * Middleware functions for memorial access control
 */

export interface MemorialRequest {
	memorialId: string;
	user: UserContext;
}

/**
 * Verify user has view access to memorial
 */
export async function requireViewAccess(request: MemorialRequest): Promise<AccessCheckResult> {
	console.log('🔒 Middleware: Checking view access for memorial:', request.memorialId);
	
	const accessResult = await MemorialAccessVerifier.checkViewAccess(request.memorialId, request.user);
	
	if (!accessResult.hasAccess) {
		console.log('❌ View access denied:', accessResult.reason);
		throw error(403, `Access denied: ${accessResult.reason}`);
	}
	
	console.log('✅ View access granted:', accessResult.reason);
	return accessResult;
}

/**
 * Verify user has edit access to memorial
 */
export async function requireEditAccess(request: MemorialRequest): Promise<AccessCheckResult> {
	console.log('🔒 Middleware: Checking edit access for memorial:', request.memorialId);
	
	const accessResult = await MemorialAccessVerifier.checkEditAccess(request.memorialId, request.user);
	
	if (!accessResult.hasAccess) {
		console.log('❌ Edit access denied:', accessResult.reason);
		throw error(403, `Edit access denied: ${accessResult.reason}`);
	}
	
	console.log('✅ Edit access granted:', accessResult.reason);
	return accessResult;
}

/**
 * Verify user has photo upload access to memorial
 */
export async function requirePhotoUploadAccess(request: MemorialRequest): Promise<AccessCheckResult> {
	console.log('🔒 Middleware: Checking photo upload access for memorial:', request.memorialId);
	
	const accessResult = await MemorialAccessVerifier.checkPhotoUploadAccess(request.memorialId, request.user);
	
	if (!accessResult.hasAccess) {
		console.log('❌ Photo upload access denied:', accessResult.reason);
		throw error(403, `Photo upload access denied: ${accessResult.reason}`);
	}
	
	console.log('✅ Photo upload access granted:', accessResult.reason);
	return accessResult;
}

/**
 * Verify user has livestream control access to memorial
 */
export async function requireLivestreamAccess(request: MemorialRequest): Promise<AccessCheckResult> {
	console.log('🔒 Middleware: Checking livestream access for memorial:', request.memorialId);
	
	const accessResult = await MemorialAccessVerifier.checkLivestreamAccess(request.memorialId, request.user);
	
	if (!accessResult.hasAccess) {
		console.log('❌ Livestream access denied:', accessResult.reason);
		throw error(403, `Livestream access denied: ${accessResult.reason}`);
	}
	
	console.log('✅ Livestream access granted:', accessResult.reason);
	return accessResult;
}

/**
 * Create user context from locals.user
 */
export function createUserContext(user: any): UserContext {
	return {
		uid: user.uid,
		email: user.email,
		role: user.role,
		isAdmin: user.admin || user.role === 'admin'
	};
}

/**
 * Verify memorial permissions (main middleware function)
 */
export async function verifyMemorialPermissions(event: any): Promise<AccessCheckResult> {
	console.log('🔒 Middleware: Verifying permissions');
	
	if (!event.locals?.user) {
		return {
			hasAccess: false,
			accessLevel: 'none',
			reason: 'Authentication required'
		};
	}

	const memorialId = event.params?.memorialId || 'unknown';
	const request = createMemorialRequest(memorialId, event.locals);
	
	// Log access attempt
	logAccessAttempt({
		userId: request.user.uid,
		memorialId: request.memorialId,
		action: 'view',
		timestamp: new Date().toISOString()
	});
	
	return await requireViewAccess(request);
}

/**
 * Verify authentication and create memorial request context
 */
export function createMemorialRequest(memorialId: string, locals: any): MemorialRequest {
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}
	
	if (!memorialId) {
		throw error(400, 'Memorial ID is required');
	}
	
	return {
		memorialId,
		user: createUserContext(locals.user)
	};
}
