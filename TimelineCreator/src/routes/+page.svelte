<script lang="ts">
	import { Button, Card, Modal } from '$lib/components/ui';
	import { enhance } from '$app/forms';

	let { data } = $props();

	let deleteModalOpen = $state(false);
	let projectToDelete = $state<{ id: string; title: string } | null>(null);
	let isDeleting = $state(false);

	function openDeleteModal(project: { id: string; title: string }) {
		projectToDelete = project;
		deleteModalOpen = true;
	}

	function formatDate(date: Date) {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(date));
	}
</script>

<svelte:head>
	<title>TimelineCreator - Projects</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<header class="bg-white border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-gray-900">TimelineCreator</h1>
					<p class="text-sm text-gray-500 mt-1">Legal Timeline Presentation Tool</p>
				</div>
				<a href="/new">
					<Button variant="primary">
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						New Timeline
					</Button>
				</a>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{#if data.projects.length === 0}
			<div class="text-center py-16">
				<svg class="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
				</svg>
				<h2 class="mt-4 text-xl font-semibold text-gray-900">No timelines yet</h2>
				<p class="mt-2 text-gray-500">Create your first legal timeline to get started.</p>
				<div class="mt-6">
					<a href="/new">
						<Button variant="primary" size="lg">Create Your First Timeline</Button>
					</a>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each data.projects as project}
					<Card hoverable onclick={() => window.location.href = `/projects/${project.id}`}>
						<div class="flex items-start justify-between">
							<div class="flex-1 min-w-0">
								<h3 class="text-lg font-semibold text-gray-900 truncate">{project.title}</h3>
								<p class="text-sm text-gray-500 mt-1">
									{project.dataSourceType === 'google_sheets' ? 'Google Sheets' : 'Local CSV'}
								</p>
							</div>
							<button
								type="button"
								onclick={(e) => {
									e.stopPropagation();
									openDeleteModal({ id: project.id, title: project.title });
								}}
								class="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
								aria-label="Delete project"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
						</div>
						<div class="mt-4 pt-4 border-t border-gray-100">
							<p class="text-xs text-gray-400">
								Last updated: {formatDate(project.updatedAt)}
							</p>
						</div>
					</Card>
				{/each}
			</div>
		{/if}
	</main>
</div>

<Modal bind:open={deleteModalOpen} title="Delete Timeline">
	<p class="text-gray-600">
		Are you sure you want to delete <strong>{projectToDelete?.title}</strong>? This action cannot be undone.
	</p>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => deleteModalOpen = false}>Cancel</Button>
		<form
			method="POST"
			action="?/delete"
			use:enhance={() => {
				isDeleting = true;
				return async ({ update }) => {
					await update();
					isDeleting = false;
					deleteModalOpen = false;
				};
			}}
		>
			<input type="hidden" name="projectId" value={projectToDelete?.id} />
			<Button variant="danger" type="submit" loading={isDeleting}>Delete</Button>
		</form>
	{/snippet}
</Modal>
