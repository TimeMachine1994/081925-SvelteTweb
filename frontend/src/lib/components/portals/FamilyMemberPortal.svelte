<!-- TODO: Remove Tailwind CSS classes and replace with styles from tribute-theme.css -->
<script lang="ts">
	import type { Event } from '$lib/types/event';

	let { memorials }: { memorials: Event[] } = $props();
</script>

<div class="max-w-6xl mx-auto px-6 py-8">
	<h2 class="text-3xl font-bold text-slate-900 mb-6">Events You've Been Invited To</h2>
	{#if memorials && memorials.length > 0}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each memorials as event}
				<div class="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
					<h3 class="text-xl font-semibold text-slate-900 mb-4">{event.lovedOneName}</h3>
					<div class="space-y-2">
						<a href="/{event.fullSlug}" class="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
							>View Event</a
						>
						<a href="/profile" class="inline-block px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors">Manage Event</a>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-slate-600">You have not been invited to any events yet.</p>
	{/if}
</div>
