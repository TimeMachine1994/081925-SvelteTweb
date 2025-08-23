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

	<form method="POST">
		<textarea name="content" rows="20">{memorial.content || ''}</textarea>

		{#if form?.missing}
			<p class="error">Content cannot be empty.</p>
		{/if}

		<button type="submit">Save Changes</button>
	</form>

	<PhotoUploader memorialId={memorial.id} />

	<div class="livestream-section">
		{#if memorial.livestream}
			<h3>Livestream Details</h3>
			<p><strong>Name:</strong> {memorial.livestream.name}</p>
			<p><strong>RTMP URL:</strong> {memorial.livestream.rtmpsUrl}</p>
			<p><strong>Stream Key:</strong> {memorial.livestream.streamKey}</p>
		{:else}
			<a href="/my-portal/tributes/{memorial.id}/livestream/new" class="btn-secondary">Create Livestream</a>
		{/if}
	</div>

	<PhotoGallery photos={memorial.photos || []} />
</div>

<style>
	   .livestream-section {
	       margin: 2rem 0;
	       padding: 1rem;
	       border: 1px solid #eee;
	       border-radius: 8px;
	   }

	   .btn-secondary {
	       display: inline-block;
	       padding: 0.75rem 1.5rem;
	       font-size: 1rem;
	       background-color: #6c757d;
	       color: white;
	       border: none;
	       border-radius: 4px;
	       cursor: pointer;
	       text-align: center;
	       text-decoration: none;
	   }
	   .editor-container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 2rem;
        border: 1px solid #ccc;
        border-radius: 8px;
    }

    h2 {
        text-align: center;
        margin-bottom: 2rem;
    }

    textarea {
        width: 100%;
        padding: 0.5rem;
        font-size: 1rem;
        border-radius: 4px;
        border: 1px solid #ccc;
        margin-bottom: 1rem;
    }

    button {
        display: block;
        width: 100%;
        padding: 0.75rem;
        font-size: 1rem;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .error {
        color: red;
        margin-bottom: 1rem;
    }
</style>