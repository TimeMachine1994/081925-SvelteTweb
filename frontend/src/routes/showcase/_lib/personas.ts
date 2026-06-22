/**
 * Showcase personas
 *
 * Static mock identities used to drive the public `user` store ($lib/auth)
 * and the admin `adminUser` store ($lib/stores/adminUser) so the copied
 * page markup renders its "logged in" states without any real auth.
 */
import type { User } from '$lib/auth';
import type { AdminUser } from '$lib/admin/permissions';
import data from './showcase-data.json';

export type PersonaKey = 'guest' | 'family' | 'fd' | 'admin';

/** Family member (memorial owner) persona for the family journey. */
export const familyPersona = data.personas.family as User;

/** Funeral director persona for the FD journey. */
export const funeralDirectorPersona = data.personas.funeralDirector as User;

/** Admin persona for the public `user` store (Navbar/Footer awareness). */
export const adminPersona = data.personas.adminPublic as User;

/** Admin persona for the admin RBAC store. */
export const adminUserPersona = data.personas.adminUser as AdminUser;

/** Resolve the public `user` store value for a persona key. */
export function publicUserFor(persona: PersonaKey): User | null {
	switch (persona) {
		case 'family':
			return familyPersona;
		case 'fd':
			return funeralDirectorPersona;
		case 'admin':
			return adminPersona;
		default:
			return null;
	}
}
