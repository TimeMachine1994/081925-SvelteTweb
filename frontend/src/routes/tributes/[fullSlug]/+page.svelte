<script lang="ts">
	import PhotoGallery from '$lib/components/PhotoGallery.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	const { memorial } = data;
</script>

<div class="tribute-page">
	<header>
		<h1>In Loving Memory of {memorial.lovedOneName}</h1>
		{#if memorial.birthDate && memorial.deathDate}
			<p>
				{new Date(memorial.birthDate).toLocaleDateString()} - {new Date(
					memorial.deathDate
				).toLocaleDateString()}
			</p>
		{/if}
	</header>

	<main>
		{#if memorial.imageUrl}
			<img src={memorial.imageUrl} alt={memorial.lovedOneName} class="tribute-image" />
		{/if}

		{#if memorial.livestream?.uid}
			<div class="livestream-player">
				<iframe
					src="https://customer-j17w42139d580s8b.cloudflarestream.com/{memorial.livestream.uid}/iframe"
					style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"
					allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
					allowfullscreen={true}
				></iframe>
			</div>
		{/if}

		<section class="content">
			{@html memorial.content}
		</section>

		<PhotoGallery photos={memorial.photos || []} />
	</main>
</div>

<style>
    .tribute-page {
        font-family: sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
    }

    header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .tribute-image {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 0 auto 2rem;
    }

    .content {
        line-height: 1.6;
    }
    .livestream-player {
        position: relative;
        padding-top: 56.25%; /* 16:9 aspect ratio */
        margin-bottom: 2rem;
    }
</style>