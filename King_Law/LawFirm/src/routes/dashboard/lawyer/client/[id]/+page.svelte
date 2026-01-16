<script lang="ts">
	import { faArrowLeft, faUser, faFolder, faFileAlt, faFileInvoiceDollar, faEnvelope, faPhone, faCalendar, faCheckCircle, faClock, faTimesCircle, faGavel } from '@fortawesome/free-solid-svg-icons';
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
	<title>{data.client.firstName} {data.client.lastName} - Client Profile</title>
</svelte:head>

<div class="min-h-screen bg-background py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Back Button -->
		<a href="/dashboard/lawyer" class="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
			<Icon icon={faArrowLeft} />
			<span>Back to Dashboard</span>
		</a>

		<!-- Client Header -->
		<div class="bg-secondary rounded-lg border border-border p-6 mb-8">
			<div class="flex items-start gap-6">
				<div class="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center">
					<Icon icon={faUser} class="text-gold" size="2xl" />
				</div>
				<div class="flex-1">
					<h1 class="font-title text-3xl font-bold mb-2">
						{data.client.firstName} {data.client.lastName}
					</h1>
					<div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
						{#if data.client.email}
							<a href="mailto:{data.client.email}" class="flex items-center gap-2 hover:text-gold">
								<Icon icon={faEnvelope} />
								{data.client.email}
							</a>
						{/if}
						{#if data.client.phoneNumber}
							<a href="tel:{data.client.phoneNumber}" class="flex items-center gap-2 hover:text-gold">
								<Icon icon={faPhone} />
								{data.client.phoneNumber}
							</a>
						{/if}
						<span class="flex items-center gap-2">
							<Icon icon={faCalendar} />
							Client since {formatDate(data.client.createdAt)}
						</span>
					</div>
				</div>
				<button class="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark transition-colors font-semibold">
					+ New Case
				</button>
			</div>
		</div>

		<!-- Stats Grid -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
			<div class="bg-secondary p-4 rounded-lg border border-border">
				<div class="flex items-center justify-between mb-1">
					<Icon icon={faFolder} class="text-gold" />
					<span class="text-2xl font-bold">{data.stats.totalCases}</span>
				</div>
				<div class="text-xs text-muted-foreground">Total Cases</div>
			</div>
			<div class="bg-secondary p-4 rounded-lg border border-border">
				<div class="flex items-center justify-between mb-1">
					<Icon icon={faCheckCircle} class="text-green-500" />
					<span class="text-2xl font-bold">{data.stats.activeCases}</span>
				</div>
				<div class="text-xs text-muted-foreground">Active Cases</div>
			</div>
			<div class="bg-secondary p-4 rounded-lg border border-border">
				<div class="flex items-center justify-between mb-1">
					<Icon icon={faFileInvoiceDollar} class="text-gold" />
					<span class="text-xl font-bold">{formatCurrency(data.stats.totalPaid)}</span>
				</div>
				<div class="text-xs text-muted-foreground">Total Paid</div>
			</div>
			<div class="bg-secondary p-4 rounded-lg border border-border">
				<div class="flex items-center justify-between mb-1">
					<Icon icon={faFileInvoiceDollar} class="text-red-500" />
					<span class="text-xl font-bold">{formatCurrency(data.stats.outstanding)}</span>
				</div>
				<div class="text-xs text-muted-foreground">Outstanding</div>
			</div>
		</div>

		<!-- Cases Section -->
		<div class="mb-8">
			<h2 class="font-title text-2xl font-bold mb-4">Cases</h2>
			{#if data.cases.length === 0}
				<div class="bg-secondary p-8 rounded-lg border border-border text-center">
					<Icon icon={faFolder} size="2xl" class="text-muted-foreground mx-auto mb-4" />
					<p class="text-muted-foreground">No cases for this client yet</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.cases as caseItem}
						<a 
							href="/dashboard/lawyer/case/{caseItem.id}"
							class="block bg-secondary p-4 rounded-lg border border-border hover:border-gold transition-colors"
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<Icon icon={getStatusIcon(caseItem.status)} class={getStatusColor(caseItem.status)} />
									<div>
										<div class="font-semibold">{caseItem.title}</div>
										<div class="text-xs text-muted-foreground">
											Created {formatDate(caseItem.createdAt)}
										</div>
									</div>
								</div>
								<span class="px-3 py-1 bg-background rounded-lg text-xs font-semibold capitalize">
									{caseItem.status}
								</span>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Documents & Invoices Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Documents -->
			<div>
				<h2 class="font-title text-xl font-bold mb-4">Recent Documents</h2>
				<div class="bg-secondary rounded-lg border border-border overflow-hidden">
					{#if data.documents.length === 0}
						<div class="p-6 text-center text-muted-foreground">
							<Icon icon={faFileAlt} size="xl" class="mx-auto mb-2 opacity-50" />
							<p>No documents yet</p>
						</div>
					{:else}
						<div class="divide-y divide-border">
							{#each data.documents.slice(0, 5) as doc}
								<div class="p-4 hover:bg-background transition-colors">
									<div class="flex items-center gap-3">
										<Icon icon={faFileAlt} class="text-gold" />
										<div class="flex-1 min-w-0">
											<div class="font-semibold text-sm truncate">{doc.fileName}</div>
											<div class="text-xs text-muted-foreground">{doc.case.title}</div>
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
				<h2 class="font-title text-xl font-bold mb-4">Invoices</h2>
				<div class="bg-secondary rounded-lg border border-border overflow-hidden">
					{#if data.invoices.length === 0}
						<div class="p-6 text-center text-muted-foreground">
							<Icon icon={faFileInvoiceDollar} size="xl" class="mx-auto mb-2 opacity-50" />
							<p>No invoices yet</p>
						</div>
					{:else}
						<div class="divide-y divide-border">
							{#each data.invoices.slice(0, 5) as invoice}
								<div class="p-4 hover:bg-background transition-colors">
									<div class="flex items-center justify-between">
										<div>
											<div class="font-semibold text-sm">{invoice.description}</div>
											<div class="text-xs text-muted-foreground">{invoice.case.title}</div>
										</div>
										<div class="text-right">
											<div class="font-bold">{formatCurrency(invoice.amount)}</div>
											<span class={`text-xs font-semibold capitalize ${
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
	</div>
</div>
