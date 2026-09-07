import { env } from '$env/dynamic/private';

export type DbBackend = 'firestore' | 'turso';

export type BackendTable =
	| 'users'
	| 'funeral_directors'
	| 'memorials'
	| 'streams'
	| 'slideshows'
	| 'invoices'
	| 'bookings'
	| 'livestream_configurations'
	| 'schedule_edit_requests'
	| 'invitations'
	| 'password_reset_tokens'
	| 'blog'
	| 'wiki'
	| 'audit_logs'
	| 'email_audit_logs'
	| 'chat'
	| 'analytics'
	| 'search';

/**
 * Selects the data backend for a table. `DB_BACKEND` sets the global default;
 * `DB_BACKEND_<TABLE>` (upper-cased) overrides it per table so collections can be
 * cut over to Turso one at a time and rolled back with an env change.
 */
export function getBackend(table: BackendTable): DbBackend {
	const override = env[`DB_BACKEND_${table.toUpperCase()}`];
	const value = (override || env.DB_BACKEND || 'firestore').toLowerCase();
	return value === 'turso' ? 'turso' : 'firestore';
}

/** When true, write endpoints for memorials/streams return 503 (cutover freeze). */
export function writesFrozen(): boolean {
	return env.MAINTENANCE_WRITES === 'true';
}
