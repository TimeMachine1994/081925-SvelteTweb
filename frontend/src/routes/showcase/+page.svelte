<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { SCREENS, JOURNEYS, allEdges, type Journey } from './_lib/manifest';

	let renderError = $state(false);
	// One diagram container per journey so each "squid" can print on its own page.
	const journeyContainers: Record<string, HTMLDivElement> = {};

	// mermaid node ids cannot contain hyphens; map sanitized id -> showcase path.
	const sanitize = (id: string) => id.replace(/-/g, '_');
	const navMap: Record<string, string> = {};
	for (const s of SCREENS) navMap[sanitize(s.id)] = s.path;

	// Undirected adjacency (sanitized ids) used for hover-highlighting neighbors.
	const adjacency: Record<string, Set<string>> = {};
	for (const s of SCREENS) adjacency[sanitize(s.id)] = new Set();
	for (const e of allEdges()) {
		const a = sanitize(e.from);
		const b = sanitize(e.to);
		adjacency[a]?.add(b);
		adjacency[b]?.add(a);
	}

	// Build a standalone diagram for a single journey (its own page when printed).
	function buildJourneyDefinition(journeyKey: Journey): string {
		const lines: string[] = ['flowchart TD'];
		const screens = SCREENS.filter((s) => s.journey === journeyKey);

		for (const s of screens) lines.push(`  ${sanitize(s.id)}["${s.label}"]`);
		for (const e of allEdges()) {
			if (e.cross) continue;
			const from = SCREENS.find((s) => s.id === e.from);
			if (from?.journey !== journeyKey) continue;
			lines.push(`  ${sanitize(e.from)} --> ${sanitize(e.to)}`);
		}

		// Highlight the hub (squid body).
		const hubs = screens.filter((s) => s.hub).map((s) => sanitize(s.id));
		lines.push('  classDef hub fill:#d5ba7f,stroke:#b8860b,stroke-width:3px,color:#1a1a1a;');
		if (hubs.length) lines.push(`  class ${hubs.join(',')} hub;`);

		// Clickable nodes.
		for (const s of screens) lines.push(`  click ${sanitize(s.id)} call __scNav()`);

		return lines.join('\n');
	}

	// Extract a sanitized screen id from a mermaid node group id (flowchart-<id>-<n>).
	function nodeIdFromEl(el: Element): string | undefined {
		const raw = el.id || '';
		const m = raw.match(/^flowchart-(.+)-\d+$/);
		return m ? m[1] : undefined;
	}

	// Dim every node except the hovered one and its direct neighbors.
	function wireHighlight(root: HTMLElement) {
		const nodes = Array.from(root.querySelectorAll<SVGGElement>('g.node'));
		const clear = () => nodes.forEach((n) => n.classList.remove('sc-dim', 'sc-focus'));
		for (const node of nodes) {
			const id = nodeIdFromEl(node);
			if (!id) continue;
			const neighbors = adjacency[id] ?? new Set<string>();
			node.addEventListener('mouseenter', () => {
				for (const other of nodes) {
					const oid = nodeIdFromEl(other);
					const related = oid === id || (oid && neighbors.has(oid));
					other.classList.toggle('sc-dim', !related);
					other.classList.toggle('sc-focus', oid === id);
				}
			});
			node.addEventListener('mouseleave', clear);
		}
	}

	onMount(async () => {
		(window as any).__scNav = (nodeId: string) => {
			const path = navMap[nodeId];
			if (path) goto(path);
		};

		try {
			const mermaid = (await import('mermaid')).default;
			// 'neutral' = light theme so the diagrams print cleanly on white paper.
			mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'neutral' });
			for (const j of JOURNEYS) {
				const el = journeyContainers[j.key];
				if (!el) continue;
				const { svg, bindFunctions } = await mermaid.render(
					`sc_${j.key}`,
					buildJourneyDefinition(j.key)
				);
				el.innerHTML = svg;
				bindFunctions?.(el);
				wireHighlight(el);
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
		<div class="sitemap-head">
			<h2>Sitemap</h2>
			<button class="print-btn" onclick={() => window.print()} title="Print — one journey per page">
				🖨 Print
			</button>
		</div>
		{#if renderError}
			<p class="error">Diagram failed to render. Use the links below instead.</p>
		{/if}
		{#each JOURNEYS as j (j.key)}
			<div class="journey-block">
				<h3 class="journey-title">{j.label}</h3>
				<div class="diagram" bind:this={journeyContainers[j.key]}></div>
			</div>
		{/each}

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
	.sitemap-head {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.sitemap h2 {
		font-size: 1.4rem;
		font-weight: 700;
		margin: 0;
		color: #e2e8f0;
		text-align: center;
	}
	.print-btn {
		background: #1e293b;
		color: #e2e8f0;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		padding: 0.4rem 0.8rem;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.print-btn:hover {
		background: #334155;
	}
	.journey-block {
		margin-bottom: 1.75rem;
	}
	.journey-title {
		text-align: center;
		color: #d5ba7f;
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0 0 0.6rem;
	}
	.diagram {
		background: #ffffff;
		border: 1px solid #cbd5e1;
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
	/* Hover-highlight: dim unrelated nodes, emphasize the focused one. */
	.diagram :global(g.node) {
		transition: opacity 0.15s ease;
	}
	.diagram :global(g.node.sc-dim) {
		opacity: 0.22;
	}
	.diagram :global(g.node.sc-focus) {
		filter: drop-shadow(0 0 6px rgba(213, 186, 127, 0.85));
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

	/* Print: one squid (journey) per page, hide interactive chrome. */
	@media print {
		.landing {
			color: #000;
			max-width: none;
			padding: 0;
		}
		.hero,
		.link-grid,
		.print-btn {
			display: none !important;
		}
		.sitemap-head {
			justify-content: flex-start;
			margin-bottom: 0.5rem;
		}
		.sitemap h2,
		.journey-title {
			color: #000;
		}
		.journey-block {
			break-inside: avoid;
			break-after: page;
			margin: 0;
			padding-top: 0.5rem;
		}
		.journey-block:last-of-type {
			break-after: auto;
		}
		.diagram {
			border: none;
			background: #fff;
			padding: 0;
			min-height: 0;
		}
		.diagram :global(svg) {
			cursor: default;
		}
		:global(*) {
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}
	}
</style>
