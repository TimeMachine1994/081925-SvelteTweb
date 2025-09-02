<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';

	let { memorial }: { memorial: Memorial } = $props();

	const config = memorial.livestreamConfig;
	const bookingItems = config?.bookingItems || [];
</script>

<div class="bg-white shadow-lg rounded-lg p-6 mb-8">
	<h3 class="text-xl font-semibold text-gray-900 mb-2">Welcome Back!</h3>
	<p class="text-gray-600 mb-4">
		You're one step closer to preserving the memory of <span class="font-semibold">{memorial.lovedOneName}</span>.
		You can continue where you left off or start a new configuration.
	</p>

	{#if config}
		<div class="border-t border-b py-4 my-4">
			<h4 class="font-semibold mb-2">Your Current Selections:</h4>
			<ul class="list-disc list-inside text-gray-700">
				{#each bookingItems as item}
					<li>{item.name}</li>
				{/each}
			</ul>
			<p class="font-semibold mt-2">Total: <span class="text-green-600">${config.total.toFixed(2)}</span></p>
		</div>
	{/if}

	<div class="flex justify-end">
		<a href={`/app/calculator?memorialId=${memorial.id}`} class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D5BA7F]">
			Continue Booking
		</a>
	</div>
</div>