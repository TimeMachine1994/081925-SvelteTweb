/**
 * Showcase manifest
 *
 * Single source of truth for the showcase: every mock screen, the journey it
 * belongs to, the persona to activate, and which chrome wraps it. Drives the
 * control bar stepper/dropdown and the interactive Mermaid sitemap.
 */
import type { PersonaKey } from './personas';

export type Journey = 'public' | 'family' | 'fd' | 'admin' | 'streaming';
export type Chrome = 'family' | 'admin' | 'none';

export interface ShowcaseScreen {
	/** Stable id (also used as the mermaid node id). */
	id: string;
	/** Human label for nav + sitemap. */
	label: string;
	/** Route path under /showcase. */
	path: string;
	/** Journey grouping. */
	journey: Journey;
	/** Persona to set when this screen is shown. */
	persona: PersonaKey;
	/** Which chrome to render around the page. */
	chrome: Chrome;
}

export const SCREENS: ShowcaseScreen[] = [
	// --- Public / Marketing journey ---
	{ id: 'home', label: 'Home', path: '/showcase/home', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'how-it-works', label: 'How It Works', path: '/showcase/public/how-it-works', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'why-tributestream', label: 'Why Tributestream', path: '/showcase/public/why-tributestream', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'for-families', label: 'For Families', path: '/showcase/public/for-families', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'for-funeral-directors', label: 'For Funeral Directors', path: '/showcase/public/for-funeral-directors', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'pricing', label: 'Pricing', path: '/showcase/public/pricing', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'pricing-breakdown', label: 'Pricing Breakdown', path: '/showcase/public/pricing-breakdown', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'partnership-basic', label: 'Basic Partnership', path: '/showcase/public/partnership-basic', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'partnership-premium', label: 'Premium Partnership', path: '/showcase/public/partnership-premium', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'blog', label: 'Blog', path: '/showcase/public/blog', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'blog-post', label: 'Blog Post', path: '/showcase/public/blog-post', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'contact', label: 'Contact', path: '/showcase/public/contact', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'contact-confirmation', label: 'Contact Confirmation', path: '/showcase/public/contact-confirmation', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'contact-success', label: 'Contact Success', path: '/showcase/public/contact-success', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'book-demo', label: 'Book a Demo', path: '/showcase/public/book-demo', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'emergency', label: 'Emergency', path: '/showcase/public/emergency', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'search', label: 'Search', path: '/showcase/public/search', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'email-confirmed', label: 'Email Confirmed', path: '/showcase/public/email-confirmed', journey: 'public', persona: 'guest', chrome: 'family' },
	{ id: 'tribute', label: 'Tribute Page', path: '/showcase/public/tribute', journey: 'public', persona: 'guest', chrome: 'family' },

	// --- Family member journey ---
	{ id: 'register-chooser', label: 'Register (Account Type)', path: '/showcase/family/register-chooser', journey: 'family', persona: 'guest', chrome: 'family' },
	{ id: 'family-register', label: 'Register (Loved One)', path: '/showcase/family/register', journey: 'family', persona: 'guest', chrome: 'family' },
	{ id: 'family-login', label: 'Login', path: '/showcase/family/login', journey: 'family', persona: 'guest', chrome: 'family' },
	{ id: 'reset-password', label: 'Reset Password', path: '/showcase/family/reset-password', journey: 'family', persona: 'guest', chrome: 'family' },
	{ id: 'my-portal', label: 'My Portal', path: '/showcase/family/my-portal', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'family-profile', label: 'My Profile', path: '/showcase/family/profile', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'profile-settings', label: 'Profile Settings', path: '/showcase/family/profile-settings', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'family-schedule', label: 'Schedule & Calculator', path: '/showcase/family/schedule', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'schedule-new', label: 'Schedule (New)', path: '/showcase/family/schedule-new', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'schedule-memorial', label: 'Schedule (Memorial)', path: '/showcase/family/schedule-memorial', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'calculator', label: 'Calculator', path: '/showcase/family/calculator', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'book', label: 'Book a Service', path: '/showcase/family/book', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'family-payment', label: 'Payment', path: '/showcase/family/payment', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'checkout-success', label: 'Checkout Success', path: '/showcase/family/checkout-success', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'family-receipt', label: 'Receipt', path: '/showcase/family/receipt', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'pay-invoice', label: 'Pay Invoice', path: '/showcase/family/pay-invoice', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'pay-invoice-receipt', label: 'Invoice Receipt', path: '/showcase/family/pay-invoice-receipt', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'receipt-detail', label: 'Receipt Detail', path: '/showcase/family/receipt-detail', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'manage-streams', label: 'Manage Streams', path: '/showcase/family/manage-streams', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'slideshow', label: 'Slideshow Generator', path: '/showcase/family/slideshow', journey: 'family', persona: 'family', chrome: 'family' },
	{ id: 'family-memorial', label: 'Memorial Page', path: '/showcase/family/memorial', journey: 'family', persona: 'family', chrome: 'family' },

	// --- Funeral Director journey ---
	{ id: 'fd-register', label: 'Register (Funeral Director)', path: '/showcase/fd/register-funeral-director', journey: 'fd', persona: 'guest', chrome: 'family' },
	{ id: 'fd-register-home', label: 'Register (Funeral Home)', path: '/showcase/fd/register-funeral-home', journey: 'fd', persona: 'guest', chrome: 'family' },
	{ id: 'fd-dashboard', label: 'FD Dashboard', path: '/showcase/fd/dashboard', journey: 'fd', persona: 'fd', chrome: 'family' },

	// --- Admin journey ---
	{ id: 'admin-login', label: 'Admin Login', path: '/showcase/admin/login', journey: 'admin', persona: 'guest', chrome: 'family' },
	{ id: 'admin-dashboard', label: 'Admin Dashboard', path: '/showcase/admin/dashboard', journey: 'admin', persona: 'admin', chrome: 'admin' },
	{ id: 'admin-memorials', label: 'Manage Memorials', path: '/showcase/admin/memorials', journey: 'admin', persona: 'admin', chrome: 'admin' },
	{ id: 'admin-memorial-detail', label: 'Memorial Detail', path: '/showcase/admin/memorial-detail', journey: 'admin', persona: 'admin', chrome: 'admin' },
	{ id: 'admin-memorial-switcher', label: 'Memorial Switcher', path: '/showcase/admin/memorial-switcher', journey: 'admin', persona: 'admin', chrome: 'admin' },
	{ id: 'admin-receipts', label: 'Receipts', path: '/showcase/admin/receipts', journey: 'admin', persona: 'admin', chrome: 'admin' },
	{ id: 'admin-receipt-detail', label: 'Receipt Detail', path: '/showcase/admin/receipt-detail', journey: 'admin', persona: 'admin', chrome: 'admin' },
	{ id: 'admin-users', label: 'Manage Users', path: '/showcase/admin/users', journey: 'admin', persona: 'admin', chrome: 'admin' },
	{ id: 'admin-user-detail', label: 'User Detail', path: '/showcase/admin/user-detail', journey: 'admin', persona: 'admin', chrome: 'admin' },
	{ id: 'admin-funeral-directors', label: 'Funeral Directors', path: '/showcase/admin/funeral-directors', journey: 'admin', persona: 'admin', chrome: 'admin' },
	{ id: 'admin-audit-logs', label: 'Audit Logs', path: '/showcase/admin/audit-logs', journey: 'admin', persona: 'admin', chrome: 'admin' },
	{ id: 'admin-email-logs', label: 'Email Logs', path: '/showcase/admin/email-logs', journey: 'admin', persona: 'admin', chrome: 'admin' },
	{ id: 'admin-blog', label: 'Blog (CMS)', path: '/showcase/admin/blog', journey: 'admin', persona: 'admin', chrome: 'admin' },

	// --- Streaming / video (static mockups) ---
	{ id: 'stream-camera', label: 'Camera (Broadcast)', path: '/showcase/streaming/camera', journey: 'streaming', persona: 'family', chrome: 'none' },
	{ id: 'stream-hls', label: 'HLS Player', path: '/showcase/streaming/hls', journey: 'streaming', persona: 'guest', chrome: 'none' },
	{ id: 'stream-whep', label: 'WHEP Player', path: '/showcase/streaming/whep', journey: 'streaming', persona: 'guest', chrome: 'none' },
	{ id: 'stream-mobile', label: 'Mobile Stream', path: '/showcase/streaming/mobile', journey: 'streaming', persona: 'family', chrome: 'none' },
	{ id: 'test-stream', label: 'Test Stream', path: '/showcase/streaming/test-stream', journey: 'streaming', persona: 'family', chrome: 'none' }
];

/** Ordered screens for a given journey (used by the stepper). */
export function journeyScreens(journey: Journey): ShowcaseScreen[] {
	return SCREENS.filter((s) => s.journey === journey);
}

/** Lookup a screen by its route path. */
export function screenByPath(path: string): ShowcaseScreen | undefined {
	return SCREENS.find((s) => s.path === path);
}

/** Journey definitions for the launcher buttons / sitemap subgraphs. */
export const JOURNEYS: { key: Journey; label: string; start: string }[] = [
	{ key: 'public', label: 'Public / Marketing', start: '/showcase/home' },
	{ key: 'family', label: 'Family Member', start: '/showcase/family/register-chooser' },
	{ key: 'fd', label: 'Funeral Director', start: '/showcase/fd/register-funeral-director' },
	{ key: 'admin', label: 'Administrator', start: '/showcase/admin/login' },
	{ key: 'streaming', label: 'Streaming / Video', start: '/showcase/streaming/camera' }
];
