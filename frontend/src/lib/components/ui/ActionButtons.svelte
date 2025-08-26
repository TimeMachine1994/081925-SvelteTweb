<script lang="ts">
	import ActionButton from './ActionButton.svelte';
	import type { Memorial } from '$lib/types/memorial';

	let { memorial }: { memorial: Memorial } = $props();

	console.log('🎯 ActionButtons rendering for memorial:', memorial.id);

	function handleTransferContact() {
		console.log('📞 Transfer contact clicked for memorial:', memorial.id);
		// TODO: Implement transfer contact modal/flow
		alert('Transfer contact feature coming soon!');
	}

	function handleInviteOthers() {
		console.log('✈️ Invite others clicked for memorial:', memorial.id);
		// TODO: Implement invite others modal/flow
		alert('Invite others feature coming soon!');
	}
</script>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
	<ActionButton
		icon="upload"
		label="Upload Photos"
		color="blue"
		href="/my-portal/tributes/{memorial.id}/edit"
	/>

	<ActionButton
		icon="calendar"
		label="Edit Livestream Schedule"
		color="amber"
		href={`/app/calculator?memorialId=${memorial.id}&lovedOneName=${encodeURIComponent(memorial.lovedOneName)}`}
	/>

	<ActionButton
		icon="phone"
		label="Manage Invitations"
		color="violet"
		href="/my-portal/tributes/{memorial.id}/invite"
	/>

	<ActionButton
		icon="share"
		label="Invite Others to Share Media"
		color="cyan"
		href="/my-portal/tributes/{memorial.id}/invite"
	/>
</div>