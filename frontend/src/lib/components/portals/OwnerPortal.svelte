<!-- TODO: Remove Tailwind CSS classes and replace with styles from tribute-theme.css -->
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

<h2 class="TODO: replace-with-theme-class">Memorials You Own</h2>
{#if memorials && memorials.length > 0}
    <div class="TODO: replace-with-theme-class">
        {#each memorials as memorial}
            <div class="TODO: replace-with-theme-class">
                <h2 class="TODO: replace-with-theme-class">{memorial.lovedOneName}</h2>
                <a href="/tributes/{memorial.slug}" class="TODO: replace-with-theme-class">View Memorial</a>
                <a href="/my-portal/tributes/{memorial.id}/edit" class="TODO: replace-with-theme-class">Edit / Manage Photos</a>
                {#if memorial.livestream}
                    <a href="/my-portal/tributes/{memorial.id}/edit" class="TODO: replace-with-theme-class">View Livestream Details</a>
                {:else}
                    <a href="/app/calculator?memorialId={memorial.id}&lovedOneName={encodeURIComponent(memorial.lovedOneName)}" class="TODO: replace-with-theme-class">Schedule Livestream</a>
                {/if}

                <!-- Invitation Section -->
                <div class="TODO: replace-with-theme-class">
                    <h3 class="TODO: replace-with-theme-class">Invite Family</h3>
                    <div class="TODO: replace-with-theme-class">
                        <input type="email" placeholder="family@example.com" bind:value={inviteEmails[memorial.id]} class="TODO: replace-with-theme-class" />
                        <button onclick={() => handleInvite(memorial.id)} class="TODO: replace-with-theme-class">Invite</button>
                    </div>
                    <!-- Display Invitations -->
                    <div class="TODO: replace-with-theme-class">
                        {#each getInvitationsForMemorial(memorial.id) as invitation}
                            <div class="TODO: replace-with-theme-class">
                                <span>{invitation.inviteeEmail}</span>
                                <span class="TODO: replace-with-theme-class">{invitation.status}</span>
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
<a href="/my-portal/tributes/new" class="TODO: replace-with-theme-class">Create a New Memorial</a>