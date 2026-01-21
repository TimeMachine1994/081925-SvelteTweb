<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { casesStore } from '$lib/stores/cases.svelte';
	import { documentsStore } from '$lib/stores/documents.svelte';
	import { invoicesStore } from '$lib/stores/invoices.svelte';
	import { messagesStore } from '$lib/stores/messages.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import UploadDocumentModal from '$lib/components/UploadDocumentModal.svelte';
	import CreateInvoiceModal from '$lib/components/CreateInvoiceModal.svelte';
	import EditCaseModal from '$lib/components/EditCaseModal.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

	const caseId = $page.params.id;

	let showInvoiceModal = $state(false);
	let showUploadModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteConfirm = $state(false);
	let showMarkPaidConfirm = $state(false);
	let markPaidInvoiceId = $state<string | null>(null);
	let markPaidAmount = $state(0);
	let markingPaid = $state(false);
	let messageText = $state('');
	let sendingMessage = $state(false);
	let loading = $state(true);
	let deleting = $state(false);

	// Derived state for easier access
	let currentCase = $derived(casesStore.currentCase?.case);
	let client = $derived(casesStore.currentCase?.client);

	onMount(() => {
		if (!caseId) return;
		
		const loadData = async () => {
			loading = true;
			try {
				// Fetch all case data
				await Promise.all([
					casesStore.fetchCase(caseId),
					documentsStore.fetchDocuments(caseId),
					invoicesStore.fetchInvoices(caseId),
					messagesStore.fetchMessages(caseId)
				]);
				
				// Start polling for messages
				messagesStore.startPolling(caseId);
			} catch (error) {
				console.error('Error loading case data:', error);
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

	async function handleStatusChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		const newStatus = select.value;
		
		if (!currentCase) return;

		const result = await casesStore.updateCase(caseId!, { 
			status: newStatus as 'active' | 'pending' | 'closed' 
		});

		if (result.success) {
			toastStore.success('Case status updated');
		} else {
			toastStore.error(result.error || 'Failed to update status');
			// Revert selection if failed (optional, but good UX)
			select.value = currentCase.status; 
		}
	}

	async function handleDeleteCase() {
		if (!currentCase) return;
		deleting = true;
		
		const result = await casesStore.deleteCase(currentCase.id);
		
		deleting = false;
		showDeleteConfirm = false;

		if (result.success) {
			toastStore.success('Case deleted successfully');
			goto('/dashboard/lawyer');
		} else {
			toastStore.error(result.error || 'Failed to delete case');
		}
	}

	function handleCaseUpdated() {
		showEditModal = false;
	}

	function openMarkPaidConfirm(invoiceId: string, amount: number) {
		markPaidInvoiceId = invoiceId;
		markPaidAmount = amount;
		showMarkPaidConfirm = true;
	}

	async function handleMarkAsPaid() {
		if (!markPaidInvoiceId) return;
		
		markingPaid = true;
		const result = await invoicesStore.markAsPaid(markPaidInvoiceId);
		markingPaid = false;
		
		if (result.success) {
			toastStore.success('Invoice marked as paid');
			showMarkPaidConfirm = false;
			markPaidInvoiceId = null;
		} else {
			toastStore.error(result.error || 'Failed to mark invoice as paid');
		}
	}

	async function sendMessage() {
		if (!messageText.trim() || !client) return;

		sendingMessage = true;
		const result = await messagesStore.sendMessage(caseId!, messageText, client.id);
		sendingMessage = false;

		if (result.success) {
			messageText = '';
		} else {
			toastStore.error(result.error || 'Failed to send message');
		}
	}

	function handleInvoiceCreated() {
		showInvoiceModal = false;
		toastStore.success('Invoice created successfully');
		if (caseId) invoicesStore.fetchInvoices(caseId);
	}

	function handleDocumentUploaded() {
		showUploadModal = false;
		toastStore.success('Document uploaded successfully');
		if (caseId) documentsStore.fetchDocuments(caseId);
	}

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
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-6">
		<a href="/dashboard/lawyer" class="text-gold hover:underline text-sm">← Back to Dashboard</a>
	</div>

	{#if loading}
		<div class="flex justify-center p-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
		</div>
	{:else if !currentCase}
		<div class="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg text-center">
			<h2 class="text-xl font-bold text-red-800 dark:text-red-200">Case Not Found</h2>
			<p class="text-red-600 dark:text-red-300 mt-2">The case you requested does not exist or you do not have permission to view it.</p>
		</div>
	{:else}
		<div class="bg-background border border-border rounded-lg p-6 mb-8 shadow-sm">
			<div class="flex justify-between items-start mb-4">
				<div>
					<h1 class="font-title text-3xl mb-2">{currentCase.title}</h1>
					<p class="text-muted-foreground">
						Case ID: <span class="font-mono text-sm">{currentCase.id}</span>
					</p>
				</div>
				<div class="flex items-center gap-3">
					<select
						value={currentCase.status}
						onchange={handleStatusChange}
						class="px-3 py-1 rounded-full border-2 bg-background cursor-pointer {currentCase.status === 'active'
							? 'border-green-500 text-green-800 dark:text-green-400'
							: currentCase.status === 'pending'
								? 'border-yellow-500 text-yellow-800 dark:text-yellow-400'
								: 'border-gray-500 text-gray-800 dark:text-gray-400'}"
					>
						<option value="pending">Pending</option>
						<option value="active">Active</option>
						<option value="closed">Closed</option>
					</select>

					<button
						onclick={() => showEditModal = true}
						class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
						title="Edit Case"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
					</button>

					{#if currentCase.status !== 'closed'}
						<button
							onclick={async () => {
								const result = await casesStore.archiveCase(currentCase.id);
								if (result.success) toastStore.success('Case archived');
								else toastStore.error(result.error || 'Failed to archive');
							}}
							class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
							title="Archive Case"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
							</svg>
						</button>
					{:else}
						<button
							onclick={async () => {
								const result = await casesStore.reopenCase(currentCase.id);
								if (result.success) toastStore.success('Case reopened');
								else toastStore.error(result.error || 'Failed to reopen');
							}}
							class="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
							title="Reopen Case"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
						</button>
					{/if}

					<button
						onclick={() => showDeleteConfirm = true}
						class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
						title="Delete Case"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				</div>
			</div>

			{#if currentCase.description}
				<p class="text-muted-foreground mb-4">{currentCase.description}</p>
			{/if}

			<div class="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
				<div>
					<h3 class="font-semibold mb-2">Client</h3>
					{#if client}
						<p class="font-medium">
							{client.firstName} {client.lastName}
						</p>
						<p class="text-sm text-muted-foreground">{client.email}</p>
						{#if client.phoneNumber}
							<p class="text-sm text-muted-foreground">{client.phoneNumber}</p>
						{/if}
					{:else}
						<p class="text-muted-foreground italic">Client information unavailable</p>
					{/if}
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
						<button 
							onclick={() => showUploadModal = true}
							class="bg-gold hover:bg-gold-dark text-black font-semibold px-4 py-2 rounded-md transition-colors shadow-sm"
						>
							Upload
						</button>
					</div>

					{#if documentsStore.documents.length > 0}
						<div class="bg-background border border-border rounded-lg overflow-hidden shadow-sm">
							<table class="w-full">
								<thead class="bg-muted border-b border-border">
									<tr>
										<th class="text-left px-4 py-3 text-sm font-semibold">File Name</th>
										<th class="text-left px-4 py-3 text-sm font-semibold">Size</th>
										<th class="text-right px-4 py-3 text-sm font-semibold">Actions</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-border">
									{#each documentsStore.documents as doc}
										<tr class="hover:bg-muted/50 transition-colors">
											<td class="px-4 py-3 text-sm">{doc.document.fileName}</td>
											<td class="px-4 py-3 text-sm text-muted-foreground">
												{(doc.document.fileSize / 1024).toFixed(1)} KB
											</td>
											<td class="px-4 py-3 text-right">
												<a 
													href="/api/documents/{doc.document.id}" 
													class="text-gold hover:underline text-sm font-medium"
													target="_blank"
												>
													Download
												</a>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="bg-background border border-border rounded-lg p-8 text-center shadow-sm">
							<p class="text-muted-foreground">No documents uploaded yet</p>
						</div>
					{/if}
				</div>

				<!-- Invoices -->
				<div>
					<div class="flex justify-between items-center mb-4">
						<h2 class="font-title text-2xl">Invoices</h2>
						<button
							onclick={() => (showInvoiceModal = true)}
							class="bg-gold hover:bg-gold-dark text-black font-semibold px-4 py-2 rounded-md transition-colors shadow-sm"
						>
							Create Invoice
						</button>
					</div>

					{#if invoicesStore.invoices.length > 0}
						<div class="space-y-3">
							{#each invoicesStore.invoices as item}
								<div class="bg-background border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
									<div class="flex justify-between items-start mb-2">
										<div>
											<h3 class="font-semibold">{item.invoice.description}</h3>
											<p class="text-sm text-muted-foreground">
												Due: {formatDate(item.invoice.dueDate)}
											</p>
										</div>
										<span
											class="text-xs px-2 py-1 rounded-full border {item.invoice.status === 'paid'
												? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
												: item.invoice.status === 'partial'
													? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
													: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}"
										>
											{item.invoice.status}
										</span>
									</div>
									<div class="flex justify-between items-end">
									<div>
										<div class="text-lg font-bold">{formatCurrency(item.invoice.amount)}</div>
										{#if item.invoice.paidAmount > 0 && item.invoice.status !== 'paid'}
											<p class="text-sm text-muted-foreground">
												Paid: {formatCurrency(item.invoice.paidAmount)}
											</p>
										{/if}
									</div>
									{#if item.invoice.status !== 'paid'}
										<button
											onclick={() => openMarkPaidConfirm(item.invoice.id, item.invoice.amount)}
											class="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
										>
											Mark Paid
										</button>
									{/if}
								</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="bg-background border border-border rounded-lg p-8 text-center shadow-sm">
							<p class="text-muted-foreground">No invoices created yet</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Right Column - Messages -->
			<div>
				<h2 class="font-title text-2xl mb-4">Messages</h2>

				<div class="bg-background border border-border rounded-lg overflow-hidden shadow-sm flex flex-col h-[600px]">
					<div class="flex-1 overflow-y-auto p-4 space-y-4">
						{#if messagesStore.messages.length > 0}
							{#each messagesStore.messages as { message, sender }}
								<div
									class="max-w-[80%] p-3 rounded-lg {sender.id === client?.id
										? 'bg-muted self-start mr-auto'
										: 'bg-gold/10 self-end ml-auto'}"
								>
									<div class="flex justify-between items-start mb-1 gap-4">
										<span class="font-semibold text-sm">
											{sender.firstName} {sender.lastName}
										</span>
										<span class="text-xs text-muted-foreground whitespace-nowrap">
											{formatDate(message.createdAt)}
										</span>
									</div>
									<p class="text-sm whitespace-pre-wrap">{message.content}</p>
								</div>
							{/each}
						{:else}
							<div class="flex flex-col items-center justify-center h-full text-muted-foreground">
								<p>No messages yet</p>
							</div>
						{/if}
					</div>

					<div class="border-t border-border p-4 bg-background">
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
								class="flex-1 px-3 py-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-gold/20 outline-none transition-all"
								disabled={sendingMessage}
							/>
							<button
								type="submit"
								class="bg-gold hover:bg-gold-dark text-black font-semibold px-6 py-2 rounded-md transition-colors disabled:opacity-50"
								disabled={sendingMessage || !messageText.trim()}
							>
								{sendingMessage ? '...' : 'Send'}
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Modals -->
{#if currentCase}
	<CreateInvoiceModal 
		open={showInvoiceModal} 
		caseId={currentCase.id} 
		caseName={currentCase.title}
		oncreated={handleInvoiceCreated} 
		onclose={() => showInvoiceModal = false} 
	/>

	<UploadDocumentModal 
		open={showUploadModal} 
		caseId={currentCase.id}
		onclose={() => showUploadModal = false}
		onuploaded={handleDocumentUploaded}
	/>

	<EditCaseModal
		open={showEditModal}
		caseData={{
			id: currentCase.id,
			title: currentCase.title,
			description: currentCase.description,
			status: currentCase.status
		}}
		onupdated={handleCaseUpdated}
		onclose={() => showEditModal = false}
	/>

	<ConfirmDialog
		open={showDeleteConfirm}
		title="Delete Case"
		message="Are you sure you want to delete this case? This action cannot be undone and will delete all associated documents and invoices."
		confirmText="Delete Case"
		variant="danger"
		loading={deleting}
		onconfirm={handleDeleteCase}
		oncancel={() => showDeleteConfirm = false}
	/>

	<ConfirmDialog
		open={showMarkPaidConfirm}
		title="Mark Invoice as Paid"
		message="Mark this invoice of {formatCurrency(markPaidAmount)} as fully paid?"
		confirmText="Mark Paid"
		loading={markingPaid}
		onconfirm={handleMarkAsPaid}
		oncancel={() => { showMarkPaidConfirm = false; markPaidInvoiceId = null; }}
	/>
{/if}
