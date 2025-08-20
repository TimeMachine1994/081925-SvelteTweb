import { writable } from 'svelte/store';

export interface User {
	uid: string;
	email: string | undefined;
}

export const user = writable<User | null>(null);