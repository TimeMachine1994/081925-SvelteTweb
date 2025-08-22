<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	export let memorialId: string;

	let uploading = false;
	let uploadError: string | null = null;
	let uploadSuccess: string | null = null;
</script>

<div class="uploader-container">
	<h3>Upload Photos</h3>
	<form
		id="upload-form"
		method="POST"
		enctype="multipart/form-data"
		action="/my-portal/tributes/{memorialId}/upload"
		use:enhance={({ formElement }) => {
			console.log('🚀 PhotoUploader form enhancement applied.');
			uploading = true;
			uploadError = null;
			uploadSuccess = null;

			return async ({ result, update }) => {
				console.log('📬 Upload submission result received:', result);
				if (result.type === 'success') {
					console.log('✅ Upload successful! Invalidating data to refresh gallery.');
					uploadSuccess = 'Photo uploaded successfully!';
					formElement.reset();
					await invalidateAll(); // This will re-run the page's load function
				} else if (result.type === 'error') {
					console.error('🔥 Upload failed:', result.error);
					const errorBody = result.error.body as { error?: string };
					uploadError = errorBody?.error || 'An unknown error occurred.';
				}
				uploading = false;
			};
		}}
	>
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