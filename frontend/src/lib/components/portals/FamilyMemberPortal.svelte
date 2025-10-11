<!-- TODO: Remove Tailwind CSS classes and replace with styles from tribute-theme.css -->
<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';

	let { memorials }: { memorials: Memorial[] } = $props();
</script>

<div class="TODO: replace-with-theme-class">
	<h2 class="TODO: replace-with-theme-class">Memorials You've Been Invited To</h2>
	{#if memorials && memorials.length > 0}
		<div class="TODO: replace-with-theme-class">
			{#each memorials as memorial}
				<div class="TODO: replace-with-theme-class">
					<h2 class="TODO: replace-with-theme-class">{memorial.lovedOneName}</h2>
					<a href="/{memorial.fullSlug || memorial.slug}" class="TODO: replace-with-theme-class"
						>View Memorial</a
					>
					<a href="/profile" class="TODO: replace-with-theme-class">Manage Memorial</a>
				</div>
			{/each}
		</div>
	{:else}
		<p>You have not been invited to any memorials yet.</p>
	{/if}
</div>
