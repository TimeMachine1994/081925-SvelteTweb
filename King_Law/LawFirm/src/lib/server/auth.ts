import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { session, user } from './db/schema';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import { hash, verify } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';

const adapter = new DrizzleSQLiteAdapter(db, session, user);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: process.env.NODE_ENV === 'production'
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
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const sessionData = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days
	};
	await db.insert(session).values(sessionData);
	return sessionData;
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

	if (Date.now() >= dbSession.expiresAt.getTime()) {
		await db.delete(session).where(eq(session.id, sessionId));
		return { session: null, user: null };
	}

	// Extend session if it's past halfway through its lifetime
	if (Date.now() >= dbSession.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		dbSession.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		await db
			.update(session)
			.set({ expiresAt: dbSession.expiresAt })
			.where(eq(session.id, sessionId));
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
