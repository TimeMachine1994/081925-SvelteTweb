// Seeds a local SQLite database with minimal dev fixtures.
// Usage: npm run db:seed   (run `npm run db:migrate` first)
import 'dotenv/config';
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
if (!url.startsWith('file:') && process.env.ALLOW_REMOTE_SEED !== 'true') {
	console.error('Refusing to seed a remote database. Set ALLOW_REMOTE_SEED=true to override.');
	process.exit(1);
}

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const now = new Date().toISOString();

const ADMIN_UID = process.env.SEED_ADMIN_UID || 'dev-admin-uid';
const OWNER_UID = process.env.SEED_OWNER_UID || 'dev-owner-uid';
const FD_UID = process.env.SEED_FD_UID || 'dev-fd-uid';

await client.batch(
	[
		{
			sql: `INSERT OR REPLACE INTO users (id, email, display_name, role, created_at, updated_at) VALUES (?,?,?,?,?,?)`,
			args: [ADMIN_UID, 'admin@tributestream.test', 'Dev Admin', 'admin', now, now]
		},
		{
			sql: `INSERT OR REPLACE INTO users (id, email, display_name, role, created_at, updated_at) VALUES (?,?,?,?,?,?)`,
			args: [OWNER_UID, 'owner@tributestream.test', 'Dev Owner', 'owner', now, now]
		},
		{
			sql: `INSERT OR REPLACE INTO users (id, email, display_name, role, funeral_home_name, created_at, updated_at) VALUES (?,?,?,?,?,?,?)`,
			args: [
				FD_UID,
				'fd@tributestream.test',
				'Dev Director',
				'funeral_director',
				'Dev Funeral Home',
				now,
				now
			]
		},
		{
			sql: `INSERT OR REPLACE INTO funeral_directors (id, company_name, contact_person, email, phone, address_city, address_state, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
			args: [
				FD_UID,
				'Dev Funeral Home',
				'Dev Director',
				'fd@tributestream.test',
				'555-0100',
				'Orlando',
				'FL',
				'approved',
				now,
				now
			]
		},
		{
			sql: `INSERT OR REPLACE INTO memorials (id, loved_one_name, slug, full_slug, owner_uid, creator_email, creator_name, funeral_director_uid, is_public, is_complete, content, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,1,0,?,?,?)`,
			args: [
				'dev-memorial-1',
				'Jane Example',
				'jane-example',
				'celebration-of-life-for-jane-example',
				OWNER_UID,
				'owner@tributestream.test',
				'Dev Owner',
				FD_UID,
				'A life well lived.',
				now,
				now
			]
		},
		{
			sql: `INSERT OR REPLACE INTO memorial_services (id, memorial_id, kind, position, location_name, location_address, location_is_unknown, date, time, time_is_unknown, hours) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
			args: [
				'dev-service-1',
				'dev-memorial-1',
				'main',
				0,
				'Dev Chapel',
				'1 Main St, Orlando, FL',
				0,
				'2026-10-01',
				'10:00',
				0,
				2
			]
		},
		{
			sql: `INSERT OR REPLACE INTO streams (id, memorial_id, title, status, created_by, created_at, updated_at) VALUES (?,?,?,?,?,?,?)`,
			args: ['dev-stream-1', 'dev-memorial-1', 'Main Service', 'scheduled', ADMIN_UID, now, now]
		},
		{
			sql: `INSERT OR REPLACE INTO memorial_blocks (id, memorial_id, type, position, enabled, config, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`,
			args: [
				'dev-block-1',
				'dev-memorial-1',
				'livestream',
				0,
				1,
				JSON.stringify({ streamId: 'dev-stream-1' }),
				now,
				now
			]
		},
		{
			sql: `INSERT OR REPLACE INTO memorial_blocks (id, memorial_id, type, position, enabled, config, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`,
			args: [
				'dev-block-2',
				'dev-memorial-1',
				'text',
				1,
				1,
				JSON.stringify({ content: 'Welcome, friends and family.', style: 'note' }),
				now,
				now
			]
		},
		{
			sql: `INSERT OR REPLACE INTO blog_posts (id, slug, title, excerpt, content, author_name, status, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
			args: [
				'dev-post-1',
				'welcome-to-tributestream',
				'Welcome to Tributestream',
				'A short intro.',
				'<p>Hello world.</p>',
				'Dev Admin',
				'published',
				now,
				now,
				now
			]
		},
		{
			sql: `INSERT OR REPLACE INTO wiki_pages (id, slug, title, content, created_by, created_by_email, updated_by, updated_by_email, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
			args: [
				'dev-wiki-1',
				'getting-started',
				'Getting Started',
				'# Getting Started\n\nInternal docs.',
				ADMIN_UID,
				'admin@tributestream.test',
				ADMIN_UID,
				'admin@tributestream.test',
				now,
				now
			]
		}
	],
	'write'
);

console.log(`Seeded ${url}`);
client.close();
