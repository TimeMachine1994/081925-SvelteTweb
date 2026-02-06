<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import CreateInvoiceModal from '$lib/components/CreateInvoiceModal.svelte';
	import DocumentPreviewModal from '$lib/components/DocumentPreviewModal.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(cents / 100);
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	let messageText = $state('');
	let showInvoiceForm = $state(false);
	let showInvoiceModal = $state(false);
	let uploadingFile = $state(false);
	let confirmPayId = $state<string | null>(null);
	let previewDoc = $state<{ id: string; fileName: string; fileSize: number; mimeType: string } | null>(null);

	function handleInvoiceCreated() {
		showInvoiceModal = false;
		window.location.reload();
	}

	async function sendMessage() {
		if (!messageText.trim()) return;

		try {
			const response = await fetch('/api/messages/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					caseId: data.case.id,
					recipientId: data.client.id,
					content: messageText
				})
			});

			if (response.ok) {
				messageText = '';
				window.location.reload();
			}
		} catch (error) {
			console.error('Failed to send message:', error);
		}
	}

	async function uploadFile(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploadingFile = true;
		const formData = new FormData();
		formData.append('file', file);
		formData.append('caseId', data.case.id);

		try {
			const response = await fetch('/api/documents/upload', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				window.location.reload();
			}
		} catch (error) {
			console.error('Failed to upload file:', error);
		} finally {
			uploadingFile = false;
		}
	}
</script>

<div>
	<div class="mb-6">
		<a href="/dashboard/lawyer" class="text-gold hover:underline text-sm">← Back to Dashboard</a>
	</div>

	<div class="bg-background border border-border rounded-lg p-6 mb-8">
		<div class="flex justify-between items-start mb-4">
			<div>
				<h1 class="font-title text-3xl mb-2">{data.case.title}</h1>
				<p class="text-muted-foreground">
					Case ID: <span class="font-mono text-sm">{data.case.id}</span>
				</p>
			</div>
			<form method="POST" action="?/updateStatus" use:enhance>
				<select
					name="status"
					value={data.case.status}
					onchange={(e) => e.currentTarget.form?.requestSubmit()}
					class="px-3 py-1 rounded-full border-2 {data.case.status === 'active'
						? 'border-green-500 text-green-800 dark:text-green-400'
						: data.case.status === 'pending'
							? 'border-yellow-500 text-yellow-800 dark:text-yellow-400'
							: 'border-gray-500 text-gray-800 dark:text-gray-400'}"
				>
					<option value="pending">Pending</option>
					<option value="active">Active</option>
					<option value="closed">Closed</option>
				</select>
			</form>
		</div>

		{#if data.case.description}
			<p class="text-muted-foreground mb-4">{data.case.description}</p>
		{/if}

		<div class="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
			<div>
				<h3 class="font-semibold mb-2">Client</h3>
				<p>
					{data.client.firstName} {data.client.lastName}
				</p>
				<p class="text-sm text-muted-foreground">{data.client.email}</p>
				{#if data.client.phoneNumber}
					<p class="text-sm text-muted-foreground">{data.client.phoneNumber}</p>
				{/if}
			</div>
			<div>
				<h3 class="font-semibold mb-2">Case Dates</h3>
				<p class="text-sm">
					<span class="text-muted-foreground">Created:</span>
					{formatDate(data.case.createdAt)}
				</p>
				<p class="text-sm">
					<span class="text-muted-foreground">Updated:</span>
					{formatDate(data.case.updatedAt)}
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

				{#if data.documents.length > 0}
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
								{#each data.documents as doc}
									<tr class="border-t border-border hover:bg-muted/50">
										<td class="px-4 py-3 text-sm">{doc.fileName}</td>
										<td class="px-4 py-3 text-sm text-muted-foreground">
											{(doc.fileSize / 1024).toFixed(1)} KB
										</td>
										<td class="px-4 py-3 text-right space-x-2">
											<button
												onclick={() => (previewDoc = { id: doc.id, fileName: doc.fileName, fileSize: doc.fileSize, mimeType: doc.mimeType })}
												class="text-gold hover:underline text-sm"
											>
												Preview
											</button>
											<a href="/api/documents/{doc.id}" class="text-gold hover:underline text-sm">
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
				<div class="flex justify-between items-center mb-4">
					<h2 class="font-title text-2xl">Invoices</h2>
					<button
						onclick={() => (showInvoiceModal = true)}
						class="bg-gold hover:bg-gold-dark text-black font-semibold px-4 py-2 rounded-md transition-colors"
					>
						Create Invoice
					</button>
				</div>

				{#if showInvoiceForm}
					<form method="POST" action="?/createInvoice" use:enhance class="bg-background border border-border rounded-lg p-4 mb-4">
						<div class="space-y-3">
							<div>
								<label for="description" class="block text-sm font-medium mb-1">Description</label>
								<input
									type="text"
									id="description"
									name="description"
									required
									class="w-full px-3 py-2 border border-input rounded-md bg-background"
								/>
							</div>
							<div>
								<label for="amount" class="block text-sm font-medium mb-1">Amount ($)</label>
								<input
									type="number"
									id="amount"
									name="amount"
									step="0.01"
									required
									class="w-full px-3 py-2 border border-input rounded-md bg-background"
								/>
							</div>
							<div>
								<label for="dueDate" class="block text-sm font-medium mb-1">Due Date</label>
								<input
									type="date"
									id="dueDate"
									name="dueDate"
									required
									class="w-full px-3 py-2 border border-input rounded-md bg-background"
								/>
							</div>
							<button
								type="submit"
								class="w-full bg-gold hover:bg-gold-dark text-black font-semibold py-2 rounded-md transition-colors"
							>
								Create Invoice
							</button>
						</div>
					</form>
				{/if}

				{#if data.invoices.length > 0}
					<div class="space-y-3">
						{#each data.invoices as invoice}
							<div class="bg-background border border-border rounded-lg p-4">
								<div class="flex justify-between items-start mb-2">
									<div>
										<h3 class="font-semibold">{invoice.description}</h3>
										<p class="text-sm text-muted-foreground">
											Due: {formatDate(invoice.dueDate)}
										</p>
									</div>
									<span
										class="text-xs px-2 py-1 rounded-full {invoice.status === 'paid'
											? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
											: invoice.status === 'partial'
												? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
												: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}"
									>
										{invoice.status}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<div>
										<div class="text-lg font-bold">{formatCurrency(invoice.amount)}</div>
										{#if invoice.paidAmount > 0}
											<p class="text-sm text-muted-foreground">
												Paid: {formatCurrency(invoice.paidAmount)}
											</p>
										{/if}
									</div>
									{#if invoice.status !== 'paid'}
										{#if confirmPayId === invoice.id}
											<div class="flex items-center gap-2">
												<span class="text-xs text-muted-foreground">Confirm?</span>
												<form method="POST" action="?/markPaid" use:enhance>
													<input type="hidden" name="invoiceId" value={invoice.id} />
													<button
														type="submit"
														class="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
													>
														Yes, Mark Paid
													</button>
												</form>
												<button
													onclick={() => (confirmPayId = null)}
													class="text-xs px-3 py-1 border border-input rounded-md hover:bg-muted transition-colors"
												>
													Cancel
												</button>
											</div>
										{:else}
											<button
												onclick={() => (confirmPayId = invoice.id)}
												class="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
											>
												Mark Paid
											</button>
										{/if}
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="bg-background border border-border rounded-lg p-8 text-center">
						<p class="text-muted-foreground">No invoices created yet</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right Column - Messages -->
		<div>
			<h2 class="font-title text-2xl mb-4">Messages</h2>

			<div class="bg-background border border-border rounded-lg overflow-hidden">
				<div class="h-96 overflow-y-auto p-4 space-y-4">
					{#if data.messages.length > 0}
						{#each data.messages as { message, sender }}
							<div
								class="p-3 rounded-lg {sender.id === data.client.id
									? 'bg-muted ml-4'
									: 'bg-gold/10 mr-4'}"
							>
								<div class="flex justify-between items-start mb-1">
									<span class="font-semibold text-sm">
										{sender.firstName} {sender.lastName}
									</span>
									<span class="text-xs text-muted-foreground">
										{formatDate(message.createdAt)}
									</span>
								</div>
								<p class="text-sm">{message.content}</p>
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
							class="flex-1 px-3 py-2 border border-input rounded-md bg-background"
						/>
						<button
							type="submit"
							class="bg-gold hover:bg-gold-dark text-black font-semibold px-6 py-2 rounded-md transition-colors"
						>
							Send
						</button>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Create Invoice Modal -->
<CreateInvoiceModal 
	open={showInvoiceModal} 
	caseId={data.case.id} 
	caseName={data.case.title}
	oncreated={handleInvoiceCreated} 
	onclose={() => (showInvoiceModal = false)} 
/>

<!-- Document Preview Modal -->
<DocumentPreviewModal
	open={!!previewDoc}
	doc={previewDoc}
	onclose={() => (previewDoc = null)}
/>
