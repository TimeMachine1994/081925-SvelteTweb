<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let loading = $state(true);
	let caseData = $state<any>(null);
	let documents = $state<any[]>([]);
	let messages = $state<any[]>([]);
	let error = $state('');

	const caseId = $derived($page.params.id);

	onMount(async () => {
		await loadCaseData();
	});

	async function loadCaseData() {
		loading = true;
		error = '';

		try {
			// Fetch case details
			const caseResponse = await fetch(`/api/cases/${caseId}`);
			if (!caseResponse.ok) {
				if (caseResponse.status === 403) {
					error = 'You are not assigned to this case';
				} else {
					error = 'Failed to load case';
				}
				loading = false;
				return;
			}
			caseData = await caseResponse.json();

			// Fetch documents
			const docsResponse = await fetch(`/api/documents?caseId=${caseId}`);
			if (docsResponse.ok) {
				const docsData = await docsResponse.json();
				documents = docsData.documents || [];
			}

			// Fetch messages
			const msgsResponse = await fetch(`/api/messages?caseId=${caseId}`);
			if (msgsResponse.ok) {
				const msgsData = await msgsResponse.json();
				messages = msgsData.messages || [];
			}
		} catch (e) {
			error = 'Failed to load case data';
		}

		loading = false;
	}

	function formatDate(timestamp: number) {
		return new Date(timestamp * 1000).toLocaleDateString();
	}
</script>

<div>
	{#if loading}
		<div class="text-center py-12 text-muted-foreground">Loading case...</div>
	{:else if error}
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
			<p class="text-red-800 dark:text-red-200">{error}</p>
			<a href="/dashboard/staff" class="text-gold hover:underline mt-2 inline-block">← Back to Dashboard</a>
		</div>
	{:else if caseData}
		<!-- Header -->
		<div class="mb-8">
			<a href="/dashboard/staff" class="text-muted-foreground hover:text-foreground mb-4 inline-block">
				← Back to Dashboard
			</a>
			<div class="flex justify-between items-start">
				<div>
					<h1 class="text-3xl font-title">{caseData.title}</h1>
					<p class="text-muted-foreground mt-1">{caseData.description || 'No description'}</p>
				</div>
				<span class="px-3 py-1 text-sm rounded capitalize {
					caseData.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
					caseData.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
					'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
				}">
					{caseData.status}
				</span>
			</div>
		</div>

		<!-- Read-Only Notice -->
		<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
			<p class="text-sm text-blue-700 dark:text-blue-300">
				<strong>Read-Only Access:</strong> You can view case details, download documents, and read messages. Contact an attorney to make changes.
			</p>
		</div>

		<div class="grid md:grid-cols-2 gap-8">
			<!-- Documents Section -->
			<div class="bg-card border border-border rounded-lg">
				<div class="px-6 py-4 border-b border-border">
					<h2 class="text-lg font-semibold">Documents</h2>
				</div>
				{#if documents.length === 0}
					<div class="p-6 text-center text-muted-foreground">No documents</div>
				{:else}
					<div class="divide-y divide-border">
						{#each documents as doc}
							<div class="p-4 flex justify-between items-center">
								<div>
									<p class="font-medium">{doc.fileName}</p>
									<p class="text-sm text-muted-foreground">
										{(doc.fileSize / 1024).toFixed(1)} KB • {formatDate(doc.uploadedAt)}
									</p>
								</div>
								<a 
									href="/api/documents/{doc.id}/download" 
									class="text-gold hover:text-gold-dark text-sm font-medium"
									download
								>
									Download
								</a>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Messages Section -->
			<div class="bg-card border border-border rounded-lg">
				<div class="px-6 py-4 border-b border-border">
					<h2 class="text-lg font-semibold">Messages</h2>
				</div>
				{#if messages.length === 0}
					<div class="p-6 text-center text-muted-foreground">No messages</div>
				{:else}
					<div class="divide-y divide-border max-h-96 overflow-y-auto">
						{#each messages as msg}
							<div class="p-4">
								<div class="flex justify-between items-start mb-1">
									<p class="font-medium text-sm">{msg.senderName || 'Unknown'}</p>
									<span class="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
								</div>
								<p class="text-sm text-muted-foreground">{msg.content}</p>
							</div>
						{/each}
					</div>
				{/if}
				<!-- No message input for staff -->
				<div class="px-6 py-4 border-t border-border bg-muted/30">
					<p class="text-sm text-muted-foreground text-center">
						Staff members cannot send messages
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
