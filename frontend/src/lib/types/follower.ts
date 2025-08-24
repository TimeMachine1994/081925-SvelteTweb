import type { Timestamp } from 'firebase/firestore';

export interface Follower {
	userId: string;
	followedAt: Timestamp;
}