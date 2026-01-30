import { dev } from '$app/environment';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

const DATABASE_URL = env.DATABASE_URL || 'file:local.db';

if (!dev && !env.DATABASE_AUTH_TOKEN && !DATABASE_URL.startsWith('file:')) {
	throw new Error('DATABASE_AUTH_TOKEN is not set');
}

const client = createClient({ 
	url: DATABASE_URL, 
	authToken: env.DATABASE_AUTH_TOKEN 
});

export const db = drizzle(client, { schema });
