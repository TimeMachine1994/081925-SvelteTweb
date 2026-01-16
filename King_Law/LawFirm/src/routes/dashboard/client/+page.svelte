<script lang="ts">
	import { faFolder, faFileAlt, faFileInvoiceDollar, faComments, faGavel, faCheckCircle, faClock, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
	import Icon from '$lib/components/Icon.svelte';
	import MessagePanel from '$lib/components/MessagePanel.svelte';
	import type { PageData } from './$types';

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
</script>

<svelte:head>
	<title>Client Dashboard - King Law Firm</title>
</svelte:head>

<div class="min-h-screen bg-background py-8">
	<div class="flex gap-0">
		<div class="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl">
		<!-- Welcome Header -->
		<div class="mb-8">
			<h1 class="font-title text-4xl font-bold mb-2">
				Welcome, {data.user.firstName}!
			</h1>
			<p class="text-muted-foreground">
				Manage your cases, documents, and communications with your attorney
			</p>
		</div>

		<!-- Quick Stats -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
			<div class="bg-secondary p-6 rounded-lg border border-gray-300 dark:border-gray-700">
				<div class="flex items-center justify-between mb-2">
					<Icon icon={faFolder} class="text-gold" size="lg" />
					<span class="text-3xl font-bold">{data.cases.length}</span>
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
					<span class="text-3xl font-bold">{data.invoices.filter(i => i.status !== 'paid').length}</span>
				</div>
				<div class="text-sm text-muted-foreground">Pending Invoices</div>
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
			<h2 class="font-title text-2xl font-bold mb-4">Your Cases</h2>
			
			{#if data.cases.length === 0}
				<div class="bg-secondary p-8 rounded-lg border border-gray-300 dark:border-gray-700 text-center">
					<Icon icon={faFolder} size="2xl" class="text-muted-foreground mx-auto mb-4" />
					<p class="text-muted-foreground">No cases yet. Contact us to get started.</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each data.cases as caseItem}
						<div class="bg-secondary p-6 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-gold transition-colors">
							<div class="flex items-start justify-between mb-4">
								<div class="flex-1">
									<div class="flex items-center space-x-3 mb-2">
										<Icon icon={getStatusIcon(caseItem.status)} class={getStatusColor(caseItem.status)} />
										<h3 class="font-title text-xl font-bold">{caseItem.title}</h3>
									</div>
									<p class="text-muted-foreground mb-2">{caseItem.description || 'No description provided'}</p>
									<div class="text-sm text-muted-foreground">
										<span class="font-semibold">Attorney:</span>
										{caseItem.lawyer.firstName} {caseItem.lawyer.lastName}
										{#if caseItem.lawyer.email}
											• <a href="mailto:{caseItem.lawyer.email}" class="text-gold hover:underline">{caseItem.lawyer.email}</a>
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
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Documents & Invoices Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Recent Documents -->
			<div>
				<h2 class="font-title text-2xl font-bold mb-4">Recent Documents</h2>
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
										<div class="flex items-center space-x-3">
											<Icon icon={faFileAlt} class="text-gold" />
											<div>
												<div class="font-semibold">{doc.fileName}</div>
												<div class="text-sm text-muted-foreground">
													{formatDate(doc.uploadedAt)}
												</div>
											</div>
										</div>
										<button class="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark transition-colors text-sm font-semibold">
											Download
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Invoices -->
			<div>
				<h2 class="font-title text-2xl font-bold mb-4">Invoices</h2>
				<div class="bg-secondary rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
					{#if data.invoices.length === 0}
						<div class="p-8 text-center">
							<Icon icon={faFileInvoiceDollar} size="2xl" class="text-muted-foreground mx-auto mb-4" />
							<p class="text-muted-foreground">No invoices yet</p>
						</div>
					{:else}
						<div class="divide-y divide-border">
							{#each data.invoices as invoice}
								<div class="p-4 hover:bg-background transition-colors">
									<div class="flex items-center justify-between mb-2">
										<div class="flex-1">
											<div class="font-semibold">{invoice.description}</div>
											<div class="text-sm text-muted-foreground">
												Due: {formatDate(invoice.dueDate)}
											</div>
										</div>
										<div class="text-right">
											<div class="text-2xl font-bold">{formatCurrency(invoice.amount)}</div>
											<span class={`text-sm font-semibold capitalize ${
												invoice.status === 'paid' ? 'text-green-600' :
												invoice.status === 'partial' ? 'text-yellow-600' :
												'text-red-600'
											}`}>
												{invoice.status}
											</span>
										</div>
									</div>
									{#if invoice.status !== 'paid'}
										<button class="w-full mt-2 px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark transition-colors text-sm font-semibold">
											Pay Now
										</button>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

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

		<!-- Message Panel - Right Side -->
		{#if data.activeCaseId}
			<div class="hidden lg:block h-screen sticky top-0">
				<MessagePanel
					caseId={data.activeCaseId}
					currentUserId={data.user.id}
					bind:messages={messages}
					onSendMessage={handleSendMessage}
				/>
			</div>
		{/if}
	</div>
</div>
