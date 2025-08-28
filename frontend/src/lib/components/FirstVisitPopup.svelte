<script lang="ts">
    import { page } from '$app/stores';
    import { invalidateAll } from '$app/navigation';
    import { onMount } from 'svelte';
    import { slide } from 'svelte/transition'; // Import slide transition

    console.log('✨ FirstVisitPopup component initialized!');

    let showPopup = $state(false); // Initially hide the popup

    async function markVisitComplete() {
        console.log('🚀 Marking first visit complete...');
        try {
            const response = await fetch('/api/user/mark-memorial-visit-complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                console.log('✅ First visit marked as complete on server.');
                showPopup = false;
                // Invalidate all data to ensure the layout's load function re-runs and hides the popup
                await invalidateAll();
                console.log('🔄 SvelteKit data invalidated.');
            } else {
                console.error('❌ Failed to mark first visit complete:', response.statusText);
            }
        } catch (error) {
            console.error('❌ Error calling mark-memorial-visit-complete API:', error);
        }
    }

    onMount(() => {
        console.log('⏳ FirstVisitPopup mounted, setting initial delay timer...');
        // Delay appearance by 5 seconds
        const initialDelayTimer = setTimeout(() => {
            console.log('⏰ Initial delay complete, showing popup. It will remain visible until dismissed.');
            showPopup = true;
        }, 5000); // Appear after 5 seconds

        return () => {
            console.log('🧹 Clearing initial delay timer.');
            clearTimeout(initialDelayTimer);
        };
    });
</script>

{#if showPopup}
    <div class="first-visit-popup" transition:slide>
        <p>🎉 Welcome! This is your first visit to a memorial page. Explore and connect!</p>
        <button onclick={markVisitComplete} aria-label="Dismiss welcome message">
            &times;
        </button>
    </div>
{/if}

<style>
    .first-visit-popup {
        background-color: var(--color-primary-500);
        color: var(--color-text-on-primary);
        padding: 1rem 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        font-size: 0.95rem;
        font-weight: 600;
        position: sticky;
        top: 0;
        z-index: 40;
        width: 100%;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    .first-visit-popup p {
        margin: 0;
        flex-grow: 1;
        text-align: center;
    }

    .first-visit-popup button {
        background: none;
        border: none;
        color: var(--color-text-on-primary);
        font-size: 1.5rem;
        cursor: pointer;
        line-height: 1;
        padding: 0;
        margin-left: auto; /* Push button to the right */
    }

    .first-visit-popup button:hover {
        opacity: 0.8;
    }
</style>