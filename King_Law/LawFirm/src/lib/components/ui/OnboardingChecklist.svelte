<script lang="ts">
	import { CheckCircle, Circle, ChevronDown, ChevronUp, X } from 'lucide-svelte';

	type OnboardingStep = {
		id: string;
		label: string;
		description: string;
		href?: string;
		completed: boolean;
	};

	let {
		steps,
		onDismiss
	}: {
		steps: OnboardingStep[];
		onDismiss?: () => void;
	} = $props();

	let expanded = $state(true);

	let completedCount = $derived(steps.filter(s => s.completed).length);
	let progress = $derived(steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0);
	let allDone = $derived(completedCount === steps.length);
</script>

{#if !allDone}
	<div class="bg-background border border-border rounded-lg overflow-hidden mb-6">
		<!-- Header -->
		<div class="flex items-center justify-between px-5 py-4">
			<div class="flex items-center gap-3 flex-1 min-w-0">
				<div class="shrink-0">
					<div class="relative w-10 h-10">
						<svg class="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
							<path
								class="text-muted/30"
								d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
							/>
							<path
								class="text-gold"
								d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
								stroke-dasharray="{progress}, 100"
							/>
						</svg>
						<span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
							{completedCount}/{steps.length}
						</span>
					</div>
				</div>
				<div>
					<h3 class="font-semibold text-sm">Getting Started</h3>
					<p class="text-xs text-muted-foreground">Complete these steps to set up your account</p>
				</div>
			</div>
			<div class="flex items-center gap-1 shrink-0">
				<button
					onclick={() => expanded = !expanded}
					class="p-1.5 rounded hover:bg-muted transition-colors"
					aria-label={expanded ? 'Collapse' : 'Expand'}
				>
					{#if expanded}
						<ChevronUp class="w-4 h-4 text-muted-foreground" />
					{:else}
						<ChevronDown class="w-4 h-4 text-muted-foreground" />
					{/if}
				</button>
				{#if onDismiss}
					<button
						onclick={onDismiss}
						class="p-1.5 rounded hover:bg-muted transition-colors"
						aria-label="Dismiss checklist"
					>
						<X class="w-4 h-4 text-muted-foreground" />
					</button>
				{/if}
			</div>
		</div>

		<!-- Steps -->
		{#if expanded}
			<div class="border-t border-border">
				{#each steps as step}
					<div class="flex items-start gap-3 px-5 py-3 border-b border-border last:border-0 {step.completed ? 'opacity-60' : ''}">
						{#if step.completed}
							<CheckCircle class="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
						{:else}
							<Circle class="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
						{/if}
						<div class="flex-1 min-w-0">
							{#if step.href && !step.completed}
								<a href={step.href} class="text-sm font-medium text-foreground hover:text-gold transition-colors">
									{step.label}
								</a>
							{:else}
								<span class="text-sm font-medium {step.completed ? 'line-through text-muted-foreground' : 'text-foreground'}">
									{step.label}
								</span>
							{/if}
							<p class="text-xs text-muted-foreground mt-0.5">{step.description}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
