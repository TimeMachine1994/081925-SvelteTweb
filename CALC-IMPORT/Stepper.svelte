<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { cn } from '$lib/utils/calculator';

	let { step }: { step: number } = $props();

	const steps = ['Select Tier', 'Service Details', 'Add‑ons', 'Payment'];

	const styleProps = steps.map(() => ({
		backgroundColor: tweened('transparent', { duration: 400, easing: cubicOut }),
		borderColor: tweened('#e5e7eb', { duration: 400, easing: cubicOut }),
		scale: tweened(1, { duration: 400, easing: cubicOut })
	}));

	let styles = $state(steps.map(() => ({
		backgroundColor: 'transparent',
		borderColor: '#e5e7eb',
		transform: 'scale(1)'
	})));

	// This effect handles subscriptions and cleanup
	$effect(() => {
		const unsubscribers = styleProps.flatMap((props, i) => [
			props.backgroundColor.subscribe(value => {
				styles[i].backgroundColor = value;
			}),
			props.borderColor.subscribe(value => {
				styles[i].borderColor = value;
			}),
			props.scale.subscribe(value => {
				styles[i].transform = `scale(${value})`;
			})
		]);

		return () => {
			unsubscribers.forEach(unsub => unsub());
		};
	});

	// This effect reacts to `step` changes and updates the tweens
	$effect(() => {
		styleProps.forEach((props, i) => {
			const index = i + 1;
			const isDone = step > index;
			const isCurrent = step === index;

			props.backgroundColor.set(isDone || isCurrent ? '#D5BA7F' : 'transparent');
			props.borderColor.set(isDone || isCurrent ? '#D5BA7F' : '#e5e7eb');
			props.scale.set(isCurrent ? 1.05 : 1);
		});
	});
</script>

<div class="w-full mb-6">
	<ol class="grid grid-cols-4 gap-4 items-center">
		{#each steps as label, i}
			{@const index = i + 1}
			{@const isDone = step > index}
			{@const isCurrent = step === index}
			<li class="flex items-center gap-3">
				<div
					style:background-color={styles[i].backgroundColor}
					style:border-color={styles[i].borderColor}
					style:transform={styles[i].transform}
					class={cn(
						'w-9 h-9 rounded-full border flex items-center justify-center text-sm font-semibold',
						isDone || isCurrent ? 'text-black' : 'text-gray-500'
					)}
					aria-current={isCurrent ? 'step' : undefined}
				>
					{#if isDone}
						✓
					{:else}
						{index}
					{/if}
				</div>
				<span class={cn('text-sm', isCurrent ? 'font-semibold' : 'text-gray-600')}>{label}</span>
			</li>
		{/each}
	</ol>
</div>