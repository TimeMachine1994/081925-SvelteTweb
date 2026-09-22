<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import CustomPricingEditor from '$lib/components/admin/CustomPricingEditor.svelte';
	import AdminScheduleEditor from '$lib/components/admin/AdminScheduleEditor.svelte';
	import ScheduleRequestsPanel from '$lib/components/admin/ScheduleRequestsPanel.svelte';

	let { data } = $props();
	const { memorial, scheduleRequests } = data;

	async function handlePricingUpdate() {
		await invalidateAll();
	}
</script>

<ScheduleRequestsPanel requests={scheduleRequests} />

<AdminScheduleEditor {memorial} onUpdate={handlePricingUpdate} />

<CustomPricingEditor {memorial} onUpdate={handlePricingUpdate} />
