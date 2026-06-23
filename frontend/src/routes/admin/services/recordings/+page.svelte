<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import RecordingPicker from '$lib/components/admin/RecordingPicker.svelte';
	import { goto, invalidateAll } from '$app/navigation';

	let { data } = $props();

	let search = $state('');

	const filtered = $derived(
		data.memorials.filter((m) =>
			m.lovedOneName.toLowerCase().includes(search.trim().toLowerCase())
		)
	);

	function selectMemorial(id: string) {
		goto(`/admin/services/recordings?memorialId=${id}`);
	}

	function clearSelection() {
		goto('/admin/services/recordings');
	}
</script>

<AdminLayout
	title="Recording Picker"
	subtitle="Select which Mux recordings are published on each memorial page"
>
	{#if data.selectedMemorial}
		<div class="toolbar">
			<button class="back-btn" onclick={clearSelection}>← All memorials</button>
			<div class="selected-info">
				<strong>{data.selectedMemorial.lovedOneName}</strong>
				{#if data.selectedMemorial.fullSlug}
					<a
						class="view-link"
						href={`/${data.selectedMemorial.fullSlug}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						View public page ↗
					</a>
				{/if}
				<a class="manage-link" href={`/admin/services/memorials/${data.selectedMemorial.id}`}>
					Open memorial admin →
				</a>
			</div>
		</div>

		<div class="card">
			{#if data.streams.length === 0}
				<p class="empty">This memorial has no streams.</p>
			{:else}
				<RecordingPicker
					memorialId={data.selectedMemorial.id}
					streams={data.streams}
					onSaved={() => invalidateAll()}
				/>
			{/if}
		</div>
	{:else}
		<div class="card">
			<input
				class="search"
				type="text"
				placeholder="Search memorials by name…"
				bind:value={search}
			/>

			{#if filtered.length === 0}
				<p class="empty">No memorials match your search.</p>
			{:else}
				<ul class="memorial-list">
					{#each filtered as memorial (memorial.id)}
						<li>
							<button class="memorial-row" onclick={() => selectMemorial(memorial.id)}>
								<span class="name">{memorial.lovedOneName}</span>
								{#if memorial.fullSlug}
									<span class="slug">/{memorial.fullSlug}</span>
								{/if}
								<span class="chevron">›</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</AdminLayout>

<style>
	.toolbar {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.back-btn {
		background: white;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		padding: 0.45rem 0.8rem;
		cursor: pointer;
		font-weight: 600;
	}

	.selected-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.view-link,
	.manage-link {
		color: #d5ba7f;
		font-weight: 600;
		text-decoration: none;
	}

	.view-link:hover,
	.manage-link:hover {
		text-decoration: underline;
	}

	.card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.search {
		width: 100%;
		padding: 0.6rem 0.85rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.5rem;
		font-size: 0.95rem;
		margin-bottom: 1rem;
	}

	.search:focus {
		outline: none;
		border-color: #d5ba7f;
		box-shadow: 0 0 0 1px #d5ba7f;
	}

	.memorial-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.memorial-row {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.7rem 0.85rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #f8fafc;
		cursor: pointer;
		text-align: left;
		transition: border-color 0.15s ease, background 0.15s ease;
	}

	.memorial-row:hover {
		background: #f1f5f9;
		border-color: #d5ba7f;
	}

	.name {
		font-weight: 600;
		color: #1a202c;
	}

	.slug {
		font-family: monospace;
		font-size: 0.8rem;
		color: #a0aec0;
	}

	.chevron {
		margin-left: auto;
		color: #a0aec0;
		font-size: 1.2rem;
	}

	.empty {
		color: #718096;
		font-style: italic;
	}
</style>
