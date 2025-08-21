<script lang="ts">
    import type { PageData, ActionData } from './$types';

    export let data: PageData;
    export let form: ActionData;

    const { memorial } = data;
</script>

<div class="editor-container">
    <h2>Edit Tribute for {memorial.name}</h2>

    <form method="POST">
        <textarea name="content" rows="20">{memorial.content || ''}</textarea>

        {#if form?.missing}
            <p class="error">Content cannot be empty.</p>
        {/if}

        <button type="submit">Save Changes</button>
    </form>
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