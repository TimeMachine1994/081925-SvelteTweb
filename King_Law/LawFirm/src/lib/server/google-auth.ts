import { env } from '$env/dynamic/private';
import { GoogleAuth, ExternalAccountClient } from 'google-auth-library';
import { google, type calendar_v3 } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

let calendarClient: calendar_v3.Calendar | null = null;

/**
 * Build an authenticated Google Auth client using Workload Identity Federation.
 *
 * Strategy:
 * 1. If GOOGLE_APPLICATION_CREDENTIALS_JSON is set (Vercel), parse the credential
 *    config and create an ExternalAccountClient directly.
 * 2. If GOOGLE_APPLICATION_CREDENTIALS env/file path is set, GoogleAuth will
 *    pick it up automatically via Application Default Credentials (ADC).
 * 3. Fallback: construct credentials from individual env vars (pool, provider, SA).
 */
async function getAuthClient() {
	// Option 1: Full credential config JSON stored in env var (primary path for Vercel)
	if (env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
		try {
			const credConfig = JSON.parse(env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
			const client = ExternalAccountClient.fromJSON(credConfig);
			if (!client) {
				throw new Error('Failed to create ExternalAccountClient from credential config JSON');
			}
			client.scopes = SCOPES;
			return client;
		} catch (err) {
			console.error('[google-auth] Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', err);
			throw err;
		}
	}

	// Option 2: ADC — works if GOOGLE_APPLICATION_CREDENTIALS file path is set,
	// or running on GCP infrastructure
	const auth = new GoogleAuth({ scopes: SCOPES });
	return auth.getClient();
}

/**
 * Returns a singleton authenticated Google Calendar v3 client.
 * Lazily initializes on first call.
 */
export async function getCalendarClient(): Promise<calendar_v3.Calendar> {
	if (calendarClient) {
		return calendarClient;
	}

	try {
		const authClient = await getAuthClient();
		calendarClient = google.calendar({
			version: 'v3',
			auth: authClient as any
		});
		console.log('[google-auth] Calendar client initialized successfully');
		return calendarClient;
	} catch (err) {
		console.error('[google-auth] Failed to initialize Calendar client:', err);
		throw new Error('Google Calendar authentication failed. Check your WIF configuration.');
	}
}

/**
 * Returns the configured calendar ID from env vars.
 */
export function getCalendarId(): string {
	const calendarId = env.GOOGLE_CALENDAR_ID;
	if (!calendarId) {
		throw new Error('GOOGLE_CALENDAR_ID is not set');
	}
	return calendarId;
}

/**
 * Reset the singleton (useful for testing or credential rotation).
 */
export function resetCalendarClient(): void {
	calendarClient = null;
}
