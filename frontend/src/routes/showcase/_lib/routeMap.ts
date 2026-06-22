/**
 * Route map
 *
 * Maps real application routes to their /showcase equivalents so that copied
 * page markup can keep its original CTAs/links/`goto()` targets while staying
 * entirely inside the showcase. Anything not mapped returns `null` so callers
 * can choose to no-op (visual-only) instead of escaping to a live route.
 */

const MAP: Record<string, string> = {
	// Public / Marketing
	'/': '/showcase/home',
	'/how-it-works': '/showcase/public/how-it-works',
	'/why-tributestream': '/showcase/public/why-tributestream',
	'/for-families': '/showcase/public/for-families',
	'/for-funeral-directors': '/showcase/public/for-funeral-directors',
	'/pricing': '/showcase/public/pricing',
	'/pricing-breakdown': '/showcase/public/pricing-breakdown',
	'/partnership/basic-partnership': '/showcase/public/partnership-basic',
	'/partnership/premium-partnership': '/showcase/public/partnership-premium',
	'/blog': '/showcase/public/blog',
	'/contact': '/showcase/public/contact',
	'/contact/confirmation': '/showcase/public/contact-confirmation',
	'/contact/success': '/showcase/public/contact-success',
	'/book-demo': '/showcase/public/book-demo',
	'/emergency': '/showcase/public/emergency',
	'/search': '/showcase/public/search',
	'/email-confirmed': '/showcase/public/email-confirmed',

	// Family journey (incl. auth)
	'/register': '/showcase/family/register-chooser',
	'/register/loved-one': '/showcase/family/register',
	'/auth/session': '/showcase/family/profile',
	'/login': '/showcase/family/login',
	'/reset-password': '/showcase/family/reset-password',
	'/my-portal': '/showcase/family/my-portal',
	'/profile': '/showcase/family/profile',
	'/profile/settings': '/showcase/family/profile-settings',
	'/schedule': '/showcase/family/schedule',
	'/schedule/new': '/showcase/family/schedule-new',
	'/app/calculator': '/showcase/family/calculator',
	'/app/book': '/showcase/family/book',
	'/payment': '/showcase/family/payment',
	'/app/checkout/success': '/showcase/family/checkout-success',
	'/payment/receipt': '/showcase/family/receipt',
	'/slideshow-generator': '/showcase/family/slideshow',

	// Funeral Director journey
	'/register/funeral-director': '/showcase/fd/register-funeral-director',
	'/register/funeral-home': '/showcase/fd/register-funeral-home',
	'/funeral-director/dashboard': '/showcase/fd/dashboard',

	// Admin journey
	'/admin': '/showcase/admin/dashboard',
	'/admin/services/memorials': '/showcase/admin/memorials',
	'/admin/services/streams': '/showcase/admin/memorials',
	'/admin/services/receipts': '/showcase/admin/receipts',
	'/admin/users/memorial-owners': '/showcase/admin/users',
	'/admin/users/funeral-directors': '/showcase/admin/funeral-directors',
	'/admin/system/audit-logs': '/showcase/admin/audit-logs',
	'/admin/system/email-logs': '/showcase/admin/email-logs',
	'/admin/content/blog': '/showcase/admin/blog',

	// Streaming (static endpoints)
	'/test-stream': '/showcase/streaming/test-stream'
};

/** Dynamic route patterns, evaluated in order (most specific first). */
const PATTERNS: { re: RegExp; to: string }[] = [
	{ re: /^\/admin\/services\/memorials\/[^/]+\/switcher/, to: '/showcase/admin/memorial-switcher' },
	{ re: /^\/admin\/services\/memorials\/[^/]+/, to: '/showcase/admin/memorial-detail' },
	{ re: /^\/admin\/services\/receipts\/[^/]+/, to: '/showcase/admin/receipt-detail' },
	{ re: /^\/admin\/users\/memorial-owners\/[^/]+/, to: '/showcase/admin/user-detail' },
	{ re: /^\/schedule\/[^/]+/, to: '/showcase/family/schedule-memorial' },
	{ re: /^\/app\/book\/[^/]+/, to: '/showcase/family/book' },
	{ re: /^\/pay\/[^/]+\/receipt/, to: '/showcase/family/pay-invoice-receipt' },
	{ re: /^\/pay\/[^/]+/, to: '/showcase/family/pay-invoice' },
	{ re: /^\/receipt\/[^/]+/, to: '/showcase/family/receipt-detail' },
	{ re: /^\/memorials\/[^/]+\/manage-streams/, to: '/showcase/family/manage-streams' },
	{ re: /^\/camera\/[^/]+/, to: '/showcase/streaming/camera' },
	{ re: /^\/hls\/[^/]+/, to: '/showcase/streaming/hls' },
	{ re: /^\/whep\/[^/]+/, to: '/showcase/streaming/whep' },
	{ re: /^\/stream\/mobile\/[^/]+/, to: '/showcase/streaming/mobile' },
	{ re: /^\/tributes\/[^/]+/, to: '/showcase/public/tribute' }
];

/** The mock memorial slug used by the family memorial page. */
export const DEMO_MEMORIAL_SLUG = 'jane-doe';

/**
 * Resolve a real route to a showcase route.
 * Handles dynamic memorial slugs and admin/detail ids.
 */
export function showcaseHref(realPath: string): string | null {
	if (!realPath) return null;

	// Strip query/hash for matching.
	const path = realPath.split('?')[0].split('#')[0];

	// Exact matches first.
	if (MAP[path]) return MAP[path];

	// Dynamic patterns.
	for (const { re, to } of PATTERNS) {
		if (re.test(path)) return to;
	}

	// Memorial public page: /:fullSlug (single segment, not a known section).
	if (/^\/[^/]+$/.test(path)) {
		return '/showcase/family/memorial';
	}

	return null;
}

/** Convenience: showcase href, falling back to a safe no-op anchor. */
export function safeHref(realPath: string): string {
	return showcaseHref(realPath) ?? '#';
}
