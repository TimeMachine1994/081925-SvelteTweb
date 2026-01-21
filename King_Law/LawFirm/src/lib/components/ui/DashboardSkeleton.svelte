<script lang="ts">
	import Skeleton from './Skeleton.svelte';
</script>

<div class="space-y-8">
	<!-- Header Skeleton -->
	<div class="flex justify-between items-center">
		<Skeleton class="h-10 w-64" />
		<Skeleton class="h-12 w-32" />
	</div>

	<!-- Stats Cards Skeleton -->
	<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
		{#each Array(5) as _}
			<div class="bg-background border border-border rounded-lg p-4 shadow-sm">
				<Skeleton class="h-8 w-16 mb-2" />
				<Skeleton class="h-4 w-24" variant="text" />
			</div>
		{/each}
	</div>

	<!-- Cases Section Skeleton -->
	<div>
		<div class="flex justify-between items-center mb-4">
			<Skeleton class="h-8 w-24" />
			<div class="flex gap-3">
				<Skeleton class="h-10 w-64" />
				<Skeleton class="h-10 w-32" />
			</div>
		</div>

		<!-- Cases Grid Skeleton -->
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="bg-background border border-border rounded-lg p-4 shadow-sm">
					<div class="flex justify-between items-start mb-3">
						<Skeleton class="h-5 w-40" />
						<Skeleton class="h-6 w-16 rounded-full" />
					</div>
					<Skeleton class="h-4 w-32 mb-1" variant="text" />
					<Skeleton class="h-3 w-48 mb-3" variant="text" />
					<Skeleton class="h-3 w-24" variant="text" />
				</div>
			{/each}
		</div>
	</div>
</div>
