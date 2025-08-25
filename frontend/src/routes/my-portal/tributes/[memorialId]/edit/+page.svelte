<script lang="ts">
	import { onMount } from 'svelte';
	import PhotoUploader from '$lib/components/PhotoUploader.svelte';
	import PhotoGallery from '$lib/components/PhotoGallery.svelte';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	const { memorial } = data;

	onMount(() => {
		console.log('🖼️ Photo editor page mounted for memorial:', memorial.id);
		console.log('Memorial data:', memorial);
	});
</script>

<div class="editor-container">
	<h2>Edit Tribute for {memorial.lovedOneName}</h2>

	<PhotoUploader memorialId={memorial.id} />

	<div class="livestream-section">
		{#if memorial.livestream}
			<h3>Livestream Details</h3>
			<p><strong>Name:</strong> {memorial.livestream.name}</p>
			<p><strong>RTMP URL:</strong> {memorial.livestream.rtmpsUrl}</p>
			<p><strong>Stream Key:</strong> {memorial.livestream.streamKey}</p>
		{/if}
	</div>

	<PhotoGallery photos={memorial.photos || []} />
</div>
