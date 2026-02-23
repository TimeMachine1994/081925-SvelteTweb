import { env } from '$env/dynamic/private';

export interface GeoValidationResult {
	allowed: boolean;
	country: string;
	city: string;
	region: string;
}

/**
 * Validate the geographic origin of a request using Vercel's automatic geo headers.
 * These headers are injected by Vercel's edge network at no extra cost.
 *
 * @param request - The incoming Request object (from SvelteKit's RequestEvent)
 */
export function validateGeolocation(request: Request): GeoValidationResult {
	const country = request.headers.get('x-vercel-ip-country') ?? '';
	const city = request.headers.get('x-vercel-ip-city') ?? '';
	const region = request.headers.get('x-vercel-ip-country-region') ?? '';

	const allowedCountries = (env.ALLOWED_COUNTRIES ?? 'US')
		.split(',')
		.map((c) => c.trim().toUpperCase());

	// In development (no Vercel headers), allow all requests
	if (!country) {
		console.log('[geolocation] No geo headers found (local dev) — allowing request');
		return { allowed: true, country: 'DEV', city: 'localhost', region: '' };
	}

	const allowed = allowedCountries.includes(country.toUpperCase());

	if (!allowed) {
		console.warn('[geolocation] Request blocked from:', { country, city, region });
	}

	return { allowed, country, city, region };
}
