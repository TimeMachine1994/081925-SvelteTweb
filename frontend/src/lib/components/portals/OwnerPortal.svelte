<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';
	import type { Invitation } from '$lib/types/invitation';
	import { getPaymentStatus, getDefaultMemorial } from '$lib/utils/payment';
	
	// Import new UI components
	import PaymentWarningBanner from '$lib/components/ui/PaymentWarningBanner.svelte';
	import MemorialSelector from '$lib/components/ui/MemorialSelector.svelte';
	import MemorialCard from '$lib/components/ui/MemorialCard.svelte';
	import ActionButtons from '$lib/components/ui/ActionButtons.svelte';
	import LivestreamScheduleTable from '$lib/components/ui/LivestreamScheduleTable.svelte';
	import PayNowButton from '$lib/components/ui/PayNowButton.svelte';

	let { memorials, invitations }: { memorials: Memorial[], invitations: Invitation[] } = $props();

	console.log('👑 OwnerPortal rendering with', memorials.length, 'memorials');

	// State for selected memorial
	let selectedMemorialId = $state('');
	
	// Initialize with default memorial
	$effect(() => {
		if (memorials.length > 0 && !selectedMemorialId) {
			const defaultMemorial = getDefaultMemorial(memorials);
			if (defaultMemorial) {
				selectedMemorialId = defaultMemorial.id;
				console.log('🎯 Default memorial selected:', defaultMemorial.lovedOneName);
			}
		}
	});

	// Get currently selected memorial
	const selectedMemorial = $derived(() => {
		return memorials.find(m => m.id === selectedMemorialId) || null;
	});

	// Get payment status for selected memorial
	const paymentStatus = $derived(() => {
		const memorial = selectedMemorial();
		return memorial ? getPaymentStatus(memorial) : 'none';
	});

	// Handle memorial selection change
	function handleMemorialChange(memorialId: string) {
		console.log('🔄 Memorial selection changed to:', memorialId);
		selectedMemorialId = memorialId;
	}

	// Legacy invitation functionality (keeping for backward compatibility)
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

<div class="max-w-6xl mx-auto px-4 py-6">
	<h2 class="text-2xl font-bold text-gray-900 mb-6">Memorials You Own</h2>
	
	{#if memorials && memorials.length > 0}
		{@const currentMemorial = selectedMemorial()}
		{@const currentPaymentStatus = paymentStatus()}
		
		{#if currentMemorial}
			<!-- Payment Warning Banner (only show if payment incomplete) -->
			{#if currentPaymentStatus === 'incomplete'}
				<PaymentWarningBanner memorial={currentMemorial} />
			{/if}

			<!-- Memorial Selector (only show if multiple memorials) -->
			<MemorialSelector 
				{memorials} 
				{selectedMemorialId}
				onSelectionChange={handleMemorialChange}
			/>

			<!-- Memorial Card -->
			<MemorialCard memorial={currentMemorial} />

			<!-- Action Buttons -->
			<ActionButtons memorial={currentMemorial} />

			<!-- Livestream Schedule Table -->
			<LivestreamScheduleTable memorial={currentMemorial} />

			<!-- Legacy Invitation Section (keeping for now) -->
			<div class="mt-8 bg-white rounded-lg border border-gray-200 p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Invite Family Members</h3>
				<div class="flex gap-3 mb-4">
					<input 
						type="email" 
						placeholder="family@example.com" 
						bind:value={inviteEmails[currentMemorial.id]}
						class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
					/>
					<button 
						onclick={() => handleInvite(currentMemorial.id)}
						class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
					>
						Invite
					</button>
				</div>
				
				<!-- Display Invitations -->
				{#if getInvitationsForMemorial(currentMemorial.id).length > 0}
					<div class="space-y-2">
						<h4 class="text-sm font-medium text-gray-700">Pending Invitations:</h4>
						{#each getInvitationsForMemorial(currentMemorial.id) as invitation}
							<div class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
								<span class="text-sm text-gray-900">{invitation.inviteeEmail}</span>
								<span class="text-xs px-2 py-1 rounded-full {invitation.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
									{invitation.status}
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Bottom Pay Now Button (only show if payment incomplete) -->
			{#if currentPaymentStatus === 'incomplete'}
				<div class="mt-6 flex justify-center">
					<PayNowButton memorial={currentMemorial} variant="primary" />
				</div>
			{/if}
		{/if}
	{:else}
		<!-- No memorials state -->
		<div class="text-center py-12">
			<div class="text-gray-400 text-6xl mb-4">🏛️</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No Memorials Yet</h3>
			<p class="text-gray-600 mb-6">You haven't created any memorials yet. Get started by creating your first memorial.</p>
			<a 
				href="/my-portal/tributes/new"
				class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
			>
				Create Your First Memorial
			</a>
		</div>
	{/if}

	<!-- Logout Button -->
	<div class="mt-12 text-center">
		<form method="POST" action="/logout">
			<button type="submit" class="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors">
				Log Out
			</button>
		</form>
	</div>
</div>