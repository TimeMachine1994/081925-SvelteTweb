<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import { authStore } from '$lib/stores/auth.svelte.ts';
	import { toastStore } from '$lib/stores/toast.svelte.ts';
	import {
		User, Mail, Shield, Phone, MapPin, Calendar, Heart,
		CreditCard, Pencil, Save, X, Check, Loader2
	} from 'lucide-svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Form state — initialized from server data
	let firstName = $state(data.profile?.firstName ?? '');
	let lastName = $state(data.profile?.lastName ?? '');
	let phoneNumber = $state(data.profile?.phoneNumber ?? '');
	let dateOfBirth = $state(data.profile?.dateOfBirth ?? '');
	let preferredContact = $state<string>(data.profile?.preferredContact ?? '');

	let addressLine1 = $state(data.profile?.addressLine1 ?? '');
	let addressLine2 = $state(data.profile?.addressLine2 ?? '');
	let city = $state(data.profile?.city ?? '');
	let stateCode = $state(data.profile?.state ?? '');
	let zipCode = $state(data.profile?.zipCode ?? '');

	let emergencyContactName = $state(data.profile?.emergencyContactName ?? '');
	let emergencyContactPhone = $state(data.profile?.emergencyContactPhone ?? '');

	// Section editing state
	let editingPersonal = $state(false);
	let editingAddress = $state(false);
	let editingEmergency = $state(false);
	let savingPersonal = $state(false);
	let savingAddress = $state(false);
	let savingEmergency = $state(false);

	// Card on file display
	let cardBrand = $derived(data.profile?.cardBrand ?? authStore.user?.cardBrand);
	let cardLastFour = $derived(data.profile?.cardLastFour ?? authStore.user?.cardLastFour);
	let hasCard = $derived(!!cardLastFour);

	function resetPersonal() {
		firstName = data.profile?.firstName ?? authStore.user?.firstName ?? '';
		lastName = data.profile?.lastName ?? authStore.user?.lastName ?? '';
		phoneNumber = data.profile?.phoneNumber ?? authStore.user?.phoneNumber ?? '';
		dateOfBirth = data.profile?.dateOfBirth ?? authStore.user?.dateOfBirth ?? '';
		preferredContact = data.profile?.preferredContact ?? authStore.user?.preferredContact ?? '';
		editingPersonal = false;
	}

	function resetAddress() {
		addressLine1 = data.profile?.addressLine1 ?? authStore.user?.addressLine1 ?? '';
		addressLine2 = data.profile?.addressLine2 ?? authStore.user?.addressLine2 ?? '';
		city = data.profile?.city ?? authStore.user?.city ?? '';
		stateCode = data.profile?.state ?? authStore.user?.state ?? '';
		zipCode = data.profile?.zipCode ?? authStore.user?.zipCode ?? '';
		editingAddress = false;
	}

	function resetEmergency() {
		emergencyContactName = data.profile?.emergencyContactName ?? authStore.user?.emergencyContactName ?? '';
		emergencyContactPhone = data.profile?.emergencyContactPhone ?? authStore.user?.emergencyContactPhone ?? '';
		editingEmergency = false;
	}

	async function savePersonal() {
		savingPersonal = true;
		const result = await authStore.updateProfile({
			firstName,
			lastName,
			phoneNumber: phoneNumber || null,
			dateOfBirth: dateOfBirth || null,
			preferredContact: (preferredContact || null) as 'email' | 'phone' | 'text' | null
		});
		savingPersonal = false;
		if (result.success) {
			editingPersonal = false;
			toastStore.success('Personal information updated');
		} else {
			toastStore.error(result.error || 'Failed to update');
		}
	}

	async function saveAddress() {
		savingAddress = true;
		const result = await authStore.updateProfile({
			addressLine1: addressLine1 || null,
			addressLine2: addressLine2 || null,
			city: city || null,
			state: stateCode || null,
			zipCode: zipCode || null
		});
		savingAddress = false;
		if (result.success) {
			editingAddress = false;
			toastStore.success('Address updated');
		} else {
			toastStore.error(result.error || 'Failed to update');
		}
	}

	async function saveEmergency() {
		savingEmergency = true;
		const result = await authStore.updateProfile({
			emergencyContactName: emergencyContactName || null,
			emergencyContactPhone: emergencyContactPhone || null
		});
		savingEmergency = false;
		if (result.success) {
			editingEmergency = false;
			toastStore.success('Emergency contact updated');
		} else {
			toastStore.error(result.error || 'Failed to update');
		}
	}

	const inputClass = 'w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all';
	const labelClass = 'block text-xs font-medium text-muted-foreground mb-1';

	const US_STATES = [
		'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
		'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
		'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
	];

	// ── Square Web Payments SDK state ──
	let showCardForm = $state(false);
	let cardInstance: any = $state(null);
	let squarePayments: any = $state(null);
	let savingCard = $state(false);
	let removingCard = $state(false);
	let squareLoaded = $state(false);

	onMount(() => {
		// Eagerly load the Square SDK script so it's ready when user clicks "Add"
		if (browser && env.PUBLIC_SQUARE_APP_ID) {
			loadSquareSdk();
		}
	});

	function getSquareSdkUrl(): string {
		// Sandbox app IDs start with 'sandbox-'
		const appId = env.PUBLIC_SQUARE_APP_ID ?? '';
		return appId.startsWith('sandbox-')
			? 'https://sandbox.web.squarecdn.com/v1/square.js'
			: 'https://web.squarecdn.com/v1/square.js';
	}

	async function loadSquareSdk() {
		if ((window as any).Square) {
			squareLoaded = true;
			return;
		}
		return new Promise<void>((resolve, reject) => {
			const script = document.createElement('script');
			script.src = getSquareSdkUrl();
			script.onload = () => { squareLoaded = true; resolve(); };
			script.onerror = () => reject(new Error('Failed to load Square SDK'));
			document.head.appendChild(script);
		});
	}

	async function openCardForm() {
		showCardForm = true;
		try {
			await loadSquareSdk();
			const Square = (window as any).Square;
			if (!Square) { toastStore.error('Square SDK failed to load'); return; }

			squarePayments = await Square.payments(env.PUBLIC_SQUARE_APP_ID, data.squareLocationId);
			cardInstance = await squarePayments.card();

			// Wait a tick for the DOM container to render
			await new Promise(r => setTimeout(r, 50));
			await cardInstance.attach('#square-card-element');
		} catch (err: any) {
			console.error('Square card form error:', err);
			toastStore.error('Could not load payment form. Please try again.');
			showCardForm = false;
		}
	}

	async function handleSaveCard() {
		if (!cardInstance) return;
		savingCard = true;
		try {
			const tokenResult = await cardInstance.tokenize();
			if (tokenResult.status !== 'OK') {
				toastStore.error(tokenResult.errors?.[0]?.message || 'Card verification failed');
				return;
			}

			const res = await fetch('/api/square/save-card', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sourceId: tokenResult.token })
			});

			const result = await res.json();
			if (!res.ok) throw new Error(result.message || result.error || 'Failed to save card');

			authStore.user = result.user;
			showCardForm = false;
			toastStore.success('Payment method saved');
		} catch (err: any) {
			toastStore.error(err.message || 'Failed to save card');
		} finally {
			savingCard = false;
		}
	}

	async function handleRemoveCard() {
		removingCard = true;
		try {
			const res = await fetch('/api/square/remove-card', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			const result = await res.json();
			if (!res.ok) throw new Error(result.message || result.error || 'Failed to remove card');

			authStore.user = result.user;
			toastStore.success('Payment method removed');
		} catch (err: any) {
			toastStore.error(err.message || 'Failed to remove card');
		} finally {
			removingCard = false;
		}
	}
</script>

<svelte:head>
	<title>My Profile | King Law</title>
</svelte:head>

<div class="max-w-3xl">
	<h1 class="font-title text-2xl sm:text-4xl mb-6 sm:mb-8">My Profile</h1>

	<!-- Avatar + Name Header -->
	<div class="bg-king-blue rounded-xl p-6 sm:p-8 flex items-center gap-5 mb-6">
		<div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gold text-king-blue flex items-center justify-center text-xl sm:text-2xl font-bold shrink-0">
			{authStore.user?.firstName?.[0]}{authStore.user?.lastName?.[0]}
		</div>
		<div class="text-white min-w-0">
			<h2 class="text-xl sm:text-2xl font-bold truncate">{authStore.user?.firstName} {authStore.user?.lastName}</h2>
			<div class="flex items-center gap-3 mt-1">
				<Badge variant={authStore.user?.role} />
				<span class="text-white/60 text-sm truncate">{authStore.user?.email}</span>
			</div>
		</div>
	</div>

	<div class="space-y-6">
		<!-- ═══════════ PERSONAL INFORMATION ═══════════ -->
		<section class="bg-background border border-border rounded-lg overflow-hidden">
			<div class="flex items-center justify-between px-5 py-4 border-b border-border">
				<div class="flex items-center gap-2">
					<User class="w-4 h-4 text-gold" />
					<h3 class="font-semibold text-sm">Personal Information</h3>
				</div>
				{#if !editingPersonal}
					<button onclick={() => (editingPersonal = true)} class="flex items-center gap-1.5 text-xs text-gold hover:text-gold-dark transition-colors font-medium">
						<Pencil class="w-3.5 h-3.5" /> Edit
					</button>
				{/if}
			</div>

			<div class="px-5 py-4">
				{#if editingPersonal}
					<form onsubmit={(e) => { e.preventDefault(); savePersonal(); }} class="space-y-4">
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label for="firstName" class={labelClass}>First Name *</label>
								<input id="firstName" type="text" bind:value={firstName} required class={inputClass} />
							</div>
							<div>
								<label for="lastName" class={labelClass}>Last Name *</label>
								<input id="lastName" type="text" bind:value={lastName} required class={inputClass} />
							</div>
						</div>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label for="phone" class={labelClass}>Phone Number</label>
								<input id="phone" type="tel" bind:value={phoneNumber} placeholder="(555) 555-5555" class={inputClass} />
							</div>
							<div>
								<label for="dob" class={labelClass}>Date of Birth</label>
								<input id="dob" type="date" bind:value={dateOfBirth} class={inputClass} />
							</div>
						</div>
						<div>
							<label for="preferredContact" class={labelClass}>Preferred Contact Method</label>
							<select id="preferredContact" bind:value={preferredContact} class={inputClass}>
								<option value="">No preference</option>
								<option value="email">Email</option>
								<option value="phone">Phone Call</option>
								<option value="text">Text Message</option>
							</select>
						</div>
						<div class="flex justify-end gap-2 pt-2">
							<button type="button" onclick={resetPersonal} class="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors">Cancel</button>
							<button type="submit" disabled={savingPersonal} class="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-gold hover:bg-gold-dark text-king-blue font-semibold transition-colors disabled:opacity-50">
								{#if savingPersonal}<Loader2 class="w-4 h-4 animate-spin" />{:else}<Save class="w-4 h-4" />{/if}
								Save
							</button>
						</div>
					</form>
				{:else}
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
						<div>
							<p class="text-xs text-muted-foreground">Full Name</p>
							<p class="text-sm font-medium">{authStore.user?.firstName} {authStore.user?.lastName}</p>
						</div>
						<div>
							<p class="text-xs text-muted-foreground">Email</p>
							<p class="text-sm font-medium">{authStore.user?.email}</p>
						</div>
						<div>
							<p class="text-xs text-muted-foreground">Phone</p>
							<p class="text-sm font-medium">{authStore.user?.phoneNumber || '—'}</p>
						</div>
						<div>
							<p class="text-xs text-muted-foreground">Date of Birth</p>
							<p class="text-sm font-medium">{authStore.user?.dateOfBirth || '—'}</p>
						</div>
						<div>
							<p class="text-xs text-muted-foreground">Preferred Contact</p>
							<p class="text-sm font-medium capitalize">{authStore.user?.preferredContact || '—'}</p>
						</div>
					</div>
				{/if}
			</div>
		</section>

		<!-- ═══════════ ADDRESS ═══════════ -->
		<section class="bg-background border border-border rounded-lg overflow-hidden">
			<div class="flex items-center justify-between px-5 py-4 border-b border-border">
				<div class="flex items-center gap-2">
					<MapPin class="w-4 h-4 text-gold" />
					<h3 class="font-semibold text-sm">Address</h3>
				</div>
				{#if !editingAddress}
					<button onclick={() => (editingAddress = true)} class="flex items-center gap-1.5 text-xs text-gold hover:text-gold-dark transition-colors font-medium">
						<Pencil class="w-3.5 h-3.5" /> Edit
					</button>
				{/if}
			</div>

			<div class="px-5 py-4">
				{#if editingAddress}
					<form onsubmit={(e) => { e.preventDefault(); saveAddress(); }} class="space-y-4">
						<div>
							<label for="address1" class={labelClass}>Street Address</label>
							<input id="address1" type="text" bind:value={addressLine1} placeholder="123 Main Street" class={inputClass} />
						</div>
						<div>
							<label for="address2" class={labelClass}>Apt / Suite / Unit</label>
							<input id="address2" type="text" bind:value={addressLine2} placeholder="Apt 4B" class={inputClass} />
						</div>
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
							<div class="col-span-2">
								<label for="city" class={labelClass}>City</label>
								<input id="city" type="text" bind:value={city} class={inputClass} />
							</div>
							<div>
								<label for="state" class={labelClass}>State</label>
								<select id="state" bind:value={stateCode} class={inputClass}>
									<option value="">—</option>
									{#each US_STATES as st}
										<option value={st}>{st}</option>
									{/each}
								</select>
							</div>
							<div>
								<label for="zip" class={labelClass}>ZIP Code</label>
								<input id="zip" type="text" bind:value={zipCode} placeholder="12345" maxlength="10" class={inputClass} />
							</div>
						</div>
						<div class="flex justify-end gap-2 pt-2">
							<button type="button" onclick={resetAddress} class="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors">Cancel</button>
							<button type="submit" disabled={savingAddress} class="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-gold hover:bg-gold-dark text-king-blue font-semibold transition-colors disabled:opacity-50">
								{#if savingAddress}<Loader2 class="w-4 h-4 animate-spin" />{:else}<Save class="w-4 h-4" />{/if}
								Save
							</button>
						</div>
					</form>
				{:else}
					{@const hasAddress = authStore.user?.addressLine1}
					{#if hasAddress}
						<div>
							<p class="text-sm font-medium">{authStore.user?.addressLine1}</p>
							{#if authStore.user?.addressLine2}<p class="text-sm">{authStore.user.addressLine2}</p>{/if}
							<p class="text-sm">
								{authStore.user?.city}{authStore.user?.city && authStore.user?.state ? ', ' : ''}{authStore.user?.state}
								{authStore.user?.zipCode ? ` ${authStore.user.zipCode}` : ''}
							</p>
						</div>
					{:else}
						<p class="text-sm text-muted-foreground italic">No address on file. Click Edit to add your address.</p>
					{/if}
				{/if}
			</div>
		</section>

		<!-- ═══════════ EMERGENCY CONTACT ═══════════ -->
		<section class="bg-background border border-border rounded-lg overflow-hidden">
			<div class="flex items-center justify-between px-5 py-4 border-b border-border">
				<div class="flex items-center gap-2">
					<Heart class="w-4 h-4 text-gold" />
					<h3 class="font-semibold text-sm">Emergency Contact</h3>
				</div>
				{#if !editingEmergency}
					<button onclick={() => (editingEmergency = true)} class="flex items-center gap-1.5 text-xs text-gold hover:text-gold-dark transition-colors font-medium">
						<Pencil class="w-3.5 h-3.5" /> Edit
					</button>
				{/if}
			</div>

			<div class="px-5 py-4">
				{#if editingEmergency}
					<form onsubmit={(e) => { e.preventDefault(); saveEmergency(); }} class="space-y-4">
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label for="ecName" class={labelClass}>Contact Name</label>
								<input id="ecName" type="text" bind:value={emergencyContactName} placeholder="Jane Doe" class={inputClass} />
							</div>
							<div>
								<label for="ecPhone" class={labelClass}>Contact Phone</label>
								<input id="ecPhone" type="tel" bind:value={emergencyContactPhone} placeholder="(555) 555-5555" class={inputClass} />
							</div>
						</div>
						<div class="flex justify-end gap-2 pt-2">
							<button type="button" onclick={resetEmergency} class="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors">Cancel</button>
							<button type="submit" disabled={savingEmergency} class="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-gold hover:bg-gold-dark text-king-blue font-semibold transition-colors disabled:opacity-50">
								{#if savingEmergency}<Loader2 class="w-4 h-4 animate-spin" />{:else}<Save class="w-4 h-4" />{/if}
								Save
							</button>
						</div>
					</form>
				{:else}
					{@const hasEmergency = authStore.user?.emergencyContactName}
					{#if hasEmergency}
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
							<div>
								<p class="text-xs text-muted-foreground">Name</p>
								<p class="text-sm font-medium">{authStore.user?.emergencyContactName}</p>
							</div>
							<div>
								<p class="text-xs text-muted-foreground">Phone</p>
								<p class="text-sm font-medium">{authStore.user?.emergencyContactPhone || '—'}</p>
							</div>
						</div>
					{:else}
						<p class="text-sm text-muted-foreground italic">No emergency contact on file. Click Edit to add one.</p>
					{/if}
				{/if}
			</div>
		</section>

		<!-- ═══════════ PAYMENT METHOD ═══════════ -->
		<section class="bg-background border border-border rounded-lg overflow-hidden">
			<div class="flex items-center justify-between px-5 py-4 border-b border-border">
				<div class="flex items-center gap-2">
					<CreditCard class="w-4 h-4 text-gold" />
					<h3 class="font-semibold text-sm">Payment Method</h3>
				</div>
			</div>

			<div class="px-5 py-4">
				{#if hasCard}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="w-10 h-7 bg-muted rounded flex items-center justify-center">
								<CreditCard class="w-5 h-5 text-muted-foreground" />
							</div>
							<div>
								<p class="text-sm font-medium">{cardBrand ?? 'Card'} ending in {cardLastFour}</p>
								<p class="text-xs text-muted-foreground">Saved for future payments</p>
							</div>
						</div>
						<button
							onclick={handleRemoveCard}
							disabled={removingCard}
							class="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
						>
							{#if removingCard}<Loader2 class="w-3 h-3 animate-spin inline" />{/if}
							Remove
						</button>
					</div>
				{:else if showCardForm}
					<div class="space-y-4">
						<div id="square-card-element" class="min-h-[50px]"></div>
						<div class="flex justify-end gap-2">
							<button
								type="button"
								onclick={() => { showCardForm = false; cardInstance?.destroy(); cardInstance = null; }}
								class="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
							>Cancel</button>
							<button
								type="button"
								onclick={handleSaveCard}
								disabled={savingCard}
								class="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-gold hover:bg-gold-dark text-king-blue font-semibold transition-colors disabled:opacity-50"
							>
								{#if savingCard}<Loader2 class="w-4 h-4 animate-spin" />{:else}<Save class="w-4 h-4" />{/if}
								Save Card
							</button>
						</div>
						<p class="text-xs text-muted-foreground">Your card is securely processed by Square. We never store your full card number.</p>
					</div>
				{:else}
					<p class="text-sm text-muted-foreground italic mb-4">No payment method on file.</p>
					<button
						onclick={openCardForm}
						class="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-gold hover:bg-gold-dark text-king-blue font-semibold transition-colors"
					>
						<CreditCard class="w-4 h-4" />
						Add Payment Method
					</button>
				{/if}
			</div>
		</section>
	</div>
</div>
