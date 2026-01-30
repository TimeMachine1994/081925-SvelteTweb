<script lang="ts">
	import { onMount } from 'svelte';
	import type { EmailAuditLog, EmailType, EmailStatus } from '$lib/types/email-audit';

	// State
	let logs = $state<(EmailAuditLog & { id: string })[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	
	// Pagination
	let page = $state(1);
	let hasMore = $state(false);
	
	// Filters
	let filterType = $state<EmailType | ''>('');
	let filterStatus = $state<EmailStatus | ''>('');
	let searchEmail = $state('');
	
	// Detail view
	let selectedLog = $state<(EmailAuditLog & { id: string }) | null>(null);
	let showDetail = $state(false);
	let resending = $state(false);
	let resendMessage = $state<string | null>(null);

	const EMAIL_TYPES: { value: EmailType; label: string }[] = [
		{ value: 'enhanced_registration', label: '📝 Enhanced Registration' },
		{ value: 'basic_registration', label: '📝 Basic Registration' },
		{ value: 'funeral_director_registration', label: '🏢 FD Registration' },
		{ value: 'invitation', label: '📨 Invitation' },
		{ value: 'email_change_confirmation', label: '✉️ Email Change' },
		{ value: 'payment_confirmation', label: '✅ Payment Confirmed' },
		{ value: 'payment_action_required', label: '⚠️ Payment Action' },
		{ value: 'payment_failure', label: '❌ Payment Failed' },
		{ value: 'password_reset', label: '🔑 Password Reset' },
		{ value: 'owner_welcome', label: '👋 Owner Welcome' },
		{ value: 'funeral_director_welcome', label: '👋 FD Welcome' },
		{ value: 'contact_form_support', label: '📞 Contact (Support)' },
		{ value: 'contact_form_confirmation', label: '📞 Contact (Confirm)' },
		{ value: 'invoice', label: '💳 Invoice' },
		{ value: 'invoice_receipt', label: '🧾 Invoice Receipt' }
	];

	async function fetchLogs() {
		loading = true;
		error = null;
		
		try {
			const params = new URLSearchParams();
			params.set('page', String(page));
			params.set('limit', '50');
			if (filterType) params.set('type', filterType);
			if (filterStatus) params.set('status', filterStatus);
			if (searchEmail) params.set('search', searchEmail);

			const response = await fetch(`/api/admin/email-logs?${params}`);
			
			if (!response.ok) {
				throw new Error('Failed to fetch email logs');
			}

			const data = await response.json();
			logs = data.logs;
			hasMore = data.pagination.hasMore;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	async function viewDetail(log: EmailAuditLog & { id: string }) {
		selectedLog = log;
		showDetail = true;
		resendMessage = null;
	}

	function closeDetail() {
		showDetail = false;
		selectedLog = null;
		resendMessage = null;
	}

	async function resendEmail() {
		if (!selectedLog) return;
		
		resending = true;
		resendMessage = null;
		
		try {
			const response = await fetch(`/api/admin/email-logs/${selectedLog.id}/resend`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.message || 'Failed to resend email');
			}

			resendMessage = `✅ ${data.message}`;
			// Refresh logs to show new entry
			await fetchLogs();
		} catch (err) {
			resendMessage = `❌ ${err instanceof Error ? err.message : 'Failed to resend'}`;
		} finally {
			resending = false;
		}
	}

	function applyFilters() {
		page = 1;
		fetchLogs();
	}

	function clearFilters() {
		filterType = '';
		filterStatus = '';
		searchEmail = '';
		page = 1;
		fetchLogs();
	}

	function nextPage() {
		if (hasMore) {
			page++;
			fetchLogs();
		}
	}

	function prevPage() {
		if (page > 1) {
			page--;
			fetchLogs();
		}
	}

	function getStatusBadge(status: EmailStatus) {
		switch (status) {
			case 'sent':
				return 'bg-green-100 text-green-800';
			case 'failed':
				return 'bg-red-100 text-red-800';
			case 'mocked':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getTypeLabel(type: EmailType) {
		return EMAIL_TYPES.find(t => t.value === type)?.label || type;
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleString();
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}

	onMount(() => {
		fetchLogs();
	});
</script>

<svelte:head>
	<title>Email Audit Logs | Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-gray-900">📧 Email Audit Logs</h1>
			<p class="text-gray-600">View and manage all emails sent from the system</p>
		</div>

		<!-- Filters -->
		<div class="bg-white rounded-lg shadow p-4 mb-6">
			<div class="flex flex-wrap gap-4 items-end">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
					<select 
						bind:value={filterType}
						class="border rounded-lg px-3 py-2 text-sm"
					>
						<option value="">All Types</option>
						{#each EMAIL_TYPES as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
					<select 
						bind:value={filterStatus}
						class="border rounded-lg px-3 py-2 text-sm"
					>
						<option value="">All Statuses</option>
						<option value="sent">✅ Sent</option>
						<option value="failed">❌ Failed</option>
						<option value="mocked">🔸 Mocked</option>
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Search Email</label>
					<input 
						type="text"
						bind:value={searchEmail}
						placeholder="recipient@email.com"
						class="border rounded-lg px-3 py-2 text-sm w-64"
					/>
				</div>

				<button 
					onclick={applyFilters}
					class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
				>
					Apply Filters
				</button>

				<button 
					onclick={clearFilters}
					class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm"
				>
					Clear
				</button>
			</div>
		</div>

		<!-- Loading -->
		{#if loading}
			<div class="bg-white rounded-lg shadow p-8 text-center">
				<div class="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
				<p class="text-gray-600 mt-4">Loading email logs...</p>
			</div>
		{:else if error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
				{error}
			</div>
		{:else}
			<!-- Table -->
			<div class="bg-white rounded-lg shadow overflow-hidden">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent At</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Environment</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each logs as log}
							<tr class="hover:bg-gray-50 cursor-pointer" onclick={() => viewDetail(log)}>
								<td class="px-4 py-3 text-sm">
									{getTypeLabel(log.type)}
								</td>
								<td class="px-4 py-3 text-sm text-gray-900 font-mono">
									{log.to}
								</td>
								<td class="px-4 py-3 text-sm text-gray-600">
									{formatDate(log.sentAt as string)}
								</td>
								<td class="px-4 py-3">
									<span class="px-2 py-1 text-xs rounded-full {getStatusBadge(log.status)}">
										{log.status}
									</span>
								</td>
								<td class="px-4 py-3 text-sm text-gray-500">
									{log.environment}
								</td>
								<td class="px-4 py-3">
									<button 
										onclick={(e) => { e.stopPropagation(); viewDetail(log); }}
										class="text-blue-600 hover:text-blue-800 text-sm"
									>
										View
									</button>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="6" class="px-4 py-8 text-center text-gray-500">
									No email logs found
								</td>
							</tr>
						{/each}
					</tbody>
				</table>

				<!-- Pagination -->
				<div class="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
					<div class="text-sm text-gray-600">
						Page {page}
					</div>
					<div class="flex gap-2">
						<button 
							onclick={prevPage}
							disabled={page === 1}
							class="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
						>
							← Previous
						</button>
						<button 
							onclick={nextPage}
							disabled={!hasMore}
							class="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
						>
							Next →
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Detail Modal -->
{#if showDetail && selectedLog}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
			<!-- Modal Header -->
			<div class="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
				<h2 class="text-lg font-semibold text-gray-900">
					{getTypeLabel(selectedLog.type)}
				</h2>
				<button 
					onclick={closeDetail}
					class="text-gray-500 hover:text-gray-700 text-2xl"
				>
					×
				</button>
			</div>

			<!-- Modal Body -->
			<div class="p-6 overflow-y-auto flex-1">
				<!-- Status Badge -->
				<div class="mb-4">
					<span class="px-3 py-1 rounded-full text-sm {getStatusBadge(selectedLog.status)}">
						{selectedLog.status === 'sent' ? '✅ Sent' : selectedLog.status === 'failed' ? '❌ Failed' : '🔸 Mocked'}
					</span>
				</div>

				<!-- Basic Info -->
				<div class="grid grid-cols-2 gap-4 mb-6">
					<div>
						<label class="text-xs text-gray-500 uppercase">To</label>
						<p class="font-mono text-sm">{selectedLog.to}</p>
					</div>
					<div>
						<label class="text-xs text-gray-500 uppercase">From</label>
						<p class="font-mono text-sm">{selectedLog.from}</p>
					</div>
					<div>
						<label class="text-xs text-gray-500 uppercase">Sent At</label>
						<p class="text-sm">{formatDate(selectedLog.sentAt as string)}</p>
					</div>
					<div>
						<label class="text-xs text-gray-500 uppercase">Environment</label>
						<p class="text-sm">{selectedLog.environment}</p>
					</div>
					{#if selectedLog.templateName}
						<div>
							<label class="text-xs text-gray-500 uppercase">Template</label>
							<p class="text-sm">{selectedLog.templateName}</p>
						</div>
					{/if}
					{#if selectedLog.triggeredBy}
						<div>
							<label class="text-xs text-gray-500 uppercase">Triggered By</label>
							<p class="text-sm">{selectedLog.triggeredBy}</p>
						</div>
					{/if}
				</div>

				<!-- Related Entities -->
				{#if selectedLog.memorialId || selectedLog.userId || selectedLog.invoiceId}
					<div class="mb-6">
						<label class="text-xs text-gray-500 uppercase block mb-2">Related</label>
						<div class="flex gap-4 text-sm">
							{#if selectedLog.memorialId}
								<a href="/admin/services/memorials/{selectedLog.memorialId}" class="text-blue-600 hover:underline">
									Memorial: {selectedLog.memorialId.slice(0, 8)}...
								</a>
							{/if}
							{#if selectedLog.userId}
								<span class="text-gray-600">User: {selectedLog.userId.slice(0, 8)}...</span>
							{/if}
							{#if selectedLog.invoiceId}
								<span class="text-gray-600">Invoice: {selectedLog.invoiceId.slice(0, 8)}...</span>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Error (if failed) -->
				{#if selectedLog.error}
					<div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
						<label class="text-xs text-red-600 uppercase block mb-1">Error</label>
						<p class="text-sm text-red-800 font-mono">{selectedLog.error}</p>
					</div>
				{/if}

				<!-- Template Data -->
				<div class="mb-6">
					<div class="flex items-center justify-between mb-2">
						<label class="text-xs text-gray-500 uppercase">Template Data</label>
						<button 
							onclick={() => copyToClipboard(JSON.stringify(selectedLog?.templateData, null, 2))}
							class="text-blue-600 hover:text-blue-800 text-xs"
						>
							📋 Copy JSON
						</button>
					</div>
					<pre class="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">{JSON.stringify(selectedLog.templateData, null, 2)}</pre>
				</div>

				<!-- SendGrid Message ID -->
				{#if selectedLog.sendgridMessageId}
					<div class="text-xs text-gray-500">
						SendGrid ID: <code class="bg-gray-100 px-1 rounded">{selectedLog.sendgridMessageId}</code>
					</div>
				{/if}

				<!-- Resend Message -->
				{#if resendMessage}
					<div class="mt-4 p-3 rounded-lg {resendMessage.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}">
						{resendMessage}
					</div>
				{/if}
			</div>

			<!-- Modal Footer -->
			<div class="px-6 py-4 border-t bg-gray-50 flex justify-between">
				<button 
					onclick={closeDetail}
					class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
				>
					Close
				</button>
				<button 
					onclick={resendEmail}
					disabled={resending}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
				>
					{#if resending}
						<span class="animate-spin">⟳</span> Resending...
					{:else}
						🔄 Resend Email
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
