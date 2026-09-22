<script lang="ts">
	import AdminChatPanel from '$lib/components/admin/AdminChatPanel.svelte';
	import { SectionHeader } from '$lib/components/admin/ui';

	let { data } = $props();
	const { memorial } = data;
</script>

<SectionHeader title="Chat Moderation" icon="chat" />
<p class="mb-4 -mt-2 text-sm text-slate-500">
	Chat is one thread per memorial (not per stream) — this is the same conversation visitors see
	on the public memorial page.
</p>

<AdminChatPanel memorialId={memorial.id} />
