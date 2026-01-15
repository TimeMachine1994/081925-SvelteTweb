<script lang="ts">
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

	interface Props {
		icon: IconDefinition;
		class?: string;
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
	}

	let { icon, class: className = '', size = 'md' }: Props = $props();

	const sizeClasses = {
		xs: 'w-3 h-3',
		sm: 'w-4 h-4',
		md: 'w-5 h-5',
		lg: 'w-6 h-6',
		xl: 'w-8 h-8',
		'2xl': 'w-10 h-10'
	};

	const path = icon.icon[4] as string;
	const viewBox = `0 0 ${icon.icon[0]} ${icon.icon[1]}`;
</script>

<svg
	class={`inline-block ${sizeClasses[size]} ${className}`}
	{viewBox}
	fill="currentColor"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<path d={path} />
</svg>
