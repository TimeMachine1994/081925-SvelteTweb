<!--
SectionNav — navigation between a detail page's sub-route sections.
Renders as horizontal top tabs on desktop, and as a fixed bottom tab bar
(thumb-reachable, safe-area aware) under 768px. Real <a> links, so every
section stays deep-linkable and back/forward works — this is section-level
navigation, not global nav (which stays in AdminLayout's sidebar/drawer).
-->
<script lang="ts">
	import { page } from '$app/stores';
	import AdminIcon from './AdminIcon.svelte';

	export interface NavSection {
		id: string;
		label: string;
		href: string;
		icon: string;
		/** Optional count badge, e.g. number of streams. Omit or 0 to hide. */
		count?: number;
	}

	let { sections }: { sections: NavSection[] } = $props();

	function isActive(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname === href + '/';
	}
</script>

<!-- Desktop: top tab strip -->
<nav class="mb-6 hidden gap-1 border-b border-slate-200 md:flex" aria-label="Memorial sections">
	{#each sections as s (s.id)}
		<a
			href={s.href}
			aria-current={isActive(s.href) ? 'page' : undefined}
			class="flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors {isActive(
				s.href
			)
				? 'border-sky-600 text-sky-700'
				: 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'}"
		>
			<AdminIcon name={s.icon} size={16} />
			{s.label}
			{#if s.count}
				<span
					class="rounded-full px-1.5 py-0.5 text-[11px] font-semibold {isActive(s.href)
						? 'bg-sky-100 text-sky-700'
						: 'bg-slate-100 text-slate-600'}">{s.count}</span
				>
			{/if}
		</a>
	{/each}
</nav>

<!-- Mobile: fixed bottom tab bar -->
<nav
	class="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_4px_rgba(0,0,0,0.06)] md:hidden"
	aria-label="Memorial sections"
>
	{#each sections as s (s.id)}
		<a
			href={s.href}
			aria-current={isActive(s.href) ? 'page' : undefined}
			class="relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium {isActive(
				s.href
			)
				? 'text-sky-700'
				: 'text-slate-500'}"
		>
			<AdminIcon name={s.icon} size={20} />
			<span>{s.label}</span>
			{#if s.count}
				<span
					class="absolute right-2 top-1 min-w-[16px] rounded-full bg-sky-600 px-1 text-center text-[9px] font-bold text-white"
					>{s.count}</span
				>
			{/if}
		</a>
	{/each}
</nav>
