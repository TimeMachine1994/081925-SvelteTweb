import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { session, user } from './db/schema';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import { hash, verify } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment';

const adapter = new DrizzleSQLiteAdapter(db, session, user);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !dev
		}
	},
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username,
			email: attributes.email,
			firstName: attributes.firstName,
			lastName: attributes.lastName,
			role: attributes.role,
			phoneNumber: attributes.phoneNumber
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	role: 'client' | 'lawyer' | 'admin';
	phoneNumber: string | null;
}

// Generate random session ID
export function generateId(length: number = 15): string {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

// Generate session token
export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

// Create session
export async function createSession(token: string, userId: string) {
	console.log('📝 createSession called for userId:', userId);
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	console.log('Generated sessionId:', sessionId.substring(0, 10) + '...');
	// Store expiresAt as unix timestamp (seconds)
	const expiresAt = Math.floor((Date.now() + 1000 * 60 * 60 * 24 * 30) / 1000); // 30 days
	const sessionData = {
		id: sessionId,
		userId,
		expiresAt
	};
	console.log('Session expires at:', new Date(expiresAt * 1000).toISOString());
	await db.insert(session).values(sessionData);
	console.log('✅ Session inserted into database');
	return sessionData;
}

// Validate session
export async function validateSessionToken(token: string) {
	console.log('🔍 validateSessionToken called');
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	console.log('Looking for sessionId:', sessionId.substring(0, 10) + '...');
	const result = await db
		.select({ user, session })
		.from(session)
		.innerJoin(user, eq(session.userId, user.id))
		.where(eq(session.id, sessionId));

	if (result.length < 1) {
		console.log('❌ No session found in database');
		return { session: null, user: null };
	}
	console.log('✅ Session found in database');

	const { user: dbUser, session: dbSession } = result[0];
	console.log('Session user:', { id: dbUser.id, username: dbUser.username, role: dbUser.role });
	console.log('Session expires:', new Date(dbSession.expiresAt).toISOString());

	// expiresAt is stored as unix timestamp (seconds) in the database
	const expiresAtMs = dbSession.expiresAt * 1000;
	
	if (Date.now() >= expiresAtMs) {
		console.log('❌ Session expired, deleting...');
		await db.delete(session).where(eq(session.id, sessionId));
		return { session: null, user: null };
	}
	console.log('✅ Session is valid');

	// Extend session if it's past halfway through its lifetime (15 days)
	const fifteenDaysMs = 1000 * 60 * 60 * 24 * 15;
	if (Date.now() >= expiresAtMs - fifteenDaysMs) {
		console.log('🔄 Extending session expiration...');
		const newExpiresAt = Math.floor((Date.now() + 1000 * 60 * 60 * 24 * 30) / 1000);
		await db
			.update(session)
			.set({ expiresAt: newExpiresAt })
			.where(eq(session.id, sessionId));
		console.log('✅ Session extended to:', new Date(newExpiresAt * 1000).toISOString());
	}

	return { session: dbSession, user: dbUser };
}

// Invalidate session
export async function invalidateSession(sessionId: string) {
	console.log('🗑️ Invalidating session:', sessionId.substring(0, 10) + '...');
	await db.delete(session).where(eq(session.id, sessionId));
	console.log('✅ Session deleted');
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
	console.log('🔐 Hashing password with Argon2...');
	const hashed = await hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
	console.log('✅ Password hash generated');
	return hashed;
}

// Verify password
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
	console.log('🔍 Verifying password against hash...');
	const isValid = await verify(hash, password);
	console.log('Password verification result:', isValid ? '✅ MATCH' : '❌ NO MATCH');
	return isValid;
}

export const SESSION_COOKIE_NAME = 'auth_session';
