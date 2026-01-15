<script lang="ts">
	import { faArrowLeft, faFileAlt, faFileInvoiceDollar, faComments, faDownload, faCheckCircle, faClock, faTimesCircle, faGavel, faPlus, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
	import Icon from '$lib/components/Icon.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

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

	// Message state
	let newMessage = $state('');
	let isSending = $state(false);
	let messagesData = $state(data.messages);

	// Invoice modal state
	let showInvoiceModal = $state(false);
	let invoiceDescription = $state('');
	let invoiceAmount = $state('');
	let invoiceDueDate = $state('');

	async function sendMessage() {
		if (!newMessage.trim() || isSending) return;

		isSending = true;
		try {
			const res = await fetch('/api/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					caseId: data.case.id,
					content: newMessage.trim()
				})
			});

			if (res.ok) {
				const result = await res.json();
				messagesData = [...messagesData, {
					...result.message,
					sender: {
						firstName: data.user.firstName,
						lastName: data.user.lastName,
						role: data.user.role
					}
				}];
				newMessage = '';
			}
		} catch (e) {
			console.error('Failed to send message:', e);
		} finally {
			isSending = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	async function updateCaseStatus(newStatus: string) {
		// TODO: Implement case status update API
		console.log('Update case status to:', newStatus);
	}
</script>

<svelte:head>
	<title>{data.case.title} - King Law Firm</title>
</svelte:head>

<div class="min-h-screen bg-background py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Back Button & Header -->
		<div class="mb-8">
			<a href="/dashboard/lawyer" class="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
				<Icon icon={faArrowLeft} />
				<span>Back to Dashboard</span>
			</a>
			
			<div class="flex items-start justify-between">
				<div>
					<div class="flex items-center gap-3 mb-2">
						<Icon icon={getStatusIcon(data.case.status)} class={getStatusColor(data.case.status)} size="lg" />
						<h1 class="font-title text-3xl font-bold">{data.case.title}</h1>
					</div>
					{#if data.case.description}
						<p class="text-muted-foreground mb-2">{data.case.description}</p>
					{/if}
					<div class="text-sm text-muted-foreground">
						<span class="font-semibold">Client:</span>
						<a href="/dashboard/lawyer/client/{data.case.client.id}" class="text-gold hover:underline">
							{data.case.client.firstName} {data.case.client.lastName}
						</a>
						{#if data.case.client.email}
							• <a href="mailto:{data.case.client.email}" class="text-gold hover:underline">{data.case.client.email}</a>
						{/if}
						{#if data.case.client.phoneNumber}
							• <a href="tel:{data.case.client.phoneNumber}" class="text-gold hover:underline">{data.case.client.phoneNumber}</a>
						{/if}
					</div>
				</div>
				<div class="flex items-center gap-2">
					<select 
						class="px-4 py-2 bg-secondary rounded-lg border border-border text-sm font-semibold focus:border-gold focus:outline-none"
						value={data.case.status}
						onchange={(e) => updateCaseStatus(e.currentTarget.value)}
					>
						<option value="pending">Pending</option>
						<option value="active">Active</option>
						<option value="closed">Closed</option>
					</select>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Left Column: Documents & Invoices -->
			<div class="lg:col-span-1 space-y-8">
				<!-- Documents -->
				<div>
					<div class="flex items-center justify-between mb-4">
						<h2 class="font-title text-xl font-bold">Documents</h2>
						<button class="px-3 py-1.5 bg-gold text-black rounded-lg hover:bg-gold-dark transition-colors text-sm font-semibold flex items-center gap-1">
							<Icon icon={faPlus} size="sm" />
							Upload
						</button>
					</div>
					<div class="bg-secondary rounded-lg border border-border overflow-hidden">
						{#if data.documents.length === 0}
							<div class="p-6 text-center text-muted-foreground">
								<Icon icon={faFileAlt} size="xl" class="mx-auto mb-2 opacity-50" />
								<p>No documents yet</p>
							</div>
						{:else}
							<div class="divide-y divide-border">
								{#each data.documents as doc}
									<div class="p-4 hover:bg-background transition-colors">
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-3 flex-1">
												<Icon icon={faFileAlt} class="text-gold" />
												<div class="flex-1 min-w-0">
													<div class="font-semibold text-sm truncate">{doc.fileName}</div>
													<div class="text-xs text-muted-foreground">
														{doc.uploader.firstName} {doc.uploader.lastName} • {formatDate(doc.uploadedAt)}
													</div>
												</div>
											</div>
											<div class="flex items-center gap-1">
												<a 
													href="/api/documents/{doc.id}/download" 
													class="p-2 hover:bg-gold/10 rounded-lg transition-colors"
													title="Download"
												>
													<Icon icon={faDownload} class="text-gold" size="sm" />
												</a>
												<button
													class="p-2 hover:bg-gold/10 rounded-lg transition-colors"
													title="Move to another case"
												>
													<Icon icon={faExchangeAlt} class="text-muted-foreground" size="sm" />
												</button>
											</div>
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
						<h2 class="font-title text-xl font-bold">Invoices</h2>
						<button 
							onclick={() => showInvoiceModal = true}
							class="px-3 py-1.5 bg-gold text-black rounded-lg hover:bg-gold-dark transition-colors text-sm font-semibold flex items-center gap-1"
						>
							<Icon icon={faPlus} size="sm" />
							Create
						</button>
					</div>
					<div class="bg-secondary rounded-lg border border-border overflow-hidden">
						{#if data.invoices.length === 0}
							<div class="p-6 text-center text-muted-foreground">
								<Icon icon={faFileInvoiceDollar} size="xl" class="mx-auto mb-2 opacity-50" />
								<p>No invoices yet</p>
							</div>
						{:else}
							<div class="divide-y divide-border">
								{#each data.invoices as invoice}
									<div class="p-4 hover:bg-background transition-colors">
										<div class="flex items-center justify-between mb-2">
											<div class="font-semibold text-sm">{invoice.description}</div>
											<span class={`text-xs font-semibold capitalize px-2 py-1 rounded ${
												invoice.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
												invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
												'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
											}`}>
												{invoice.status}
											</span>
										</div>
										<div class="flex items-center justify-between">
											<div class="text-xs text-muted-foreground">Due: {formatDate(invoice.dueDate)}</div>
											<div class="text-lg font-bold">{formatCurrency(invoice.amount)}</div>
										</div>
										{#if invoice.paidAmount > 0 && invoice.status !== 'paid'}
											<div class="text-xs text-muted-foreground mt-1">
												Paid: {formatCurrency(invoice.paidAmount)} / {formatCurrency(invoice.amount)}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Right Column: Messages -->
			<div class="lg:col-span-2">
				<h2 class="font-title text-xl font-bold mb-4">Messages</h2>
				<div class="bg-secondary rounded-lg border border-border flex flex-col" style="height: 600px;">
					<!-- Messages List -->
					<div class="flex-1 overflow-y-auto p-4 space-y-4">
						{#if messagesData.length === 0}
							<div class="flex h-full items-center justify-center text-center text-muted-foreground">
								<div>
									<Icon icon={faComments} size="2xl" class="mx-auto mb-4 opacity-50" />
									<p>No messages yet</p>
									<p class="text-sm">Start the conversation with your client</p>
								</div>
							</div>
						{:else}
							{#each messagesData as message}
								{@const isOwn = message.senderId === data.user.id}
								<div class="flex {isOwn ? 'justify-end' : 'justify-start'}">
									<div class="max-w-[75%]">
										<div class="rounded-2xl px-4 py-2 {isOwn ? 'bg-gold text-black rounded-br-md' : 'bg-background text-foreground rounded-bl-md'}">
											{#if !isOwn}
												<div class="mb-1 text-xs font-semibold text-gold">
													{message.sender.firstName} {message.sender.lastName}
													<span class="text-muted-foreground capitalize">({message.sender.role})</span>
												</div>
											{/if}
											<p class="whitespace-pre-wrap break-words">{message.content}</p>
										</div>
										<div class="mt-1 px-2 text-xs text-muted-foreground {isOwn ? 'text-right' : ''}">
											{formatTime(message.createdAt)}
											{#if isOwn && message.readAt}
												<span class="ml-2 text-green-500">Read</span>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						{/if}
					</div>

					<!-- Message Input -->
					<div class="border-t border-border p-4">
						<div class="flex items-end gap-2">
							<textarea
								bind:value={newMessage}
								onkeydown={handleKeydown}
								placeholder="Type a message..."
								rows="2"
								class="flex-1 resize-none rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
							></textarea>
							<button
								onclick={sendMessage}
								disabled={!newMessage.trim() || isSending}
								class="px-6 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isSending ? 'Sending...' : 'Send'}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
