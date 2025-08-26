<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';

	let { memorial }: { memorial: Memorial } = $props();

	console.log('📅 LivestreamScheduleTable rendering for memorial:', memorial.id);

	type ScheduleItem = {
		startTime: string;
		type: string;
		duration: string;
		location: string;
	};

	// Mock schedule data based on livestream config
	const scheduleItems = $derived((): ScheduleItem[] => {
		if (!memorial.livestreamConfig?.formData) {
			return [];
		}

		const formData = memorial.livestreamConfig.formData;
		const items: ScheduleItem[] = [];

		// Main service
		if (formData.mainService) {
			items.push({
				startTime: formData.mainService.time.time || 'TBD',
				type: 'Main Service',
				duration: `${formData.mainService.hours} Hour${formData.mainService.hours !== 1 ? 's' : ''}`,
				location: formData.mainService.location.name || 'TBD'
			});
		}

		// Additional location
		if (formData.additionalLocation?.enabled) {
			items.push({
				startTime: formData.additionalLocation.startTime || 'TBD',
				type: 'Additional Service',
				duration: `${formData.additionalLocation.hours} Hour${formData.additionalLocation.hours !== 1 ? 's' : ''}`,
				location: formData.additionalLocation.location.name || 'TBD'
			});
		}

		return items;
	});

	function handleEdit() {
		console.log('✏️ Edit schedule clicked for memorial:', memorial.id);
		window.location.href = `/app/calculator?memorialId=${memorial.id}&lovedOneName=${encodeURIComponent(memorial.lovedOneName)}`;
	}
</script>

<div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
	<div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
		<h3 class="text-lg font-medium text-gray-900">Current Livestream Schedule</h3>
		<button
			onclick={handleEdit}
			class="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
		>
			Edit
		</button>
	</div>

	{#if scheduleItems().length > 0}
		{@const items = scheduleItems()}
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Start Time
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Stream Type
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Est. Duration
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Location
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each items as item}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								{item.startTime}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								{item.type}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								{item.duration}
							</td>
							<td class="px-6 py-4 text-sm text-gray-900">
								<div class="max-w-xs">
									{item.location}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="px-6 py-8 text-center">
			<div class="text-gray-400 text-4xl mb-2">📅</div>
			<p class="text-gray-500 text-sm">No livestream schedule configured yet.</p>
			<button 
				onclick={handleEdit}
				class="mt-3 text-purple-600 hover:text-purple-700 text-sm font-medium"
			>
				Configure Schedule
			</button>
		</div>
	{/if}
</div>