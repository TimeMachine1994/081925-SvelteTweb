<script lang="ts">
    import type { PageData } from './$types';

    export let data: PageData;

    const { memorial } = data;
</script>

<div class="tribute-page">
    <header>
        <h1>In Loving Memory of {memorial.lovedOneName}</h1>
        {#if memorial.birthDate && memorial.deathDate}
            <p>{new Date(memorial.birthDate).toLocaleDateString()} - {new Date(memorial.deathDate).toLocaleDateString()}</p>
        {/if}
    </header>

    <main>
        {#if memorial.imageUrl}
            <img src={memorial.imageUrl} alt={memorial.lovedOneName} class="tribute-image" />
        {/if}

        <section class="content">
            {@html memorial.content}
        </section>
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
</style>