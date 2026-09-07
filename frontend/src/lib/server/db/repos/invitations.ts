import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, toIsoOrNow } from './_shared';

const COLLECTION = 'invitations';

export interface InvitationRecord {
	id: string;
	memorialId: string;
	inviteeEmail: string;
	inviteeName?: string;
	inviteePhone?: string;
	roleToAssign: string;
	status: string;
	invitedByUid: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateInvitationInput {
	memorialId: string;
	inviteeEmail: string;
	roleToAssign: string;
	invitedByUid: string;
}

function mapInvitation(id: string, d: Record<string, any>): InvitationRecord {
	return {
		id,
		memorialId: d.memorialId,
		inviteeEmail: d.inviteeEmail,
		inviteeName: d.inviteeName,
		inviteePhone: d.inviteePhone,
		roleToAssign: d.roleToAssign,
		status: d.status,
		invitedByUid: d.invitedByUid,
		createdAt: toIsoOrNow(d.createdAt),
		updatedAt: toIsoOrNow(d.updatedAt)
	};
}

export async function getInvitation(invitationId: string): Promise<InvitationRecord | null> {
	const snap = await adminDb.collection(COLLECTION).doc(invitationId).get();
	if (!snap.exists) return null;
	const data = snap.data();
	if (!data) return null;
	return mapInvitation(snap.id, data);
}

/** Creates a pending invitation and returns its id. */
export async function createInvitation(input: CreateInvitationInput): Promise<string> {
	const ref = await adminDb.collection(COLLECTION).add({
		memorialId: input.memorialId,
		inviteeEmail: input.inviteeEmail,
		roleToAssign: input.roleToAssign,
		status: 'pending',
		invitedByUid: input.invitedByUid,
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now()
	});
	return ref.id;
}

export async function deleteInvitation(invitationId: string): Promise<void> {
	await adminDb.collection(COLLECTION).doc(invitationId).delete();
}
