<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import { casesStore } from '$lib/stores/cases.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	type Client = {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
	};

	let { 
		open = false,
		onclose,
		oncreated
	}: { 
		open?: boolean;
		onclose?: () => void;
		oncreated?: (caseData: any) => void;
	} = $props();

	let clients = $state<Client[]>([]);
	let loadingClients = $state(false);
	let submitting = $state(false);
	let error = $state<string | null>(null);

	let formData = $state({
		clientId: '',
		title: '',
		description: '',
		status: 'open' as 'open' | 'closed' | 'archived'
	});

	let searchQuery = $state('');

	let filteredClients = $derived(
		clients.filter(
			(c) =>
				searchQuery === '' ||
				`${c.firstName} ${c.lastName} ${c.email}`
					.toLowerCase()
					.includes(searchQuery.toLowerCase())
		)
	);

	async function loadClients() {
		loadingClients = true;
		try {
			const response = await fetch('/api/users?role=client');
			if (!response.ok) throw new Error('Failed to load clients');
			const data = await response.json();
			clients = data.users || [];
		} catch (err: any) {
			console.error('Failed to load clients:', err);
			error = 'Failed to load client list';
		} finally {
			loadingClients = false;
		}
	}

	$effect(() => {
		if (open) {
			loadClients();
		}
	});

	async function handleSubmit() {
		error = null;

		if (!formData.clientId) {
			error = 'Please select a client';
			return;
		}

		if (!formData.title.trim()) {
			error = 'Case title is required';
			return;
		}

		if (!formData.description.trim() || formData.description.length < 20) {
			error = 'Description must be at least 20 characters';
			return;
		}

		submitting = true;

		const result = await casesStore.createCase({
			clientId: formData.clientId,
			title: formData.title,
			description: formData.description,
			status: formData.status
		});

		submitting = false;

		if (result.success) {
			toastStore.success('Case created successfully');
			if (oncreated) oncreated(result.case);
			handleClose();
		} else {
			error = result.error || 'Failed to create case';
			toastStore.error(error as string);
		}
	}

	function handleClose() {
		formData = {
			clientId: '',
			title: '',
			description: '',
			status: 'open'
		};
		searchQuery = '';
		error = null;
		if (onclose) onclose();
	}

	function selectClient(clientId: string) {
		formData.clientId = clientId;
		searchQuery = '';
	}

	let selectedClient = $derived(clients.find((c) => c.id === formData.clientId));

	// Derived state for form validation - ensures proper reactivity
	let canSubmit = $derived(
		!submitting && 
		formData.clientId !== '' && 
		formData.title.trim() !== '' && 
		formData.description.trim().length >= 20
	);
</script>

<Modal {open} title="Create New Case" size="lg" onclose={handleClose}>
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
		{#if error}
			<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
				{error}
			</div>
		{/if}

		<!-- Client Selection -->
		<div>
			<label for="client" class="block text-sm font-medium mb-2">
				Client <span class="text-red-500">*</span>
			</label>
			{#if selectedClient}
				<div class="flex items-center justify-between p-3 border border-border rounded-md bg-muted">
					<div>
						<div class="font-medium">
							{selectedClient.firstName} {selectedClient.lastName}
						</div>
						<div class="text-sm text-muted-foreground">{selectedClient.email}</div>
					</div>
					<button
						type="button"
						onclick={() => (formData.clientId = '')}
						class="text-sm text-gold hover:underline"
					>
						Change
					</button>
				</div>
			{:else}
				<div class="relative">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search clients by name or email..."
						class="w-full px-3 py-2 border border-input rounded-md bg-background"
					/>
					{#if loadingClients}
						<div class="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md p-4 text-center z-10 shadow-lg">
							Loading clients...
						</div>
					{:else if searchQuery && filteredClients.length > 0}
						<div class="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto z-10">
							{#each filteredClients as client}
								<button
									type="button"
									onclick={() => selectClient(client.id)}
									class="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
								>
									<div class="font-medium">
										{client.firstName} {client.lastName}
									</div>
									<div class="text-sm text-muted-foreground">{client.email}</div>
								</button>
							{/each}
						</div>
					{:else if searchQuery}
						<div class="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md p-4 text-center text-muted-foreground z-10 shadow-lg">
							No clients found
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Case Title -->
		<div>
			<label for="title" class="block text-sm font-medium mb-2">
				Case Title <span class="text-red-500">*</span>
			</label>
			<input
				type="text"
				id="title"
				bind:value={formData.title}
				maxlength="100"
				placeholder="e.g., Personal Injury - Car Accident"
				required
				class="w-full px-3 py-2 border border-input rounded-md bg-background"
			/>
			<div class="text-xs text-muted-foreground mt-1">
				{formData.title.length}/100 characters
			</div>
		</div>

		<!-- Case Description -->
		<div>
			<label for="description" class="block text-sm font-medium mb-2">
				Description <span class="text-red-500">*</span>
			</label>
			<textarea
				id="description"
				bind:value={formData.description}
				rows="4"
				placeholder="Provide details about the case..."
				required
				class="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
			></textarea>
			<div class="text-xs text-muted-foreground mt-1">
				{formData.description.length} characters (minimum 20)
			</div>
		</div>

		<!-- Status -->
		<div>
			<label for="status" class="block text-sm font-medium mb-2">
				Initial Status
			</label>
			<select
				id="status"
				bind:value={formData.status}
				class="w-full px-3 py-2 border border-input rounded-md bg-background"
			>
				<option value="open">Open</option>
				<option value="closed">Closed</option>
			</select>
		</div>

		<!-- Action Buttons -->
		<div class="flex gap-3 justify-end pt-4 border-t border-border">
			<button
				type="button"
				onclick={handleClose}
				disabled={submitting}
				class="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors disabled:opacity-50"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={!canSubmit}
				class="px-6 py-2 bg-gold hover:bg-gold-dark text-black font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{submitting ? 'Creating...' : 'Create Case'}
			</button>
		</div>
	</form>
</Modal>
