<!--
  reCAPTCHA v3 Provider Component
  Loads the reCAPTCHA script and provides context for forms
-->
<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	const PUBLIC_RECAPTCHA_SITE_KEY = env.PUBLIC_RECAPTCHA_SITE_KEY;

	export const badge: 'bottomright' | 'bottomleft' | 'inline' = 'bottomright';

	let scriptLoaded = false;
	let scriptError = false;
	let scriptRequested = false;

	function loadRecaptchaScript(): void {
		if (scriptRequested) return;
		scriptRequested = true;

		// Check if reCAPTCHA is already loaded
		if (window.grecaptcha) {
			scriptLoaded = true;
			return;
		}

		// Load reCAPTCHA script
		const script = document.createElement('script');
		script.src = `https://www.google.com/recaptcha/api.js?render=${PUBLIC_RECAPTCHA_SITE_KEY}`;
		script.async = true;
		script.defer = true;

		script.onload = () => {
			scriptLoaded = true;
			console.log('reCAPTCHA v3 loaded successfully');
		};

		script.onerror = () => {
			scriptError = true;
			console.error('Failed to load reCAPTCHA v3 script');
		};

		document.head.appendChild(script);
	}

	// reCAPTCHA isn't used anywhere under /admin (only public forms like
	// /register, /contact, /book-demo, /profile call executeRecaptcha), and
	// its fixed bottom-right badge overlaps admin UI (e.g. the mobile bottom
	// tab bar on memorial pages). Skip loading it there entirely, and hide
	// the badge via CSS if it was already loaded from a prior public-page
	// visit earlier in the same session.
	$: isAdminRoute = $page.route.id?.startsWith('/admin') ?? false;

	$: if (browser) {
		document.body.classList.toggle('admin-recaptcha-hidden', isAdminRoute);
		if (!isAdminRoute) {
			loadRecaptchaScript();
		}
	}
</script>

<!-- Slot for child components -->
<slot {scriptLoaded} {scriptError} />

{#if scriptError}
	<div class="recaptcha-error" role="alert">
		<p>⚠️ Security verification unavailable. Please refresh the page or contact support.</p>
	</div>
{/if}

<style>
	/* reCAPTCHA badge positioning */
	:global(.grecaptcha-badge) {
		z-index: 1000;
	}

	:global(.grecaptcha-badge.bottomright) {
		bottom: 14px;
		right: 14px;
	}

	:global(.grecaptcha-badge.bottomleft) {
		bottom: 14px;
		left: 14px;
	}

	/* reCAPTCHA isn't used in the admin panel and its badge overlaps admin
	   UI (e.g. the mobile bottom tab bar on memorial pages) - hide it there. */
	:global(body.admin-recaptcha-hidden .grecaptcha-badge) {
		display: none !important;
	}

	.recaptcha-error {
		background: #fee2e2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 12px;
		border-radius: 6px;
		margin: 10px 0;
		font-size: 14px;
	}
</style>
