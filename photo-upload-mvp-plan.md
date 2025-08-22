# Photo Upload and Gallery MVP Implementation Plan

This document outlines the steps to implement a photo upload and gallery feature for memorials in the `my-portal` section of the application.

## 1. Update Firebase Storage Rules

The first step is to update the Firebase Storage security rules to allow authenticated users to upload files to a personal bucket associated with a memorial they have created. The photos should be publicly readable.

**File:** `frontend/storage.rules`

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Memorial photos: only the memorial creator can upload photos.
    // Photos are publically readable.
    match /memorials/{memorialId}/{allPaths=**} {
      allow read;
      allow write: if request.auth != null && 
                    firestore.get(/databases/(default)/documents/memorials/$(memorialId)).data.creatorUid == request.auth.uid;
    }
  }
}
```

## 2. Integrate Photo Gallery into the Memorial Edit Page

Next, integrate the `PhotoGallery` component into the memorial edit page to display the uploaded photos. This will allow users to see the photos they've uploaded for a specific memorial.

**File:** `frontend/src/routes/my-portal/tributes/[memorialId]/edit/+page.svelte`

```svelte
<script lang="ts">
	import PhotoUploader from '$lib/components/PhotoUploader.svelte';
	import PhotoGallery from '$lib/components/PhotoGallery.svelte';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	const { memorial } = data;
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
	<PhotoGallery photos={memorial.photos || []} />
</div>

<style>
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
```

## 3. Add "Manage Photos" Link to the Main Portal Page

Finally, add a link to the memorial edit page from the main portal page. This will allow users to easily navigate to the photo management page for each memorial.

**File:** `frontend/src/routes/my-portal/+page.svelte`

```svelte
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
					<a href="/my-portal/tributes/{memorial.id}/edit" class="btn btn-secondary mt-2">Edit / Manage Photos</a>
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