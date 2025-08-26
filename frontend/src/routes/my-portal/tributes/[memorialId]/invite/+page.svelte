<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let inviteEmail = $state('');

	async function handleInvite() {
		if (!inviteEmail) {
			alert('Please enter an email address.');
			return;
		}

		const response = await fetch(`/api/memorials/${data.memorial.id}/invite`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				inviteeEmail: inviteEmail,
				roleToAssign: 'family_member'
			})
		});

		if (response.ok) {
			alert('Invitation sent successfully!');
			inviteEmail = '';
			await invalidateAll();
		} else {
			const errorData = await response.json();
			alert(`Failed to send invitation: ${errorData.error}`);
		}
	}

	async function handleRemove(invitationId: string) {
		if (confirm('Are you sure you want to remove this invitation?')) {
			const response = await fetch(`/api/memorials/${data.memorial.id}/invite/${invitationId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				alert('Invitation removed successfully!');
				await invalidateAll();
			} else {
				const errorData = await response.json();
				alert(`Failed to remove invitation: ${errorData.error}`);
			}
		}
	}

	async function handleTransfer(invitationId: string) {
		if (confirm('Are you sure you want to make this person the family point of contact?')) {
			const response = await fetch(`/api/memorials/${data.memorial.id}/invite/${invitationId}`, {
				method: 'POST'
			});

			if (response.ok) {
				alert('Family point of contact updated successfully!');
				await invalidateAll();
			} else {
				const errorData = await response.json();
				alert(`Failed to update point of contact: ${errorData.error}`);
			}
		}
	}
</script>

<div class="max-w-4xl mx-auto px-4 py-6">
	<h1 class="text-2xl font-bold text-gray-900 mb-2">Manage Invitations</h1>
	<p class="text-gray-600 mb-6">for {data.memorial.lovedOneName}</p>

	<div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
		<h2 class="text-lg font-medium text-gray-900 mb-4">Invite family members to upload photos</h2>
		<div class="flex gap-3">
			<input
				type="email"
				placeholder="family@example.com"
				bind:value={inviteEmail}
				class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
			/>
			<button
				onclick={handleInvite}
				class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
			>
				Send Invite
			</button>
		</div>
	</div>

	<div class="bg-white rounded-lg border border-gray-200">
		<h2 class="text-lg font-medium text-gray-900 p-6 border-b border-gray-200">
			Sent Invitations
		</h2>
		<div class="divide-y divide-gray-200">
			{#each data.invitations as invitation}
				<div class="p-6 flex justify-between items-center">
					<div>
						<p class="font-medium text-gray-900">{invitation.inviteeEmail}</p>
						<p class="text-sm text-gray-600">Status: {invitation.status}</p>
					</div>
					<div class="flex gap-3">
						<button
							onclick={() => handleTransfer(invitation.id)}
							class="text-sm text-blue-600 hover:text-blue-800"
						>
							Make Point of Contact
						</button>
						<button
							onclick={() => handleRemove(invitation.id)}
							class="text-sm text-red-600 hover:text-red-800"
						>
							Remove
						</button>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>