<script lang="ts">
	import { page } from '$app/stores';
	import { goto, beforeNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { user } from '$lib/auth';
	import { adminUser } from '$lib/stores/adminUser';
	import {
		SCREENS,
		JOURNEYS,
		journeyScreens,
		screenByPath,
		neighborsOf,
		hubFor
	} from './_lib/manifest';
	import { publicUserFor, adminUserPersona } from './_lib/personas';
	import { showcaseHref } from './_lib/routeMap';
	import showcaseData from './_lib/showcase-data.json';

	/** Per-route prefilled form values (field id/name/type -> value). */
	const FORMS: Record<string, Record<string, string>> =
		(showcaseData as { forms?: Record<string, Record<string, string>> }).forms ?? {};

	/** Explicit per-screen submit/CTA destinations (showcase path -> showcase path). */
	const SUBMIT_DEST: Record<string, string> =
		(showcaseData as { submitDest?: Record<string, string> }).submitDest ?? {};

	let { children } = $props();

	let viewport = $state<'desktop' | 'mobile'>('desktop');
	// Measured so the spacer matches the (now wrap-capable) control bar height.
	let barHeight = $state(44);

	function onSelect(e: Event) {
		const target = e.currentTarget as HTMLSelectElement;
		if (target.value) goto(target.value);
	}

	const current = $derived(screenByPath($page.url.pathname));
	const isLanding = $derived($page.url.pathname === '/showcase');

	// Branching navigation: the current screen's outgoing connections (spokes).
	const neighbors = $derived(current ? neighborsOf(current) : []);
	// The journey hub (squid body); offered as a "return" button when off-hub.
	const hubButton = $derived(current && !current.hub ? hubFor(current.journey) : undefined);
	// Avoid showing the hub twice when it is also a regular neighbor.
	const spokes = $derived(neighbors.filter((n) => !hubButton || n.id !== hubButton.id));

	const chrome = $derived(current?.chrome ?? 'none');

	// Re-assert the mocked persona on every navigation so the root layout's
	// auth effect (which sets user -> null) cannot leave us logged out.
	$effect(() => {
		const persona = current?.persona ?? 'guest';
		user.set(publicUserFor(persona));
		adminUser.set(persona === 'admin' ? adminUserPersona : null);
	});

	// Neutralize the root layout chrome (real Navbar/Footer/tracking) while in
	// the showcase; we render our own controlled chrome below.
	$effect(() => {
		if (typeof document === 'undefined') return;
		document.body.classList.add('sc-active');
		return () => document.body.classList.remove('sc-active');
	});

	const hasForm = $derived(typeof FORMS[$page.url.pathname] === 'object');

	// Set an input's value via the native setter so framework bindings (Svelte
	// bind:value, which reads el.value on the 'input' event) reliably observe
	// the change, then notify all listeners.
	function setFieldValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
		const proto =
			el instanceof HTMLTextAreaElement
				? HTMLTextAreaElement.prototype
				: el instanceof HTMLSelectElement
					? HTMLSelectElement.prototype
					: HTMLInputElement.prototype;
		const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
		if (setter) setter.call(el, value);
		else el.value = value;
		el.dispatchEvent(new Event('input', { bubbles: true }));
		el.dispatchEvent(new Event('change', { bubbles: true }));
	}

	// Prefill the current screen's form fields from showcase-data.json so the
	// site can be browsed without typing. Only fills empty, visible fields.
	function autofillForms(path: string): number {
		const values = FORMS[path];
		if (!values || typeof document === 'undefined') return 0;
		const root = document.querySelector('.sc-viewport');
		if (!root) return 0;
		const fields = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
			'input, textarea, select'
		);
		let filled = 0;
		fields.forEach((el) => {
			const input = el as HTMLInputElement;
			const type = (input.getAttribute('type') || input.type || 'text').toLowerCase();
			if (['hidden', 'checkbox', 'radio', 'submit', 'button', 'file'].includes(type)) return;
			if (input.name === 'website') return; // skip anti-spam honeypot
			if (input.value) return; // never overwrite existing input
			const rawKey = input.id || input.name || '';
			const camelKey = rawKey.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
			let val: string | undefined = values[rawKey] ?? values[camelKey] ?? values[input.name];
			if (val == null && type === 'password') val = values.password;
			if (val == null && type === 'email') val = values.email;
			if (val == null && type === 'tel') val = values.phone;
			if (val == null) return;
			setFieldValue(input, val);
			filled++;
		});
		return filled;
	}

	// Manual trigger wired to the control-bar "Fill" button.
	function fillNow() {
		autofillForms($page.url.pathname);
	}

	// Autofill on navigation. Reused real components can mount asynchronously and
	// some reset their fields on mount, so we observe the viewport for newly
	// added inputs and (re)fill for a short window after each navigation.
	$effect(() => {
		const path = $page.url.pathname;
		if (typeof document === 'undefined' || !FORMS[path]) return;
		let stopped = false;
		const run = () => {
			if (!stopped) autofillForms(path);
		};
		run();
		const root = document.querySelector('.sc-viewport');
		const observer = root ? new MutationObserver(() => run()) : null;
		observer?.observe(root!, { childList: true, subtree: true });
		// Safety-net polling in case mutations are batched away.
		let attempts = 0;
		const poll = setInterval(() => {
			run();
			if (++attempts >= 16) clearInterval(poll);
		}, 150);
		// Stop after a few seconds so we never fight the user's own edits.
		const stop = setTimeout(() => {
			stopped = true;
			observer?.disconnect();
			clearInterval(poll);
		}, 4000);
		return () => {
			stopped = true;
			observer?.disconnect();
			clearInterval(poll);
			clearTimeout(stop);
		};
	});

	/** Next screen path for the current location (computed live for handlers). */
	function advanceFrom(pathname: string): string | undefined {
		const screen = screenByPath(pathname);
		if (!screen) return undefined;
		const list = journeyScreens(screen.journey);
		const i = list.findIndex((s) => s.id === screen.id);
		return i >= 0 && i < list.length - 1 ? list[i + 1].path : undefined;
	}

	/** Resolve where a form/CTA submit on `path` should land (explicit, else next step). */
	function submitDestFor(path: string): string | undefined {
		return SUBMIT_DEST[path] ?? advanceFrom(path);
	}

	// Router-level containment: catch EVERY client-side navigation (programmatic
	// goto(), link clicks, action redirects) and keep it inside the showcase.
	// Cancels any same-origin navigation leaving /showcase and reroutes to the
	// mapped showcase equivalent. Navigations already within /showcase pass through.
	beforeNavigate((nav) => {
		const to = nav.to?.url;
		if (!to) return; // external origin -> let it go / browser handles
		const path = to.pathname;
		if (path.startsWith('/showcase')) return; // already contained, no loop
		nav.cancel();
		const dest = showcaseHref(path + to.search);
		if (dest) goto(dest);
	});

	// Global CTA rewiring: keep all internal navigation inside the showcase.
	// - Internal <a> links are remapped to their /showcase equivalent (or no-op).
	// - Form submits resolve to an explicit destination (else the next journey step).
	onMount(() => {
		const inViewport = (el: EventTarget | null) =>
			el instanceof Element && !!el.closest('.sc-viewport');

		const onClick = (e: MouseEvent) => {
			const anchor = (e.target as HTMLElement | null)?.closest?.('a');
			if (!anchor || !inViewport(anchor)) return;
			const href = anchor.getAttribute('href');
			if (!href || !href.startsWith('/') || href.startsWith('/showcase')) return;
			e.preventDefault();
			const dest = showcaseHref(href);
			if (dest) goto(dest);
		};

		const onSubmit = (e: SubmitEvent) => {
			if (!inViewport(e.target)) return;
			// Stop the real component's submit handler (Firebase/server actions)
			// from running, then navigate to the explicit/derived destination.
			e.preventDefault();
			e.stopImmediatePropagation();
			const dest = submitDestFor(window.location.pathname);
			if (dest && dest !== window.location.pathname) goto(dest);
		};

		// Network guard: prevent reused real components from firing same-origin
		// /api/* requests OR external SDK traffic (Firebase/Stripe/Daily/Mux) in
		// the showcase. Returns a benign empty payload so onMount fetches resolve.
		const EXTERNAL_HOSTS = [
			'googleapis.com',
			'gstatic.com',
			'firebaseio.com',
			'identitytoolkit',
			'firestore',
			'firebaseinstallations',
			'cloudfunctions.net',
			'stripe.com',
			'daily.co',
			'mux.com',
			'mux.dev'
		];
		const isApi = (url: string) => /^\/api\//.test(url) || url.includes('/api/');
		const isExternal = (url: string) => EXTERNAL_HOSTS.some((h) => url.includes(h));
		const shouldBlock = (url: string) => isApi(url) || isExternal(url);

		const realFetch = window.fetch.bind(window);
		window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
			const url =
				typeof input === 'string'
					? input
					: input instanceof URL
						? input.toString()
						: input.url;
			if (shouldBlock(url)) {
				return new Response(JSON.stringify({ ok: true, mock: true, data: [], items: [] }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			return realFetch(input, init);
		}) as typeof window.fetch;

		// Light XHR guard: Firestore/analytics often use XHR. No-op blocked hosts.
		const RealXHROpen = XMLHttpRequest.prototype.open;
		XMLHttpRequest.prototype.open = function (
			this: XMLHttpRequest,
			method: string,
			url: string | URL,
			...rest: unknown[]
		) {
			const u = typeof url === 'string' ? url : url.toString();
			if (shouldBlock(u)) {
				// Redirect the request to a harmless no-op data: URL.
				return RealXHROpen.call(this, method, 'data:application/json,{}', true);
			}
			// @ts-expect-error - forward original signature
			return RealXHROpen.call(this, method, url, ...rest);
		} as typeof XMLHttpRequest.prototype.open;

		document.addEventListener('click', onClick, true);
		document.addEventListener('submit', onSubmit, true);
		return () => {
			window.fetch = realFetch;
			XMLHttpRequest.prototype.open = RealXHROpen;
			document.removeEventListener('click', onClick, true);
			document.removeEventListener('submit', onSubmit, true);
		};
	});
</script>

<!-- Showcase control bar (fixed) -->
<div class="sc-bar" bind:clientHeight={barHeight}>
	<a class="sc-brand" href="/showcase">◆ UI Showcase</a>

	<select
		class="sc-select"
		value={current?.path ?? ''}
		onchange={onSelect}
	>
		<option value="" disabled>Jump to screen…</option>
		{#each JOURNEYS as j (j.key)}
			<optgroup label={j.label}>
				{#each SCREENS.filter((s) => s.journey === j.key) as s (s.id)}
					<option value={s.path}>{s.label}</option>
				{/each}
			</optgroup>
		{/each}
	</select>

	<div class="sc-steps">
		{#if current}
			{#if hubButton}
				<button class="sc-btn sc-hub" title="Return to journey hub" onclick={() => goto(hubButton.path)}>
					↩ {hubButton.label}
				</button>
			{/if}
			{#each spokes as n (n.id)}
				<button class="sc-btn sc-goto" onclick={() => goto(n.path)}>{n.label} ›</button>
			{/each}
			{#if spokes.length === 0 && !hubButton}
				<span class="sc-step-label">No outgoing links</span>
			{/if}
		{:else}
			<span class="sc-step-label">Sitemap</span>
		{/if}
	</div>

	<div class="sc-right">
		{#if hasForm}
			<button class="sc-btn sc-fill" title="Auto-fill this form with demo data" onclick={fillNow}>
				⤵ Fill
			</button>
		{/if}
		<span
			class="sc-persona"
			class:admin={current?.persona === 'admin'}
			class:family={current?.persona === 'family'}
			class:fd={current?.persona === 'fd'}
		>
			{current?.persona ?? 'guest'}
		</span>
		<button
			class="sc-btn"
			title="Toggle viewport"
			onclick={() => (viewport = viewport === 'desktop' ? 'mobile' : 'desktop')}
		>
			{viewport === 'desktop' ? '🖥 Desktop' : '📱 Mobile'}
		</button>
	</div>
</div>

<div class="sc-spacer" style="height: {barHeight}px"></div>

<div class="sc-viewport" class:mobile={viewport === 'mobile'}>
	{#if chrome === 'family' && !isLanding}
		<Navbar />
	{/if}

	{@render children?.()}

	{#if chrome === 'family' && !isLanding}
		<Footer />
	{/if}
</div>

<style>
	/* Hide the real root-layout chrome while the showcase is active. */
	:global(body.sc-active nav.sticky.top-0),
	:global(body.sc-active footer.footer) {
		display: none !important;
	}
	/* Let showcase content go full-bleed inside the root <main> wrapper. */
	:global(body.sc-active main.main-content) {
		max-width: none !important;
		padding: 0 !important;
		margin: 0 !important;
	}

	.sc-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 9999;
		min-height: 44px;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.35rem 0.75rem;
		background: #0f172a;
		color: #e2e8f0;
		font-family: ui-sans-serif, system-ui, sans-serif;
		font-size: 0.8125rem;
		border-bottom: 1px solid #1e293b;
		box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
	}
	.sc-spacer {
		height: 44px;
	}
	.sc-brand {
		font-weight: 700;
		color: #d5ba7f;
		text-decoration: none;
		white-space: nowrap;
	}
	.sc-select {
		background: #1e293b;
		color: #e2e8f0;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		padding: 0.25rem 0.5rem;
		max-width: 220px;
	}
	.sc-steps {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem;
		margin: 0 auto;
		max-width: 60%;
	}
	.sc-hub {
		background: #334155;
		border-color: #475569;
		font-weight: 600;
	}
	.sc-goto {
		background: #1d2b45;
		border-color: #2f4368;
	}
	.sc-goto:hover:not(:disabled) {
		background: #2f4368;
	}
	.sc-step-label {
		min-width: 160px;
		text-align: center;
		opacity: 0.9;
	}
	.sc-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: auto;
	}
	.sc-btn {
		background: #1e293b;
		color: #e2e8f0;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		padding: 0.25rem 0.625rem;
		cursor: pointer;
		white-space: nowrap;
	}
	.sc-btn:hover:not(:disabled) {
		background: #334155;
	}
	.sc-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.sc-fill {
		background: #d5ba7f;
		color: #1a1a1a;
		border-color: #d5ba7f;
		font-weight: 700;
	}
	.sc-fill:hover:not(:disabled) {
		background: #c4a86a;
	}
	.sc-persona {
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.6875rem;
		font-weight: 700;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		background: #334155;
	}
	.sc-persona.admin {
		background: #7c2d12;
		color: #fed7aa;
	}
	.sc-persona.family {
		background: #14532d;
		color: #bbf7d0;
	}
	.sc-viewport.mobile {
		max-width: 420px;
		margin: 0 auto;
		border-left: 1px solid #e2e8f0;
		border-right: 1px solid #e2e8f0;
		min-height: 100vh;
		box-shadow: 0 0 0 100vmax rgba(15, 23, 42, 0.06);
	}
	/* Print: drop the fixed control bar so printed pages start at the content. */
	@media print {
		.sc-bar,
		.sc-spacer {
			display: none !important;
		}
		.sc-viewport.mobile {
			max-width: none;
			border: none;
			box-shadow: none;
		}
	}
</style>
