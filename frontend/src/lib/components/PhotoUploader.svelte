<script lang="ts">
	import { enhance } from '$app/forms';

	export let memorialId: string;

	let uploading = false;
	let uploadError: string | null = null;
	let uploadSuccess: string | null = null;

	async function handleUpload() {
		console.log('📸 Photo upload initiated for memorial:', memorialId);
		uploading = true;
		uploadError = null;
		uploadSuccess = null;

		const form = document.querySelector('#upload-form') as HTMLFormElement;
		const formData = new FormData(form);

		try {
			const response = await fetch(`/my-portal/tributes/${memorialId}/upload`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				console.log('✅ Photo uploaded successfully!');
				uploadSuccess = 'Photo uploaded successfully!';
				form.reset();
			} else {
				const result = await response.json();
				console.error('🔥 Photo upload failed:', result.error);
				uploadError = result.error || 'An unknown error occurred.';
			}
		} catch (error) {
			console.error('🔥 An unexpected error occurred during upload:', error);
			uploadError = 'An unexpected error occurred.';
		} finally {
			uploading = false;
		}
	}
</script>

<div class="uploader-container">
	<h3>Upload Photos</h3>
	<form id="upload-form" method="POST" enctype="multipart/form-data" use:enhance on:submit|preventDefault={handleUpload}>
		<input type="file" name="photo" accept="image/*" required />
		<button type="submit" disabled={uploading}>
			{#if uploading}
				Uploading...
			{:else}
				Upload Photo
			{/if}
		</button>
	</form>
	{#if uploadSuccess}
		<p class="success">{uploadSuccess}</p>
	{/if}
	{#if uploadError}
		<p class="error">{uploadError}</p>
	{/if}
</div>

<style>
	.uploader-container {
		margin-top: 2rem;
		padding: 1.5rem;
		border: 1px solid #eee;
		border-radius: 8px;
	}
	.success {
		color: green;
	}
	.error {
		color: red;
	}
</style>