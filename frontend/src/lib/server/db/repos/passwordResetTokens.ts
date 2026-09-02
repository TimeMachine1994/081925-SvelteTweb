import { adminDb, toIso, toIsoOrNow } from './_shared';

const COLLECTION = 'passwordResetTokens';

export interface PasswordResetToken {
	token: string;
	userId: string;
	email: string;
	createdAt: string;
	expiresAt: string;
	used: boolean;
	usedAt: string | null;
}

export interface CreatePasswordResetTokenInput {
	token: string;
	userId: string;
	email: string;
	expiresAt: Date;
}

function mapToken(token: string, d: Record<string, any>): PasswordResetToken {
	return {
		token,
		userId: d.userId,
		email: d.email,
		createdAt: toIsoOrNow(d.createdAt),
		expiresAt: toIsoOrNow(d.expiresAt),
		used: !!d.used,
		usedAt: toIso(d.usedAt)
	};
}

export async function getToken(token: string): Promise<PasswordResetToken | null> {
	const snap = await adminDb.collection(COLLECTION).doc(token).get();
	if (!snap.exists) return null;
	return mapToken(snap.id, snap.data() || {});
}

/** Stores a new, unused reset token keyed by the token string itself. */
export async function createToken(input: CreatePasswordResetTokenInput): Promise<void> {
	await adminDb.collection(COLLECTION).doc(input.token).set({
		userId: input.userId,
		email: input.email,
		createdAt: new Date(),
		expiresAt: input.expiresAt,
		used: false
	});
}

export async function markUsed(token: string): Promise<void> {
	await adminDb.collection(COLLECTION).doc(token).update({
		used: true,
		usedAt: new Date()
	});
}
