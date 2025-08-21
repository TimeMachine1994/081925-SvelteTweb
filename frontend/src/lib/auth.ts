import { writable } from 'svelte/store';

export interface User {
	uid: string;
	email: string | null | undefined;
	displayName: string | undefined;
}

export const user = writable<User | null>(null);