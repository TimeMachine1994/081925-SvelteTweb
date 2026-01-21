<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { casesStore } from '$lib/stores/cases.svelte';
	import { documentsStore } from '$lib/stores/documents.svelte';
	import { invoicesStore } from '$lib/stores/invoices.svelte';
	import { messagesStore } from '$lib/stores/messages.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import ChatSlider from '$lib/components/ChatSlider.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';

	const caseId = $page.params.id;

	let loading = $state(true);
	let messageText = $state('');
	let sendingMessage = $state(false);
	let uploadingFile = $state(false);

	let currentCase = $derived(casesStore.currentCase?.case);
	let lawyer = $derived(casesStore.currentCase?.lawyer);

	onMount(() => {
		if (!caseId) return;
		
		const loadData = async () => {
			loading = true;
			try {
				await Promise.all([
					casesStore.fetchCase(caseId),
					documentsStore.fetchDocuments(caseId),
					invoicesStore.fetchInvoices(caseId),
					messagesStore.fetchMessages(caseId)
				]);
				messagesStore.startPolling(caseId);
			} catch (error) {
				console.error('Error loading case:', error);
				toastStore.error('Failed to load case data');
			} finally {
				loading = false;
			}
		};
		
		loadData();

		return () => {
			messagesStore.stopPolling();
		};
	});

	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(cents / 100);
	}

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function sendMessage() {
		if (!messageText.trim() || !currentCase || !lawyer || !caseId) return;

		sendingMessage = true;
		try {
			await messagesStore.sendMessage(caseId, lawyer.id, messageText);
			messageText = '';
			toastStore.success('Message sent');
		} catch (error) {
			console.error('Failed to send message:', error);
			toastStore.error('Failed to send message');
		} finally {
			sendingMessage = false;
		}
	}

	async function uploadFile(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploadingFile = true;
		try {
			const result = await documentsStore.uploadDocument(file, caseId);
			if (result.success) {
				toastStore.success('Document uploaded');
			} else {
				toastStore.error(result.error || 'Upload failed');
			}
		} catch (error) {
			console.error('Failed to upload file:', error);
			toastStore.error('Failed to upload file');
		} finally {
			uploadingFile = false;
			input.value = '';
		}
	}
</script>

<Toast />

{#if loading}
	<div class="space-y-6">
		<Skeleton class="h-8 w-48" />
		<Skeleton class="h-48 w-full" />
		<div class="grid lg:grid-cols-2 gap-8">
			<Skeleton class="h-64" />
			<Skeleton class="h-64" />
		</div>
	</div>
{:else if currentCase && lawyer}
<div>
	<div class="mb-6">
		<a href="/dashboard/client" class="text-gold hover:underline text-sm">← Back to Dashboard</a>
	</div>

	<div class="bg-background border border-border rounded-lg p-6 mb-8">
		<div class="flex justify-between items-start mb-4">
			<div>
				<h1 class="font-title text-3xl mb-2">{currentCase.title}</h1>
				<p class="text-muted-foreground">
					Case ID: <span class="font-mono text-sm">{currentCase.id}</span>
				</p>
			</div>
			<span
				class="text-xs px-3 py-1 rounded-full {currentCase.status === 'open'
					? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
					: currentCase.status === 'archived'
						? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
						: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'}"
			>
				{currentCase.status}
			</span>
		</div>

		{#if currentCase.description}
			<p class="text-muted-foreground mb-4">{currentCase.description}</p>
		{/if}

		<div class="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
			<div>
				<h3 class="font-semibold mb-2">Your Lawyer</h3>
				<p>{lawyer.firstName} {lawyer.lastName}</p>
				<p class="text-sm text-muted-foreground">{lawyer.email}</p>
			</div>
			<div>
				<h3 class="font-semibold mb-2">Case Dates</h3>
				<p class="text-sm">
					<span class="text-muted-foreground">Created:</span>
					{formatDate(currentCase.createdAt)}
				</p>
				<p class="text-sm">
					<span class="text-muted-foreground">Updated:</span>
					{formatDate(currentCase.updatedAt)}
				</p>
			</div>
		</div>
	</div>

	<div class="grid lg:grid-cols-2 gap-8">
		<!-- Left Column -->
		<div class="space-y-8">
			<!-- Documents -->
			<div>
				<div class="flex justify-between items-center mb-4">
					<h2 class="font-title text-2xl">Documents</h2>
					<label class="bg-gold hover:bg-gold-dark text-black font-semibold px-4 py-2 rounded-md cursor-pointer transition-colors">
						<input type="file" onchange={uploadFile} class="hidden" disabled={uploadingFile} />
						{uploadingFile ? 'Uploading...' : 'Upload'}
					</label>
				</div>

				{#if documentsStore.documents.length > 0}
					<div class="bg-background border border-border rounded-lg overflow-hidden">
						<table class="w-full">
							<thead class="bg-muted">
								<tr>
									<th class="text-left px-4 py-3 text-sm font-semibold">File Name</th>
									<th class="text-left px-4 py-3 text-sm font-semibold">Size</th>
									<th class="text-right px-4 py-3 text-sm font-semibold">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each documentsStore.documents as item}
									<tr class="border-t border-border hover:bg-muted/50">
										<td class="px-4 py-3 text-sm">{item.document.fileName}</td>
										<td class="px-4 py-3 text-sm text-muted-foreground">
											{(item.document.fileSize / 1024).toFixed(1)} KB
										</td>
										<td class="px-4 py-3 text-right">
											<a href="/api/documents/{item.document.id}" class="text-gold hover:underline text-sm">
												Download
											</a>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="bg-background border border-border rounded-lg p-8 text-center">
						<p class="text-muted-foreground">No documents uploaded yet</p>
					</div>
				{/if}
			</div>

			<!-- Invoices -->
			<div>
				<h2 class="font-title text-2xl mb-4">Invoices</h2>

				{#if invoicesStore.invoices.length > 0}
					<div class="space-y-3">
						{#each invoicesStore.invoices as item}
							<div class="bg-background border border-border rounded-lg p-4">
								<div class="flex justify-between items-start mb-2">
									<div>
										<h3 class="font-semibold">{item.invoice.description}</h3>
										<p class="text-sm text-muted-foreground">
											Due: {formatDate(item.invoice.dueDate)}
										</p>
									</div>
									<span
										class="text-xs px-2 py-1 rounded-full {item.invoice.status === 'paid'
											? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
											: item.invoice.status === 'partial'
												? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
												: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}"
									>
										{item.invoice.status}
									</span>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-lg font-bold">{formatCurrency(item.invoice.amount)}</span>
									{#if item.invoice.status !== 'paid'}
										<button class="bg-gold hover:bg-gold-dark text-black px-4 py-2 rounded text-sm font-semibold transition-colors">
											Pay Now
										</button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="bg-background border border-border rounded-lg p-8 text-center">
						<p class="text-muted-foreground">No invoices yet</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right Column - Messages -->
		<div>
			<h2 class="font-title text-2xl mb-4">Messages</h2>

			<div class="bg-background border border-border rounded-lg overflow-hidden">
				<div class="h-96 overflow-y-auto p-4 space-y-4">
					{#if messagesStore.messages.length > 0}
						{#each messagesStore.messages as item}
							<div
								class="p-3 rounded-lg {item.sender?.id === lawyer.id
									? 'bg-muted ml-4'
									: 'bg-gold/10 mr-4'}"
							>
								<div class="flex justify-between items-start mb-1">
									<span class="font-semibold text-sm">
										{item.sender?.firstName} {item.sender?.lastName}
									</span>
									<span class="text-xs text-muted-foreground">
										{formatDate(item.message.createdAt)}
									</span>
								</div>
								<p class="text-sm">{item.message.content}</p>
							</div>
						{/each}
					{:else}
						<p class="text-center text-muted-foreground">No messages yet</p>
					{/if}
				</div>

				<div class="border-t border-border p-4">
					<form
						onsubmit={(e) => {
							e.preventDefault();
							sendMessage();
						}}
						class="flex gap-2"
					>
						<input
							type="text"
							bind:value={messageText}
							placeholder="Type your message..."
							disabled={sendingMessage}
							class="flex-1 px-3 py-2 border border-input rounded-md bg-background disabled:opacity-50"
						/>
						<button
							type="submit"
							disabled={sendingMessage || !messageText.trim()}
							class="bg-gold hover:bg-gold-dark text-black font-semibold px-6 py-2 rounded-md transition-colors disabled:opacity-50"
						>
							{sendingMessage ? 'Sending...' : 'Send'}
						</button>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>
{:else}
	<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
		<h2 class="text-xl font-bold text-red-800 dark:text-red-200">Case not found</h2>
		<a href="/dashboard/client" class="mt-4 text-gold hover:underline inline-block">Return to Dashboard</a>
	</div>
{/if}

<!-- Case-Specific Chat -->
{#if currentCase}
	<ChatSlider caseId={currentCase.id} />
{/if}
