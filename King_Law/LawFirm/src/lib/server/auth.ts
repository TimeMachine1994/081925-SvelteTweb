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
			secure: !dev,
			sameSite: 'lax'
		}
	},
	getUserAttributes: (attributes) => {
		return {
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
	email: string;
	firstName: string;
	lastName: string;
	role: 'client' | 'lawyer' | 'staff' | 'admin';
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
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const expiresAt = Math.floor((Date.now() + 1000 * 60 * 60 * 24 * 30) / 1000); // 30 days as Unix timestamp
	const sessionData = {
		id: sessionId,
		userId,
		expiresAt
	};
	await db.insert(session).values(sessionData);
	return { ...sessionData, expiresAt: new Date(expiresAt * 1000) };
}

// Validate session
export async function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const result = await db
		.select({ user, session })
		.from(session)
		.innerJoin(user, eq(session.userId, user.id))
		.where(eq(session.id, sessionId));

	if (result.length < 1) {
		return { session: null, user: null };
	}

	const { user: dbUser, session: dbSession } = result[0];

	const expiresAtMs = dbSession.expiresAt * 1000; // Convert Unix timestamp to milliseconds
	if (Date.now() >= expiresAtMs) {
		await db.delete(session).where(eq(session.id, sessionId));
		return { session: null, user: null };
	}

	// Extend session if it's past halfway through its lifetime
	if (Date.now() >= expiresAtMs - 1000 * 60 * 60 * 24 * 15) {
		const newExpiresAt = Math.floor((Date.now() + 1000 * 60 * 60 * 24 * 30) / 1000);
		await db
			.update(session)
			.set({ expiresAt: newExpiresAt })
			.where(eq(session.id, sessionId));
		dbSession.expiresAt = newExpiresAt;
	}

	return { session: dbSession, user: dbUser };
}

// Invalidate session
export async function invalidateSession(sessionId: string) {
	await db.delete(session).where(eq(session.id, sessionId));
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
	return await hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
}

// Verify password
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
	return await verify(hash, password);
}

export const SESSION_COOKIE_NAME = 'auth_session';
