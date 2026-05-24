<script lang="ts">
	import { onMount } from 'svelte';

	export let photos: string[] = [];

	onMount(() => {
		console.log('🏞️ PhotoGallery component mounted.');
		console.log(`Displaying ${photos.length} photos.`);
	});
</script>

<div class="gallery-container">
	<h3>Photo Gallery</h3>
	{#if photos && photos.length > 0}
		<div class="photo-grid">
			{#each photos as photo}
				<div class="photo-item">
					<img src={photo} alt="Tribute gallery" />
				</div>
			{/each}
		</div>
	{:else}
		<p>No photos have been uploaded yet.</p>
	{/if}
</div>

<style>
	.gallery-container {
		margin-top: 2rem;
	}
	.photo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}
	.photo-item img {
		width: 100%;
		height: auto;
		border-radius: 8px;
		object-fit: cover;
	}
</style>