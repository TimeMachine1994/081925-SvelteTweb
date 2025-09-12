import { writable } from 'svelte/store';

export interface User {
	uid: string;
	email: string | null;
	displayName?: string;
	role: 'admin' | 'owner' | 'funeral_director';
	isAdmin: boolean;
}

export const user = writable<User | null>(null);