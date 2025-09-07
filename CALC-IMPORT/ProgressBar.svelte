<script lang="ts">
	let { currentStepIndex = 0 } = $props<{ currentStepIndex: number }>();

	const steps = ['Select Tier', 'Service Details', 'Add-ons', 'Payment'];
</script>

<ol class="flex items-center w-full text-sm font-medium text-center text-surface-500 dark:text-surface-400 sm:text-base mb-8">
	{#each steps as step, i}
		<li
			class="flex md:w-full items-center {i <= currentStepIndex
				? 'text-primary-500 dark:text-primary-400'
				: ''} {i < steps.length - 1 ? "sm:after:content-[''] after:w-full after:h-1 after:border-b after:border-surface-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-surface-700" : ''}"
		>
			<span
				class="flex items-center {i < steps.length - 1 ? 'sm:after:content-[\'/\']' : ''} sm:after:hidden after:mx-2 after:text-surface-200 dark:after:text-surface-500"
			>
				{#if i < currentStepIndex}
					<svg
						class="w-3.5 h-3.5 sm:w-4 sm:h-4 me-2.5"
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"
						/>
					</svg>
				{:else}
					<span class="me-2">{i + 1}</span>
				{/if}
				{step}
			</span>
		</li>
	{/each}
</ol>