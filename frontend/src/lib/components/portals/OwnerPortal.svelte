<script lang="ts">
    import type { Memorial } from '$lib/types/memorial';
    import type { Invitation } from '$lib/types/invitation';

    let { memorials, invitations }: { memorials: Memorial[], invitations: Invitation[] } = $props();
    let inviteEmails = $state<{ [key: string]: string }>({});

    function getInvitationsForMemorial(memorialId: string) {
        return invitations.filter(inv => inv.memorialId === memorialId);
    }

    async function handleInvite(memorialId: string) {
        const email = inviteEmails[memorialId];
        if (!email) {
            alert('Please enter an email address.');
            return;
        }

        console.log(`📨 Inviting ${email} to memorial ${memorialId}`);

        const response = await fetch(`/api/memorials/${memorialId}/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                inviteeEmail: email,
                roleToAssign: 'family_member'
            })
        });

        if (response.ok) {
            alert('Invitation sent successfully!');
            inviteEmails[memorialId] = ''; // Clear the input
        } else {
            const errorData = await response.json();
            alert(`Failed to send invitation: ${errorData.error}`);
        }
    }
</script>

<h2 class="text-xl font-semibold mb-4">Memorials You Own</h2>
{#if memorials && memorials.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each memorials as memorial}
            <div class="card">
                <h2 class="text-xl font-semibold">{memorial.lovedOneName}</h2>
                <a href="/tributes/{memorial.slug}" class="btn btn-primary mt-4">View Memorial</a>
                <a href="/my-portal/tributes/{memorial.id}/edit" class="btn btn-secondary mt-2">Edit / Manage Photos</a>
                {#if memorial.livestream}
                    <a href="/my-portal/tributes/{memorial.id}/edit" class="btn btn-secondary mt-2">View Livestream Details</a>
                {:else}
                    <a href="/app/calculator?memorialId={memorial.id}&lovedOneName={encodeURIComponent(memorial.lovedOneName)}" class="btn btn-accent mt-2">Schedule Livestream</a>
                {/if}

                <!-- Invitation Section -->
                <div class="mt-4 pt-4 border-t">
                    <h3 class="text-lg font-semibold">Invite Family</h3>
                    <div class="flex mt-2">
                        <input type="email" placeholder="family@example.com" bind:value={inviteEmails[memorial.id]} class="input input-bordered w-full max-w-xs" />
                        <button onclick={() => handleInvite(memorial.id)} class="btn btn-primary ml-2">Invite</button>
                    </div>
                    <!-- Display Invitations -->
                    <div class="mt-4 text-sm">
                        {#each getInvitationsForMemorial(memorial.id) as invitation}
                            <div class="flex justify-between items-center">
                                <span>{invitation.inviteeEmail}</span>
                                <span class="badge badge-sm {invitation.status === 'pending' ? 'badge-warning' : 'badge-success'}">{invitation.status}</span>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/each}
    </div>
{:else}
    <p>You have not created any memorials yet.</p>
{/if}
<a href="/my-portal/tributes/new" class="btn btn-primary mt-4">Create a New Memorial</a>