<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="container mx-auto p-8">
	<h1 class="text-2xl font-bold mb-4">My Portal</h1>

	{#if data.memorials && data.memorials.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each data.memorials as memorial}
				<div class="card">
					<h2 class="text-xl font-semibold">{memorial.lovedOneName}</h2>
					<a href="/tributes/{memorial.slug}" class="btn btn-primary mt-4">View Memorial</a>
					{#if memorial.livestreamConfig}
						<a href="/app/checkout/success?configId={memorial.livestreamConfig.id}" class="btn btn-secondary mt-2">View Livestream Details</a>
					{:else}
						<a href="/app/calculator?memorialId={memorial.id}" class="btn btn-secondary mt-2">Schedule Livestream</a>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<p>You have not created any memorials yet.</p>
	{/if}
	<a href="/my-portal/tributes/new" class="btn btn-primary mt-4">Create a New Memorial</a>
</div>