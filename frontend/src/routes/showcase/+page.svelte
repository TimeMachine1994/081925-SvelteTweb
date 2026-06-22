<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { SCREENS, JOURNEYS } from './_lib/manifest';

	let container = $state<HTMLDivElement>();
	let renderError = $state(false);

	// mermaid node ids cannot contain hyphens; map sanitized id -> showcase path.
	const sanitize = (id: string) => id.replace(/-/g, '_');
	const navMap: Record<string, string> = {};
	for (const s of SCREENS) navMap[sanitize(s.id)] = s.path;

	function buildDefinition(): string {
		const lines: string[] = ['flowchart TD'];

		// One subgraph per journey; screens chained linearly within each.
		for (const j of JOURNEYS) {
			const screens = SCREENS.filter((s) => s.journey === j.key);
			if (!screens.length) continue;
			lines.push(`  subgraph ${j.key.toUpperCase()}["${j.label}"]`);
			lines.push('  direction TB');
			screens.forEach((s, i) => {
				const node = `${sanitize(s.id)}["${s.label}"]`;
				if (i === 0) lines.push(`    ${node}`);
				else lines.push(`    ${sanitize(screens[i - 1].id)} --> ${node}`);
			});
			lines.push('  end');
		}

		// Clickable nodes.
		for (const s of SCREENS) lines.push(`  click ${sanitize(s.id)} call __scNav()`);

		return lines.join('\n');
	}

	onMount(async () => {
		(window as any).__scNav = (nodeId: string) => {
			const path = navMap[nodeId];
			if (path) goto(path);
		};

		try {
			const mermaid = (await import('mermaid')).default;
			mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'dark' });
			const { svg, bindFunctions } = await mermaid.render('sc_sitemap', buildDefinition());
			if (container) {
				container.innerHTML = svg;
				bindFunctions?.(container);
			}
		} catch (e) {
			console.error('[showcase] mermaid render failed', e);
			renderError = true;
		}
	});
</script>

<div class="landing">
	<header class="hero">
		<h1>Tributestream UI Showcase</h1>
		<p>
			A click-through, prefilled, auth-free tour of the main user journeys. Pick a journey below,
			or click any node in the sitemap to jump straight to a screen.
		</p>
		<div class="launchers">
			{#each JOURNEYS as j (j.key)}
				<button class="launch" onclick={() => goto(j.start)}>
					Start the {j.label} journey →
				</button>
			{/each}
		</div>
	</header>

	<section class="sitemap">
		<h2>Sitemap</h2>
		{#if renderError}
			<p class="error">Diagram failed to render. Use the links below instead.</p>
		{/if}
		<div class="diagram" bind:this={container}></div>

		<div class="link-grid">
			{#each JOURNEYS as j (j.key)}
				<div class="link-col">
					<h3>{j.label}</h3>
					<ul>
						{#each SCREENS.filter((s) => s.journey === j.key) as s (s.id)}
							<li><a href={s.path}>{s.label}</a></li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</section>
</div>

<style>
	.landing {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 4rem;
		font-family: ui-sans-serif, system-ui, sans-serif;
		color: #e2e8f0;
	}
	.hero {
		text-align: center;
		margin-bottom: 2.5rem;
	}
	.hero h1 {
		font-size: 2.25rem;
		font-weight: 800;
		margin: 0 0 0.75rem;
		color: #d5ba7f;
	}
	.hero p {
		max-width: 640px;
		margin: 0 auto 1.5rem;
		color: #94a3b8;
		line-height: 1.6;
	}
	.launchers {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}
	.launch {
		background: linear-gradient(135deg, #d5ba7f 0%, #b8a06b 100%);
		color: #1a1a1a;
		border: none;
		border-radius: 10px;
		padding: 0.85rem 1.5rem;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		transition: transform 0.15s ease;
	}
	.launch:hover {
		transform: translateY(-2px);
	}
	.sitemap h2 {
		font-size: 1.4rem;
		font-weight: 700;
		margin: 0 0 1rem;
		color: #e2e8f0;
		text-align: center;
	}
	.diagram {
		background: #0f172a;
		border: 1px solid #1e293b;
		border-radius: 12px;
		padding: 1.5rem;
		overflow-x: auto;
		min-height: 120px;
		display: flex;
		justify-content: center;
	}
	.diagram :global(svg) {
		max-width: 100%;
		height: auto;
		cursor: pointer;
	}
	.error {
		color: #fca5a5;
		text-align: center;
	}
	.link-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-top: 2rem;
	}
	.link-col {
		background: #0f172a;
		border: 1px solid #1e293b;
		border-radius: 12px;
		padding: 1.25rem 1.5rem;
	}
	.link-col h3 {
		margin: 0 0 0.75rem;
		color: #d5ba7f;
		font-size: 1.05rem;
	}
	.link-col ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.link-col a {
		color: #93c5fd;
		text-decoration: none;
	}
	.link-col a:hover {
		text-decoration: underline;
	}
	@media (max-width: 720px) {
		.link-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
