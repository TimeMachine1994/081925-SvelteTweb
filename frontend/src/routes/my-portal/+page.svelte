<script lang="ts">
    export let data: {
        memorial: {
            id: string;
            name: string;
            birthDate: string;
            deathDate: string;
        } | null;
        user: {
            uid: string;
            email: string | null | undefined;
        };
    };
</script>

<div class="container mx-auto p-8">
    <h1 class="text-2xl font-bold mb-4">My Portal</h1>

    {#if data.memorial}
        <div class="card">
            <h2 class="text-xl font-semibold">{data.memorial.name}</h2>
            <p><strong>Born:</strong> {new Date(data.memorial.birthDate).toLocaleDateString()}</p>
            <p><strong>Died:</strong> {new Date(data.memorial.deathDate).toLocaleDateString()}</p>
            <a href="/memorials/{data.memorial.id}" class="btn btn-primary mt-4">View Memorial</a>
        </div>
    {:else}
        <p>You have not created any memorials yet.</p>
        <a href="/memorials/new" class="btn btn-primary mt-4">Create a Memorial</a>
    {/if}
</div>