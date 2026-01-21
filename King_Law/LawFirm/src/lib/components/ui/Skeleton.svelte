<script lang="ts">
	let { 
		class: className = '',
		variant = 'default'
	}: { 
		class?: string;
		variant?: 'default' | 'circle' | 'text';
	} = $props();

	const baseClasses = 'animate-pulse bg-muted rounded';
	const variantClasses = {
		default: '',
		circle: 'rounded-full',
		text: 'h-4'
	};
</script>

<div class="{baseClasses} {variantClasses[variant]} {className}"></div>
