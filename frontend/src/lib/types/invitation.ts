import type { Timestamp } from 'firebase/firestore';

export interface Invitation {
	id: string;
	memorialId: string;
	inviteeEmail: string;
	roleToAssign: 'family_member'; // Currently only supports inviting family members
	status: 'pending' | 'accepted';
	invitedByUid: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}