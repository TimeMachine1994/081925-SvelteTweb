<script lang="ts">
	import { faFolder, faFileAlt, faFileInvoiceDollar, faComments, faUsers, faCheckCircle, faClock, faTimesCircle, faGavel, faTimes, faPaperPlane, faSpinner, faPlus, faEnvelope } from '@fortawesome/free-solid-svg-icons';
	import Icon from '$lib/components/Icon.svelte';
	import ChatSlider from '$lib/components/ChatSlider.svelte';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let messages = $state(data.messages || []);

	async function handleSendMessage(content: string) {
		if (!data.activeCaseId) return;

		const response = await fetch('/api/messages', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				caseId: data.activeCaseId,
				content
			})
		});

		if (response.ok) {
			const { message } = await response.json();
			messages = [...messages, message];
		} else {
			throw new Error('Failed to send message');
		}
	}

	// Prepare cases for chat slider
	const chatCases = data.cases.map(c => ({ id: c.id, title: c.title }));

	// Modal states
	let showInvoiceModal = $state(false);
	let showCaseModal = $state(false);
	let showThreadModal = $state(false);
	let showMessageModal = $state(false);
	let showUploadModal = $state(false);

	// Invoice form state
	let invoiceCaseId = $state('');
	let invoiceAmount = $state('');
	let invoiceDescription = $state('');
	let invoiceDueDate = $state('');
	let invoiceSubmitting = $state(false);

	// Case form state
	let caseClientId = $state('');
	let caseTitle = $state('');
	let caseDescription = $state('');
	let caseStatus = $state<'active' | 'pending'>('pending');
	let caseSubmitting = $state(false);

	// Thread modal state
	let selectedThread = $state<typeof data.uncategorizedThreads[0] | null>(null);
	let threadReply = $state('');
	let threadReplying = $state(false);

	// New message state
	let messageRecipientId = $state('');
	let messageCaseId = $state('');
	let messageContent = $state('');
	let messageSending = $state(false);

	// Document upload state
	let uploadCaseId = $state('');
	let uploadFile = $state<File | null>(null);
	let uploadSubmitting = $state(false);

	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(cents / 100);
	}

	function formatDate(date: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(new Date(date));
	}

	function formatTime(date: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(date));
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'active': return faCheckCircle;
			case 'pending': return faClock;
			case 'closed': return faTimesCircle;
			default: return faGavel;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'active': return 'text-green-600 dark:text-green-400';
			case 'pending': return 'text-yellow-600 dark:text-yellow-400';
			case 'closed': return 'text-gray-600 dark:text-gray-400';
			default: return 'text-gold';
		}
	}

	const totalRevenue = data.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
	const pendingRevenue = data.invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);

	// Invoice submission
	async function submitInvoice() {
		if (!invoiceCaseId || !invoiceAmount || !invoiceDescription || !invoiceDueDate) return;
		invoiceSubmitting = true;
		try {
			const res = await fetch('/api/invoices', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					caseId: invoiceCaseId,
					amount: parseFloat(invoiceAmount),
					description: invoiceDescription,
					dueDate: invoiceDueDate
				})
			});
			if (res.ok) {
				showInvoiceModal = false;
				invoiceCaseId = '';
				invoiceAmount = '';
				invoiceDescription = '';
				invoiceDueDate = '';
				await invalidateAll();
			}
		} catch (e) {
			console.error('Failed to create invoice:', e);
		} finally {
			invoiceSubmitting = false;
		}
	}

	// Case submission
	async function submitCase() {
		if (!caseClientId || !caseTitle) return;
		caseSubmitting = true;
		try {
			const res = await fetch('/api/cases', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					clientId: caseClientId,
					title: caseTitle,
					description: caseDescription,
					status: caseStatus
				})
			});
			if (res.ok) {
				showCaseModal = false;
				caseClientId = '';
				caseTitle = '';
				caseDescription = '';
				caseStatus = 'pending';
				await invalidateAll();
			}
		} catch (e) {
			console.error('Failed to create case:', e);
		} finally {
			caseSubmitting = false;
		}
	}

	// Create case from thread
	async function createCaseFromThread() {
		if (!selectedThread || !caseTitle) return;
		caseSubmitting = true;
		try {
			const res = await fetch('/api/cases/from-uncategorized', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					clientId: selectedThread.client.id,
					title: caseTitle,
					description: caseDescription,
					messageIds: selectedThread.messages.map(m => m.id)
				})
			});
			if (res.ok) {
				showThreadModal = false;
				selectedThread = null;
				caseTitle = '';
				caseDescription = '';
				await invalidateAll();
			}
		} catch (e) {
			console.error('Failed to create case from thread:', e);
		} finally {
			caseSubmitting = false;
		}
	}

	// Reply to uncategorized thread
	async function replyToThread() {
		if (!selectedThread || !threadReply.trim()) return;
		threadReplying = true;
		try {
			const res = await fetch('/api/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					recipientId: selectedThread.client.id,
					content: threadReply.trim()
				})
			});
			if (res.ok) {
				threadReply = '';
				await invalidateAll();
			}
		} catch (e) {
			console.error('Failed to reply:', e);
		} finally {
			threadReplying = false;
		}
	}

	// Send new message
	async function sendMessage() {
		if (!messageContent.trim()) return;
		if (!messageCaseId && !messageRecipientId) return;
		messageSending = true;
		try {
			const res = await fetch('/api/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					caseId: messageCaseId || null,
					recipientId: messageRecipientId || null,
					content: messageContent.trim()
				})
			});
			if (res.ok) {
				showMessageModal = false;
				messageRecipientId = '';
				messageCaseId = '';
				messageContent = '';
				await invalidateAll();
			}
		} catch (e) {
			console.error('Failed to send message:', e);
		} finally {
			messageSending = false;
		}
	}

	// Upload document
	async function uploadDocument() {
		if (!uploadCaseId || !uploadFile) return;
		uploadSubmitting = true;
		try {
			const formData = new FormData();
			formData.append('file', uploadFile);
			formData.append('caseId', uploadCaseId);
			const res = await fetch('/api/documents/upload', {
				method: 'POST',
				body: formData
			});
			if (res.ok) {
				showUploadModal = false;
				uploadCaseId = '';
				uploadFile = null;
				await invalidateAll();
			}
		} catch (e) {
			console.error('Failed to upload document:', e);
		} finally {
			uploadSubmitting = false;
		}
	}

	function openThreadModal(thread: typeof data.uncategorizedThreads[0]) {
		selectedThread = thread;
		caseTitle = '';
		caseDescription = '';
		showThreadModal = true;
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			uploadFile = target.files[0];
		}
	}
</script>

<svelte:head>
	<title>Lawyer Dashboard - King Law Firm</title>
</svelte:head>

<div class="min-h-screen bg-background py-8">
	<div class="flex gap-0">
		<div class="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl">
		<!-- Welcome Header -->
		<div class="mb-8">
			<h1 class="font-title text-4xl font-bold mb-2">
				Welcome, Attorney {data.user.lastName}
			</h1>
			<p class="text-muted-foreground">
				Manage your caseload, clients, and communications
			</p>
		</div>

		<!-- Quick Stats -->
		<div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
			<div class="bg-secondary p-6 rounded-lg border border-gray-300 dark:border-gray-700">
				<div class="flex items-center justify-between mb-2">
					<Icon icon={faFolder} class="text-gold" size="lg" />
					<span class="text-3xl font-bold">{data.cases.length}</span>
				</div>
				<div class="text-sm text-muted-foreground">Total Cases</div>
			</div>

			<div class="bg-secondary p-6 rounded-lg border border-gray-300 dark:border-gray-700">
				<div class="flex items-center justify-between mb-2">
					<Icon icon={faUsers} class="text-gold" size="lg" />
					<span class="text-3xl font-bold">{data.cases.filter(c => c.status === 'active').length}</span>
				</div>
				<div class="text-sm text-muted-foreground">Active Cases</div>
			</div>

			<div class="bg-secondary p-6 rounded-lg border border-gray-300 dark:border-gray-700">
				<div class="flex items-center justify-between mb-2">
					<Icon icon={faFileAlt} class="text-gold" size="lg" />
					<span class="text-3xl font-bold">{data.documents.length}</span>
				</div>
				<div class="text-sm text-muted-foreground">Documents</div>
			</div>

			<div class="bg-secondary p-6 rounded-lg border border-gray-300 dark:border-gray-700">
				<div class="flex items-center justify-between mb-2">
					<Icon icon={faFileInvoiceDollar} class="text-gold" size="lg" />
					<span class="text-xl font-bold">{formatCurrency(totalRevenue)}</span>
				</div>
				<div class="text-sm text-muted-foreground">Total Revenue</div>
			</div>

			<div class="bg-secondary p-6 rounded-lg border border-gray-300 dark:border-gray-700">
				<div class="flex items-center justify-between mb-2">
					<Icon icon={faComments} class="text-gold" size="lg" />
					<span class="text-3xl font-bold">{data.messages.filter(m => !m.readAt && m.senderId !== data.user.id).length}</span>
				</div>
				<div class="text-sm text-muted-foreground">Unread Messages</div>
			</div>
		</div>

		<!-- Cases Section -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-4">
				<h2 class="font-title text-2xl font-bold">Cases</h2>
				<button onclick={() => showCaseModal = true} class="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark transition-colors font-semibold">
					+ New Case
				</button>
			</div>
			
			{#if data.cases.length === 0}
				<div class="bg-secondary p-8 rounded-lg border border-gray-300 dark:border-gray-700 text-center">
					<Icon icon={faFolder} size="2xl" class="text-muted-foreground mx-auto mb-4" />
					<p class="text-muted-foreground">No cases yet</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each data.cases as caseItem}
						<a href="/dashboard/lawyer/case/{caseItem.id}" class="block bg-secondary p-6 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-gold transition-colors cursor-pointer">
							<div class="flex items-start justify-between mb-4">
								<div class="flex-1">
									<div class="flex items-center space-x-3 mb-2">
										<Icon icon={getStatusIcon(caseItem.status)} class={getStatusColor(caseItem.status)} />
										<h3 class="font-title text-xl font-bold">{caseItem.title}</h3>
									</div>
									<p class="text-muted-foreground mb-2">{caseItem.description || 'No description provided'}</p>
									<div class="text-sm text-muted-foreground">
										<span class="font-semibold">Client:</span>
										<span class="text-gold">{caseItem.client.firstName} {caseItem.client.lastName}</span>
										{#if caseItem.client.email}
											• {caseItem.client.email}
										{/if}
									</div>
								</div>
								<span class="px-3 py-1 bg-background rounded-lg text-sm font-semibold capitalize">
									{caseItem.status}
								</span>
							</div>
							<div class="flex space-x-4 text-sm text-muted-foreground">
								<span>Created: {formatDate(caseItem.createdAt)}</span>
								<span>•</span>
								<span>Updated: {formatDate(caseItem.updatedAt)}</span>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Uncategorized Messages Section -->
		{#if data.uncategorizedThreads && data.uncategorizedThreads.length > 0}
			<div class="mb-8">
				<h2 class="font-title text-2xl font-bold mb-4 flex items-center gap-2">
					<span class="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
					Uncategorized Messages
				</h2>
				<p class="text-muted-foreground text-sm mb-4">Messages from potential clients without an assigned case</p>
				<div class="space-y-4">
					{#each data.uncategorizedThreads as thread}
						<div class="bg-secondary p-6 rounded-lg border border-yellow-500/50 hover:border-yellow-500 transition-colors">
							<div class="flex items-start justify-between mb-3">
								<div>
									<div class="font-semibold text-lg">{thread.client.firstName} {thread.client.lastName}</div>
									<div class="text-sm text-muted-foreground">{thread.client.email}</div>
								</div>
								<div class="flex items-center gap-2">
									{#if thread.unreadCount > 0}
										<span class="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
											{thread.unreadCount} new
										</span>
									{/if}
									<span class="text-sm text-muted-foreground">{thread.messages.length} messages</span>
								</div>
							</div>
							<div class="bg-background p-3 rounded-lg mb-3 text-sm">
								<p class="text-muted-foreground line-clamp-2">{thread.messages[thread.messages.length - 1]?.content || 'No messages'}</p>
							</div>
							<div class="flex gap-2">
								<button onclick={() => openThreadModal(thread)} class="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark transition-colors font-semibold text-sm">
									View & Reply
								</button>
								<button onclick={() => { openThreadModal(thread); }} class="px-4 py-2 bg-secondary border border-gold text-gold rounded-lg hover:bg-gold/10 transition-colors font-semibold text-sm">
									Create Case
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Documents & Invoices Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Recent Documents -->
			<div>
				<div class="flex items-center justify-between mb-4">
					<h2 class="font-title text-2xl font-bold">Recent Documents</h2>
					<button onclick={() => showUploadModal = true} class="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark transition-colors font-semibold text-sm">
						+ Upload
					</button>
				</div>
				<div class="bg-secondary rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
					{#if data.documents.length === 0}
						<div class="p-8 text-center">
							<Icon icon={faFileAlt} size="2xl" class="text-muted-foreground mx-auto mb-4" />
							<p class="text-muted-foreground">No documents yet</p>
						</div>
					{:else}
						<div class="divide-y divide-border">
							{#each data.documents.slice(0, 5) as doc}
								<div class="p-4 hover:bg-background transition-colors">
									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-3 flex-1">
											<Icon icon={faFileAlt} class="text-gold" />
											<div class="flex-1">
												<div class="font-semibold">{doc.fileName}</div>
												<div class="text-sm text-muted-foreground">
													{doc.case.title} • {formatDate(doc.uploadedAt)}
												</div>
											</div>
										</div>
										<a href="/api/documents/{doc.id}" class="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark transition-colors text-sm font-semibold">
											Download
										</a>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Invoices -->
			<div>
				<div class="flex items-center justify-between mb-4">
					<h2 class="font-title text-2xl font-bold">Invoices</h2>
					<button onclick={() => showInvoiceModal = true} class="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark transition-colors font-semibold text-sm">
						+ Create Invoice
					</button>
				</div>
				<div class="bg-secondary rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
					{#if data.invoices.length === 0}
						<div class="p-8 text-center">
							<Icon icon={faFileInvoiceDollar} size="2xl" class="text-muted-foreground mx-auto mb-4" />
							<p class="text-muted-foreground">No invoices yet</p>
						</div>
					{:else}
						<div class="divide-y divide-border">
							{#each data.invoices.slice(0, 5) as invoice}
								<div class="p-4 hover:bg-background transition-colors">
									<div class="flex items-center justify-between mb-2">
										<div class="flex-1">
											<div class="font-semibold">{invoice.description}</div>
											<div class="text-sm text-muted-foreground">
												{invoice.case.title} • Due: {formatDate(invoice.dueDate)}
											</div>
										</div>
										<div class="text-right">
											<div class="text-xl font-bold">{formatCurrency(invoice.amount)}</div>
											<span class={`text-sm font-semibold capitalize ${
												invoice.status === 'paid' ? 'text-green-600' :
												invoice.status === 'partial' ? 'text-yellow-600' :
												'text-red-600'
											}`}>
												{invoice.status}
											</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Clients Section -->
		{#if data.clients && data.clients.length > 0}
			<div class="mt-8">
				<h2 class="font-title text-2xl font-bold mb-4">Your Clients</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each data.clients as client}
						<a href="/dashboard/lawyer/client/{client.id}" class="bg-secondary p-4 rounded-lg border border-border hover:border-gold transition-colors">
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
									<Icon icon={faUsers} class="text-gold" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="font-semibold truncate">{client.firstName} {client.lastName}</div>
									<div class="text-xs text-muted-foreground truncate">{client.email}</div>
								</div>
								<span class="text-xs text-muted-foreground">{client.caseCount} case{client.caseCount !== 1 ? 's' : ''}</span>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Recent Messages -->
		<div class="mt-8">
			<h2 class="font-title text-2xl font-bold mb-4">Recent Messages</h2>
			<div class="bg-secondary rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
				{#if data.messages.length === 0}
					<div class="p-8 text-center">
						<Icon icon={faComments} size="2xl" class="text-muted-foreground mx-auto mb-4" />
						<p class="text-muted-foreground">No messages yet</p>
					</div>
				{:else}
					<div class="divide-y divide-border">
						{#each data.messages.slice(0, 5) as message}
							<div class="p-4 hover:bg-background transition-colors {!message.readAt && message.senderId !== data.user.id ? 'bg-gold/5' : ''}">
								<div class="flex items-start space-x-3">
									<div class="flex-1">
										<div class="flex items-center space-x-2 mb-1">
											<span class="font-semibold">
												{message.sender.firstName} {message.sender.lastName}
											</span>
											<span class="text-sm text-muted-foreground">
												in {message.case.title}
											</span>
											{#if !message.readAt && message.senderId !== data.user.id}
												<span class="px-2 py-0.5 bg-gold text-black text-xs font-semibold rounded">New</span>
											{/if}
										</div>
										<p class="text-muted-foreground">{message.content}</p>
										<div class="text-xs text-muted-foreground mt-1">
											{formatDate(message.createdAt)}
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
	</div>
</div>

<!-- Chat Slider -->
<ChatSlider 
	cases={chatCases} 
	currentUserId={data.user.id} 
	userRole="lawyer"
/>

<!-- New Message Button (Fixed) -->
<button
	onclick={() => showMessageModal = true}
	class="fixed bottom-24 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-secondary border-2 border-gold text-gold shadow-lg transition-transform hover:scale-110 hover:bg-gold hover:text-black"
	aria-label="New message"
>
	<Icon icon={faEnvelope} />
</button>

<!-- Invoice Modal -->
{#if showInvoiceModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="bg-background rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-4 border-b border-border">
				<h3 class="font-title text-xl font-bold">Create Invoice</h3>
				<button onclick={() => showInvoiceModal = false} class="p-2 hover:bg-secondary rounded-lg">
					<Icon icon={faTimes} />
				</button>
			</div>
			<div class="p-4 space-y-4">
				<div>
					<label class="block text-sm font-semibold mb-1">Case</label>
					<select bind:value={invoiceCaseId} class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none">
						<option value="">Select a case...</option>
						{#each data.cases as caseItem}
							<option value={caseItem.id}>{caseItem.title} - {caseItem.client.firstName} {caseItem.client.lastName}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-semibold mb-1">Amount ($)</label>
					<input type="number" step="0.01" min="0" bind:value={invoiceAmount} placeholder="0.00" class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none" />
				</div>
				<div>
					<label class="block text-sm font-semibold mb-1">Description</label>
					<input type="text" bind:value={invoiceDescription} placeholder="Legal services for..." class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none" />
				</div>
				<div>
					<label class="block text-sm font-semibold mb-1">Due Date</label>
					<input type="date" bind:value={invoiceDueDate} class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none" />
				</div>
			</div>
			<div class="p-4 border-t border-border flex justify-end gap-2">
				<button onclick={() => showInvoiceModal = false} class="px-4 py-2 rounded-lg border border-border hover:bg-secondary">Cancel</button>
				<button onclick={submitInvoice} disabled={invoiceSubmitting || !invoiceCaseId || !invoiceAmount || !invoiceDescription || !invoiceDueDate} class="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark disabled:opacity-50 font-semibold">
					{#if invoiceSubmitting}
						<Icon icon={faSpinner} class="animate-spin mr-2" />
					{/if}
					Create Invoice
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- New Case Modal -->
{#if showCaseModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="bg-background rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-4 border-b border-border">
				<h3 class="font-title text-xl font-bold">Create New Case</h3>
				<button onclick={() => showCaseModal = false} class="p-2 hover:bg-secondary rounded-lg">
					<Icon icon={faTimes} />
				</button>
			</div>
			<div class="p-4 space-y-4">
				<div>
					<label class="block text-sm font-semibold mb-1">Client</label>
					<select bind:value={caseClientId} class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none">
						<option value="">Select a client...</option>
						{#each data.clients as client}
							<option value={client.id}>{client.firstName} {client.lastName} ({client.email})</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-semibold mb-1">Case Title</label>
					<input type="text" bind:value={caseTitle} placeholder="e.g., Personal Injury Claim" class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none" />
				</div>
				<div>
					<label class="block text-sm font-semibold mb-1">Description</label>
					<textarea bind:value={caseDescription} placeholder="Brief description of the case..." rows="3" class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none resize-none"></textarea>
				</div>
				<div>
					<label class="block text-sm font-semibold mb-1">Status</label>
					<select bind:value={caseStatus} class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none">
						<option value="pending">Pending</option>
						<option value="active">Active</option>
					</select>
				</div>
			</div>
			<div class="p-4 border-t border-border flex justify-end gap-2">
				<button onclick={() => showCaseModal = false} class="px-4 py-2 rounded-lg border border-border hover:bg-secondary">Cancel</button>
				<button onclick={submitCase} disabled={caseSubmitting || !caseClientId || !caseTitle} class="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark disabled:opacity-50 font-semibold">
					{#if caseSubmitting}
						<Icon icon={faSpinner} class="animate-spin mr-2" />
					{/if}
					Create Case
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Thread View/Reply Modal -->
{#if showThreadModal && selectedThread}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="bg-background rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
			<div class="flex items-center justify-between p-4 border-b border-border">
				<div>
					<h3 class="font-title text-xl font-bold">Thread with {selectedThread.client.firstName} {selectedThread.client.lastName}</h3>
					<p class="text-sm text-muted-foreground">{selectedThread.client.email}</p>
				</div>
				<button onclick={() => { showThreadModal = false; selectedThread = null; }} class="p-2 hover:bg-secondary rounded-lg">
					<Icon icon={faTimes} />
				</button>
			</div>
			
			<!-- Messages -->
			<div class="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
				{#each selectedThread.messages as message}
					{@const isOwn = message.senderId === data.user.id}
					<div class="flex {isOwn ? 'justify-end' : 'justify-start'}">
						<div class="max-w-[80%] rounded-2xl px-4 py-2 {isOwn ? 'bg-gold text-black rounded-br-md' : 'bg-secondary text-foreground rounded-bl-md'}">
							<p class="whitespace-pre-wrap break-words">{message.content}</p>
							<div class="text-xs mt-1 {isOwn ? 'text-black/60' : 'text-muted-foreground'}">{formatTime(message.createdAt)}</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Reply Input -->
			<div class="p-4 border-t border-border">
				<div class="flex gap-2 mb-4">
					<textarea bind:value={threadReply} placeholder="Type a reply..." rows="2" class="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none resize-none"></textarea>
					<button onclick={replyToThread} disabled={threadReplying || !threadReply.trim()} class="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark disabled:opacity-50">
						{#if threadReplying}
							<Icon icon={faSpinner} class="animate-spin" />
						{:else}
							<Icon icon={faPaperPlane} />
						{/if}
					</button>
				</div>

				<!-- Create Case Section -->
				<div class="border-t border-border pt-4">
					<h4 class="font-semibold mb-2">Create Case from this Thread</h4>
					<div class="space-y-2">
						<input type="text" bind:value={caseTitle} placeholder="Case Title" class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none" />
						<textarea bind:value={caseDescription} placeholder="Case Description (optional)" rows="2" class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none resize-none"></textarea>
						<button onclick={createCaseFromThread} disabled={caseSubmitting || !caseTitle} class="w-full px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark disabled:opacity-50 font-semibold">
							{#if caseSubmitting}
								<Icon icon={faSpinner} class="animate-spin mr-2" />
							{/if}
							Create Case & Move Messages
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- New Message Modal -->
{#if showMessageModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="bg-background rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-4 border-b border-border">
				<h3 class="font-title text-xl font-bold">New Message</h3>
				<button onclick={() => showMessageModal = false} class="p-2 hover:bg-secondary rounded-lg">
					<Icon icon={faTimes} />
				</button>
			</div>
			<div class="p-4 space-y-4">
				<div>
					<label class="block text-sm font-semibold mb-1">Send to Case</label>
					<select bind:value={messageCaseId} class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none">
						<option value="">Select a case (or send direct)...</option>
						{#each data.cases as caseItem}
							<option value={caseItem.id}>{caseItem.title} - {caseItem.client.firstName} {caseItem.client.lastName}</option>
						{/each}
					</select>
				</div>
				{#if !messageCaseId}
					<div>
						<label class="block text-sm font-semibold mb-1">Or Send Directly to Client</label>
						<select bind:value={messageRecipientId} class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none">
							<option value="">Select a client...</option>
							{#each data.clients as client}
								<option value={client.id}>{client.firstName} {client.lastName}</option>
							{/each}
						</select>
					</div>
				{/if}
				<div>
					<label class="block text-sm font-semibold mb-1">Message</label>
					<textarea bind:value={messageContent} placeholder="Type your message..." rows="4" class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none resize-none"></textarea>
				</div>
			</div>
			<div class="p-4 border-t border-border flex justify-end gap-2">
				<button onclick={() => showMessageModal = false} class="px-4 py-2 rounded-lg border border-border hover:bg-secondary">Cancel</button>
				<button onclick={sendMessage} disabled={messageSending || !messageContent.trim() || (!messageCaseId && !messageRecipientId)} class="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark disabled:opacity-50 font-semibold">
					{#if messageSending}
						<Icon icon={faSpinner} class="animate-spin mr-2" />
					{/if}
					Send Message
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Upload Document Modal -->
{#if showUploadModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="bg-background rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-4 border-b border-border">
				<h3 class="font-title text-xl font-bold">Upload Document</h3>
				<button onclick={() => showUploadModal = false} class="p-2 hover:bg-secondary rounded-lg">
					<Icon icon={faTimes} />
				</button>
			</div>
			<div class="p-4 space-y-4">
				<div>
					<label class="block text-sm font-semibold mb-1">Case</label>
					<select bind:value={uploadCaseId} class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none">
						<option value="">Select a case...</option>
						{#each data.cases as caseItem}
							<option value={caseItem.id}>{caseItem.title} - {caseItem.client.firstName} {caseItem.client.lastName}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-semibold mb-1">File</label>
					<input type="file" onchange={handleFileSelect} class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-gold focus:outline-none" />
					{#if uploadFile}
						<p class="text-sm text-muted-foreground mt-1">Selected: {uploadFile.name}</p>
					{/if}
				</div>
			</div>
			<div class="p-4 border-t border-border flex justify-end gap-2">
				<button onclick={() => showUploadModal = false} class="px-4 py-2 rounded-lg border border-border hover:bg-secondary">Cancel</button>
				<button onclick={uploadDocument} disabled={uploadSubmitting || !uploadCaseId || !uploadFile} class="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark disabled:opacity-50 font-semibold">
					{#if uploadSubmitting}
						<Icon icon={faSpinner} class="animate-spin mr-2" />
					{/if}
					Upload
				</button>
			</div>
		</div>
	</div>
{/if}
