<script lang="ts">
	let { currentStepIndex } = $props<{ currentStepIndex: number }>();

	const steps = ['Package', 'Details', 'Add-ons', 'Payment'];
	const totalSteps = steps.length;
	const progressPercentage = $derived((currentStepIndex + 1) / totalSteps * 100);
</script>

<div class="card p-4 md:p-6 mb-8">
	<div class="flex justify-between items-center mb-4">
		{#each steps as step, index}
			<div class="flex items-center {index < steps.length - 1 ? 'flex-1' : ''}">
				<div
					class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-200
					{index <= currentStepIndex 
						? 'bg-primary-500 text-white' 
						: 'bg-surface-300 text-surface-600'}"
				>
					{index + 1}
				</div>
				<span class="ml-2 text-sm font-medium {index <= currentStepIndex ? 'text-primary-500' : 'text-surface-600'}">{step}</span>
				{#if index < steps.length - 1}
					<div class="flex-1 h-0.5 mx-4 {index < currentStepIndex ? 'bg-primary-500' : 'bg-surface-300'}"></div>
				{/if}
			</div>
		{/each}
	</div>
	<div class="w-full bg-surface-300 rounded-full h-2">
		<div 
			class="bg-primary-500 h-2 rounded-full transition-all duration-300 ease-out" 
			style="width: {progressPercentage}%"
		></div>
	</div>
	<p class="text-sm text-surface-600 mt-2 text-center">
		Step {currentStepIndex + 1} of {totalSteps}: {steps[currentStepIndex]}
	</p>
</div>
