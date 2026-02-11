> **⚠️ ARCHIVED** — This document is outdated and kept for historical reference only.
> The authoritative project doc is [`DevDocs/1-27-26-master-wbs.md`](../1-27-26-master-wbs.md).
> Historical: SPA migration was completed. This was the migration guide.

# King Law Firm - SPA Refactor Master Plan

## Executive Summary

This document provides a step-by-step plan to refactor the King Law Firm case management system from a hybrid SSR/CSR architecture to a **full Single-Page Application (SPA)** using SvelteKit's adapter-static with fallback mode.

**Current State**: Hybrid SSR (server-side rendering on first load) + CSR (client-side routing)  
**Target State**: Pure SPA (client-side only, all data via API calls)  
**Framework**: SvelteKit 2.x with adapter-static  
**Database**: Turso (SQLite) - no changes required  
**Authentication**: Lucia Auth with session cookies - minimal changes  

---

## Prerequisites

Before starting, ensure you have:
- [x] Current project running successfully
- [x] All existing tests passing
- [x] Git repository with clean working directory
- [x] Architecture documentation reviewed (`system-architecture-report.md`)
- [x] Feature requirements understood (`lawyer-dashboard-flow.md`)

---

## Phase 1: Project Configuration (1-2 hours)

### Step 1.1: Install adapter-static

```bash
npm install -D @sveltejs/adapter-static
npm remove @sveltejs/adapter-auto  # Remove default adapter
```

**Files to modify**: `package.json`

### Step 1.2: Update svelte.config.js

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '200.html',  // SPA fallback page
			precompress: false,
			strict: true
		}),
		
		// Important: define API routes that should NOT be prerendered
		prerender: {
			entries: []  // Don't prerender any pages by default
		}
	}
};

export default config;
```

**Why**: This configures SvelteKit to build a pure SPA with a fallback HTML file for all routes.

### Step 1.3: Update root layout to disable SSR

```js
// src/routes/+layout.js
export const ssr = false;  // Disable SSR globally
export const prerender = false;  // Don't prerender
export const csr = true;  // Enable client-side routing
```

**Files to create**: `src/routes/+layout.js`  
**Why**: This tells SvelteKit to run everything on the client side.

### Step 1.4: Verify configuration

```bash
npm run build
```

**Expected output**: Build completes successfully, creates `build/200.html` fallback page  
**If errors**: Check that no `+page.server.ts` or `+layout.server.ts` files are still being used

---

## Phase 2: API Endpoint Consolidation (3-4 hours)

### Step 2.1: Audit existing API endpoints

**Action**: List all API endpoints that currently exist:

```bash
# Find all +server.ts/js files
find src/routes -name "+server.*"
```

**Expected endpoints** (from architecture report):
- `/api/cases` - GET (list), POST (create)
- `/api/cases/[id]` - GET (detail), PATCH (update), DELETE (archive)
- `/api/documents/upload` - POST
- `/api/documents/[id]` - GET (download)
- `/api/documents/[id]/delete` - DELETE
- `/api/invoices` - GET (list), POST (create)
- `/api/invoices/[id]` - PATCH (update), DELETE
- `/api/messages` - GET (list), POST (send)
- `/api/messages/mark-read` - POST
- `/api/messages/unread-count` - GET
- `/api/auth/login` - POST
- `/api/auth/logout` - POST
- `/api/auth/register` - POST

### Step 2.2: Create missing API endpoints

For each feature in `lawyer-dashboard-flow.md`, ensure a corresponding API endpoint exists:

**Template for new endpoints**:

```typescript
// src/routes/api/[resource]/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	// 1. Verify authentication
	if (!locals.user) {
		return error(401, 'Unauthorized');
	}
	
	// 2. Extract query parameters
	const filter = url.searchParams.get('filter');
	
	// 3. Perform database query
	const results = await db.query('...');
	
	// 4. Verify authorization (if needed)
	if (results.ownerId !== locals.user.id && locals.user.role !== 'admin') {
		return error(403, 'Forbidden');
	}
	
	// 5. Return JSON response
	return json(results);
};
```

**Key endpoints to create** (if missing):

1. **`/api/users` (GET)** - List all clients (for lawyer case creation dropdown)
2. **`/api/cases/stats` (GET)** - Dashboard statistics
3. **`/api/invoices/[id]` (GET)** - Single invoice details
4. **`/api/messages/[caseId]` (GET)** - Messages for specific case

### Step 2.3: Standardize API response format

All API responses should follow consistent structure:

```typescript
// Success response
{
	success: true,
	data: { /* actual data */ },
	message?: string
}

// Error response
{
	success: false,
	error: string,
	field?: string  // For form validation errors
}
```

**Files to update**: All `+server.ts` files

### Step 2.4: Add CORS headers (if needed for external APIs)

```typescript
// src/hooks.server.ts
export async function handle({ event, resolve }) {
	// Allow credentials for same-origin
	const response = await resolve(event);
	
	// Only needed if accessing from different origin
	// response.headers.set('Access-Control-Allow-Credentials', 'true');
	
	return response;
}
```

---

## Phase 3: Remove Server-Side Load Functions (4-6 hours)

### Step 3.1: Identify all server load functions

```bash
# Find all +page.server.ts and +layout.server.ts files
find src/routes -name "+*.server.*"
```

### Step 3.2: Convert lawyer dashboard load function

**Before** (`src/routes/dashboard/lawyer/+page.server.ts`):

```typescript
export async function load({ locals }) {
	const user = locals.user;
	if (!user || user.role !== 'lawyer') {
		throw redirect(303, '/login');
	}
	
	const cases = await db.getCasesByLawyer(user.id);
	const stats = await db.getLawyerStats(user.id);
	
	return { cases, stats };
}
```

**After** - DELETE `+page.server.ts` and CREATE `+page.ts`:

```typescript
// src/routes/dashboard/lawyer/+page.ts
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	// Get user from parent layout
	const { user } = await parent();
	
	if (!user || user.role !== 'lawyer') {
		throw redirect(303, '/login');
	}
	
	// Fetch from API endpoints
	const [casesRes, statsRes] = await Promise.all([
		fetch('/api/cases'),
		fetch('/api/cases/stats')
	]);
	
	if (!casesRes.ok || !statsRes.ok) {
		throw error(500, 'Failed to load dashboard data');
	}
	
	const cases = await casesRes.json();
	const stats = await statsRes.json();
	
	return { cases, stats };
};
```

### Step 3.3: Convert case detail load function

**Before** (`src/routes/dashboard/lawyer/case/[id]/+page.server.ts`):

```typescript
export async function load({ params, locals }) {
	const caseData = await db.getCaseById(params.id);
	const documents = await db.getDocumentsByCase(params.id);
	const invoices = await db.getInvoicesByCase(params.id);
	const messages = await db.getMessagesByCase(params.id);
	
	return { case: caseData, documents, invoices, messages };
}
```

**After** (`src/routes/dashboard/lawyer/case/[id]/+page.ts`):

```typescript
export const load: PageLoad = async ({ params, fetch }) => {
	// Parallel API calls for performance
	const [caseRes, documentsRes, invoicesRes, messagesRes] = await Promise.all([
		fetch(`/api/cases/${params.id}`),
		fetch(`/api/documents?caseId=${params.id}`),
		fetch(`/api/invoices?caseId=${params.id}`),
		fetch(`/api/messages?caseId=${params.id}`)
	]);
	
	// Check responses
	if (!caseRes.ok) {
		throw error(caseRes.status, 'Case not found');
	}
	
	return {
		case: await caseRes.json(),
		documents: await documentsRes.json(),
		invoices: await invoicesRes.json(),
		messages: await messagesRes.json()
	};
};
```

### Step 3.4: Update root layout for authentication

**Before** (`src/routes/+layout.server.ts`):

```typescript
export async function load({ locals }) {
	return {
		user: locals.user
	};
}
```

**After** - CREATE `/api/auth/me` endpoint and update layout:

```typescript
// src/routes/api/auth/me/+server.ts
import { json } from '@sveltejs/kit';

export async function GET({ locals }) {
	return json({ user: locals.user || null });
}
```

```typescript
// src/routes/+layout.ts
export const load: LayoutLoad = async ({ fetch }) => {
	const res = await fetch('/api/auth/me');
	const { user } = await res.json();
	
	return { user };
};
```

**Files to delete**: All `+page.server.ts` and `+layout.server.ts` files  
**Files to create**: Equivalent `+page.ts` and `+layout.ts` files

---

## Phase 4: Client-Side State Management (3-4 hours)

### Step 4.1: Create global stores

```typescript
// src/lib/stores/auth.ts
import { writable, derived } from 'svelte/store';
import type { User } from '$lib/types';

export const user = writable<User | null>(null);
export const isAuthenticated = derived(user, $user => !!$user);
export const isLawyer = derived(user, $user => $user?.role === 'lawyer');
export const isClient = derived(user, $user => $user?.role === 'client');
```

```typescript
// src/lib/stores/cases.ts
import { writable } from 'svelte/store';
import type { Case } from '$lib/types';

export const cases = writable<Case[]>([]);
export const selectedCase = writable<Case | null>(null);
export const loading = writable(false);
export const error = writable<string | null>(null);

// Actions
export async function loadCases() {
	loading.set(true);
	error.set(null);
	
	try {
		const res = await fetch('/api/cases');
		if (!res.ok) throw new Error('Failed to load cases');
		
		const data = await res.json();
		cases.set(data);
	} catch (err) {
		error.set(err.message);
	} finally {
		loading.set(false);
	}
}

export async function createCase(caseData: Partial<Case>) {
	const res = await fetch('/api/cases', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(caseData)
	});
	
	if (!res.ok) throw new Error('Failed to create case');
	
	const newCase = await res.json();
	cases.update(list => [...list, newCase]);
	
	return newCase;
}
```

```typescript
// src/lib/stores/notifications.ts
import { writable } from 'svelte/store';

export const unreadCounts = writable<Record<string, number>>({});

let pollInterval: NodeJS.Timeout | null = null;

export function startPolling() {
	if (pollInterval) return;
	
	pollInterval = setInterval(async () => {
		const res = await fetch('/api/messages/unread-count');
		if (res.ok) {
			const counts = await res.json();
			unreadCounts.set(counts);
		}
	}, 5000);
}

export function stopPolling() {
	if (pollInterval) {
		clearInterval(pollInterval);
		pollInterval = null;
	}
}
```

### Step 4.2: Create API client utility

```typescript
// src/lib/api/client.ts
import { goto } from '$app/navigation';

interface ApiOptions extends RequestInit {
	params?: Record<string, string>;
}

export class ApiClient {
	private baseUrl = '';
	
	async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
		const { params, ...fetchOptions } = options;
		
		// Build URL with query params
		const url = new URL(endpoint, window.location.origin);
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				url.searchParams.set(key, value);
			});
		}
		
		// Make request
		const response = await fetch(url.toString(), {
			credentials: 'include',  // Include cookies
			...fetchOptions
		});
		
		// Handle authentication errors
		if (response.status === 401) {
			goto('/login');
			throw new Error('Unauthorized');
		}
		
		// Handle other errors
		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Unknown error' }));
			throw new Error(error.error || `HTTP ${response.status}`);
		}
		
		return response.json();
	}
	
	get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
		return this.request<T>(endpoint, { method: 'GET', params });
	}
	
	post<T>(endpoint: string, data: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
	}
	
	patch<T>(endpoint: string, data: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
	}
	
	delete<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, { method: 'DELETE' });
	}
}

export const api = new ApiClient();
```

### Step 4.3: Update components to use stores

**Example: Lawyer Dashboard Component**

```svelte
<!-- src/routes/dashboard/lawyer/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { cases, loadCases, loading, error } from '$lib/stores/cases';
	import { unreadCounts, startPolling, stopPolling } from '$lib/stores/notifications';
	import CreateCaseModal from '$lib/components/CreateCaseModal.svelte';
	
	let showCreateModal = false;
	
	onMount(() => {
		loadCases();
		startPolling();
		
		return () => {
			stopPolling();
		};
	});
</script>

{#if $loading}
	<div class="loader">Loading cases...</div>
{:else if $error}
	<div class="error">{$error}</div>
{:else}
	<div class="dashboard">
		<header>
			<h1>My Cases</h1>
			<button on:click={() => showCreateModal = true}>
				Create New Case
			</button>
		</header>
		
		<div class="cases-grid">
			{#each $cases as case}
				<div class="case-card">
					<h3>{case.title}</h3>
					<p>{case.clientName}</p>
					{#if $unreadCounts[case.id]}
						<span class="badge">{$unreadCounts[case.id]}</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if showCreateModal}
	<CreateCaseModal on:close={() => showCreateModal = false} />
{/if}
```

---

## Phase 5: Form Handling Refactor (2-3 hours)

### Step 5.1: Remove form actions

**Before** (`+page.server.ts` with form actions):

```typescript
export const actions = {
	createCase: async ({ request, locals }) => {
		const data = await request.formData();
		// ... handle form
	}
};
```

**After** - Use client-side form submission:

```svelte
<script lang="ts">
	import { api } from '$lib/api/client';
	
	let formData = {
		clientId: '',
		title: '',
		description: ''
	};
	
	let submitting = false;
	let formError = '';
	
	async function handleSubmit() {
		submitting = true;
		formError = '';
		
		try {
			await api.post('/api/cases', formData);
			// Success - redirect or update UI
			goto('/dashboard/lawyer');
		} catch (err) {
			formError = err.message;
		} finally {
			submitting = false;
		}
	}
</script>

<form on:submit|preventDefault={handleSubmit}>
	<select bind:value={formData.clientId} required>
		<option value="">Select Client</option>
		<!-- Options populated from API -->
	</select>
	
	<input
		type="text"
		bind:value={formData.title}
		placeholder="Case Title"
		required
	/>
	
	<textarea
		bind:value={formData.description}
		placeholder="Description"
		required
	/>
	
	{#if formError}
		<div class="error">{formError}</div>
	{/if}
	
	<button type="submit" disabled={submitting}>
		{submitting ? 'Creating...' : 'Create Case'}
	</button>
</form>
```

### Step 5.2: Update file upload handling

```svelte
<script lang="ts">
	async function uploadDocument(file: File, caseId: string) {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('caseId', caseId);
		
		const res = await fetch('/api/documents/upload', {
			method: 'POST',
			body: formData  // Don't set Content-Type, browser will set with boundary
		});
		
		if (!res.ok) throw new Error('Upload failed');
		
		return res.json();
	}
</script>
```

---

## Phase 6: Authentication Flow Update (2-3 hours)

### Step 6.1: Update login page

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/auth';
	
	let username = '';
	let password = '';
	let error = '';
	let loading = false;
	
	async function login() {
		loading = true;
		error = '';
		
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});
			
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Login failed');
			}
			
			const userData = await res.json();
			user.set(userData.user);
			
			// Redirect based on role
			const redirectPath = userData.user.role === 'lawyer' 
				? '/dashboard/lawyer' 
				: '/dashboard/client';
			
			goto(redirectPath);
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

<form on:submit|preventDefault={login}>
	<h1>Login</h1>
	
	<input
		type="text"
		bind:value={username}
		placeholder="Username"
		required
	/>
	
	<input
		type="password"
		bind:value={password}
		placeholder="Password"
		required
	/>
	
	{#if error}
		<div class="error">{error}</div>
	{/if}
	
	<button type="submit" disabled={loading}>
		{loading ? 'Logging in...' : 'Login'}
	</button>
</form>
```

### Step 6.2: Create route guards

```typescript
// src/lib/guards/auth.ts
import { get } from 'svelte/store';
import { user } from '$lib/stores/auth';
import { goto } from '$app/navigation';

export function requireAuth() {
	const currentUser = get(user);
	if (!currentUser) {
		goto('/login');
		return false;
	}
	return true;
}

export function requireRole(role: 'lawyer' | 'client' | 'admin') {
	const currentUser = get(user);
	if (!currentUser || currentUser.role !== role) {
		goto('/unauthorized');
		return false;
	}
	return true;
}
```

**Use in page load functions**:

```typescript
// src/routes/dashboard/lawyer/+page.ts
import { requireRole } from '$lib/guards/auth';

export const load: PageLoad = async ({ fetch }) => {
	requireRole('lawyer');
	
	// ... rest of load function
};
```

---

## Phase 7: Build & Deployment Configuration (1-2 hours)

### Step 7.1: Update build scripts

```json
// package.json
{
	"scripts": {
		"dev": "vite dev",
		"build": "vite build",
		"preview": "vite preview",
		"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
		"check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch"
	}
}
```

### Step 7.2: Configure static adapter output

The build will create:
- `build/` - All static assets
- `build/200.html` - Fallback page for all routes
- `build/_app/` - JavaScript bundles (code-split by route)

### Step 7.3: Add .htaccess for Apache (if deploying to Apache)

```apache
# static/.htaccess
<IfModule mod_rewrite.c>
	RewriteEngine On
	RewriteBase /
	RewriteRule ^200\.html$ - [L]
	RewriteCond %{REQUEST_FILENAME} !-f
	RewriteCond %{REQUEST_FILENAME} !-d
	RewriteRule . /200.html [L]
</IfModule>
```

### Step 7.4: Test production build

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` and test:
- All routes load correctly
- Authentication works
- API calls succeed
- Refresh on any route works (fallback page catches it)

---

## Phase 8: Progressive Enhancement Considerations (Optional)

### Step 8.1: Add loading states

```svelte
<!-- Loading skeleton component -->
<script>
	export let rows = 3;
</script>

<div class="skeleton">
	{#each Array(rows) as _}
		<div class="skeleton-row"></div>
	{/each}
</div>

<style>
	.skeleton-row {
		height: 60px;
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: loading 1.5s infinite;
		margin-bottom: 10px;
		border-radius: 4px;
	}
	
	@keyframes loading {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}
</style>
```

### Step 8.2: Add error boundaries

```svelte
<!-- src/lib/components/ErrorBoundary.svelte -->
<script>
	let { children, fallback } = $props();
	let error = $state(null);
	
	function handleError(err) {
		error = err;
		console.error('Error boundary caught:', err);
	}
</script>

{#if error}
	{#if fallback}
		{@render fallback(error)}
	{:else}
		<div class="error-boundary">
			<h2>Something went wrong</h2>
			<p>{error.message}</p>
			<button on:click={() => error = null}>Try Again</button>
		</div>
	{/if}
{:else}
	{@render children()}
{/if}
```

### Step 8.3: Add offline detection

```svelte
<!-- src/routes/+layout.svelte -->
<script>
	import { onMount } from 'svelte';
	
	let isOnline = $state(true);
	
	onMount(() => {
		isOnline = navigator.onLine;
		
		window.addEventListener('online', () => isOnline = true);
		window.addEventListener('offline', () => isOnline = false);
	});
</script>

{#if !isOnline}
	<div class="offline-banner">
		⚠️ You are currently offline. Some features may not be available.
	</div>
{/if}

<slot />
```

---

## Phase 9: Testing Strategy (2-4 hours)

### Step 9.1: Unit tests for stores

```typescript
// src/lib/stores/cases.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { cases, loadCases } from './cases';

describe('cases store', () => {
	beforeEach(() => {
		cases.set([]);
	});
	
	it('should load cases from API', async () => {
		await loadCases();
		const casesList = get(cases);
		expect(casesList.length).toBeGreaterThan(0);
	});
	
	it('should handle load errors', async () => {
		// Mock fetch to fail
		global.fetch = () => Promise.reject(new Error('Network error'));
		
		await loadCases();
		const errorValue = get(error);
		expect(errorValue).toBeTruthy();
	});
});
```

### Step 9.2: Integration tests for API client

```typescript
// src/lib/api/client.test.ts
import { describe, it, expect } from 'vitest';
import { api } from './client';

describe('API Client', () => {
	it('should fetch cases', async () => {
		const cases = await api.get('/api/cases');
		expect(Array.isArray(cases)).toBe(true);
	});
	
	it('should create case', async () => {
		const newCase = await api.post('/api/cases', {
			clientId: 'test-client',
			title: 'Test Case',
			description: 'Test description'
		});
		
		expect(newCase.id).toBeDefined();
	});
	
	it('should handle 401 errors', async () => {
		// This should redirect to login
		await expect(api.get('/api/protected')).rejects.toThrow('Unauthorized');
	});
});
```

### Step 9.3: E2E tests with Playwright

```typescript
// tests/lawyer-dashboard.spec.ts
import { test, expect } from '@playwright/test';

test('lawyer can create case', async ({ page }) => {
	// Login
	await page.goto('/login');
	await page.fill('input[name="username"]', 'testlawyer');
	await page.fill('input[name="password"]', 'password123');
	await page.click('button[type="submit"]');
	
	// Wait for dashboard
	await expect(page).toHaveURL('/dashboard/lawyer');
	
	// Click create case
	await page.click('text=Create New Case');
	
	// Fill form
	await page.selectOption('select[name="clientId"]', 'client-1');
	await page.fill('input[name="title"]', 'Test Case');
	await page.fill('textarea[name="description"]', 'Test description');
	
	// Submit
	await page.click('button:has-text("Create Case")');
	
	// Verify case appears
	await expect(page.locator('text=Test Case')).toBeVisible();
});
```

### Step 9.4: Manual testing checklist

**Lawyer Dashboard**:
- [ ] Dashboard loads with cases
- [ ] Stats display correctly
- [ ] Can create new case
- [ ] Can filter cases by status
- [ ] Can search cases by title/client
- [ ] Clicking case opens detail page

**Case Detail Page**:
- [ ] All tabs load (Overview, Documents, Invoices, Messages)
- [ ] Can edit case title inline
- [ ] Can change case status
- [ ] Can upload document
- [ ] Can download document
- [ ] Can create invoice
- [ ] Can send message
- [ ] Unread badge updates when message read

**Client Dashboard**:
- [ ] Can view assigned cases
- [ ] Can upload documents
- [ ] Can view invoices
- [ ] Can send messages to lawyer

**Authentication**:
- [ ] Login works for lawyer
- [ ] Login works for client
- [ ] Logout works
- [ ] Protected routes redirect to login
- [ ] Session persists on refresh

---

## Phase 10: Performance Optimization (1-2 hours)

### Step 10.1: Enable code splitting

SvelteKit automatically code-splits by route. Verify in build output:

```bash
npm run build
# Should see output like:
# ├─ chunks/
# ├─ _app/immutable/pages/dashboard-lawyer.*.js
# ├─ _app/immutable/pages/dashboard-client.*.js
```

### Step 10.2: Add route preloading

```svelte
<!-- Preload route on hover -->
<a href="/dashboard/lawyer/case/123" data-sveltekit-preload-data="hover">
	View Case
</a>

<!-- Preload route on viewport (for lists) -->
<a href="/case/456" data-sveltekit-preload-data="viewport">
	Case 456
</a>
```

### Step 10.3: Optimize API calls with caching

```typescript
// src/lib/api/cache.ts
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function cachedFetch<T>(
	url: string,
	options?: RequestInit
): Promise<T> {
	// Only cache GET requests
	if (options?.method && options.method !== 'GET') {
		const res = await fetch(url, options);
		return res.json();
	}
	
	// Check cache
	const cached = cache.get(url);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.data as T;
	}
	
	// Fetch fresh data
	const res = await fetch(url, options);
	const data = await res.json();
	
	// Update cache
	cache.set(url, { data, timestamp: Date.now() });
	
	return data;
}
```

### Step 10.4: Add bundle size analysis

```bash
npm install -D vite-plugin-bundle-stats

# vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import bundleStats from 'vite-plugin-bundle-stats';

export default defineConfig({
	plugins: [
		sveltekit(),
		bundleStats()
	]
});
```

---

## Phase 11: Migration Checklist

### Pre-Migration

- [ ] All tests passing
- [ ] Database backup created
- [ ] Environment variables documented
- [ ] Current production working correctly

### Migration Steps

1. [ ] Create feature branch: `git checkout -b spa-refactor`
2. [ ] Complete Phase 1: Project Configuration
3. [ ] Complete Phase 2: API Consolidation
4. [ ] Complete Phase 3: Remove Server Loads
5. [ ] Complete Phase 4: State Management
6. [ ] Complete Phase 5: Form Handling
7. [ ] Complete Phase 6: Authentication
8. [ ] Complete Phase 7: Build Configuration
9. [ ] Complete Phase 9: Testing
10. [ ] Complete Phase 10: Optimization

### Verification

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Manual testing completed
- [ ] Performance metrics acceptable
- [ ] Bundle size acceptable (< 300KB initial JS)

### Deployment

- [ ] Build production bundle: `npm run build`
- [ ] Test preview: `npm run preview`
- [ ] Deploy to staging environment
- [ ] Test in staging
- [ ] Deploy to production
- [ ] Monitor for errors

---

## Rollback Plan

If issues arise after deployment:

1. **Immediate**: Revert to previous deployment
2. **Database**: Restore from backup if schema changed
3. **Analysis**: Review error logs and identify issue
4. **Fix**: Apply hotfix or continue with rollback
5. **Re-deploy**: Once fix verified in staging

---

## Key Differences Summary

### Before (SSR/CSR Hybrid)

```
Browser → /dashboard/lawyer
       → Server renders HTML with data
       ← Full HTML page
       → Hydrate to SPA
```

### After (Pure SPA)

```
Browser → /dashboard/lawyer
       ← Static HTML shell (200.html)
       → Load JS bundle
       → Call /api/auth/me (check auth)
       → Call /api/cases (get data)
       ← JSON responses
       → Render UI
```

**Key Changes**:
- No server-side rendering (faster deploys, simpler infrastructure)
- All data via API calls (can be cached, easier to optimize)
- Client-side routing only (no page reloads)
- Larger initial bundle (but code-split by route)
- Better for authenticated dashboards (no public SEO needed)

---

## Estimated Timeline

- **Phase 1**: 1-2 hours
- **Phase 2**: 3-4 hours
- **Phase 3**: 4-6 hours
- **Phase 4**: 3-4 hours
- **Phase 5**: 2-3 hours
- **Phase 6**: 2-3 hours
- **Phase 7**: 1-2 hours
- **Phase 8**: 1-2 hours (optional)
- **Phase 9**: 2-4 hours
- **Phase 10**: 1-2 hours

**Total**: 20-33 hours (3-5 days for single developer)

---

## Success Criteria

✅ **Functional**:
- All existing features work identically
- No broken functionality
- All user flows complete successfully

✅ **Performance**:
- Initial load < 3 seconds (on 3G)
- Route transitions < 500ms
- API responses < 1 second

✅ **Code Quality**:
- All tests passing (100% of previous coverage maintained)
- No console errors
- TypeScript strict mode enabled

✅ **User Experience**:
- Loading states for all async operations
- Error messages clear and actionable
- Offline detection implemented
- Mobile responsive

---

## Additional Resources

- [SvelteKit SPA Mode Docs](https://kit.svelte.dev/docs/single-page-apps)
- [adapter-static Documentation](https://kit.svelte.dev/docs/adapter-static)
- [Svelte Stores Guide](https://svelte.dev/docs/svelte/stores)
- [Project Architecture Report](./system-architecture-report.md)
- [Feature Requirements](./lawyer-dashboard-flow.md)
