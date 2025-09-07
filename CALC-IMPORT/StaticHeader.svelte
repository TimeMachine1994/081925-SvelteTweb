<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Memorial } from '$lib/types/memorial';

	let { memorial } = $props<{ memorial: Memorial | null }>();

	const fullSlug = memorial ? `${memorial.vanitySlug}/${memorial.shortId}` : '';
	const tributeUrl = `${$page.url.origin}/tributes/${fullSlug}`;

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(tributeUrl);
			alert('Link copied to clipboard!');
		} catch (err) {
			console.error('Failed to copy: ', err);
			alert('Failed to copy link.');
		}
	}

	function shareLink() {
		if (navigator.share) {
			navigator
				.share({
					title: `Tribute for ${memorial?.lovedOneName}`,
					text: `Join us in remembering ${memorial?.lovedOneName}.`,
					url: tributeUrl
				})
				.catch((error) => console.log('Error sharing', error));
		} else {
			// Fallback for browsers that do not support the Web Share API
			copyLink();
		}
	}

	function editLink() {
		if (memorial) {
			goto(`/my-portal/tributes/${memorial.id}/edit`);
		}
	}
</script>

{#if memorial}
	<div class="card p-4 mb-8">
		<div class="flex flex-wrap justify-between items-center gap-4">
			<div class="flex-1 min-w-[250px]">
				<p class="font-semibold">Your Tribute Link:</p>
				<a href={tributeUrl} target="_blank" class="link text-lg break-all">
					{tributeUrl}
				</a>
			</div>
			<div class="flex gap-2">
				<button class="btn preset-tonal-surface" onclick={copyLink}>Copy</button>
				<button class="btn preset-tonal-surface" onclick={shareLink}>Share</button>
				<button class="btn preset-tonal-surface" onclick={editLink}>Edit</button>
			</div>
		</div>
	</div>
{/if}