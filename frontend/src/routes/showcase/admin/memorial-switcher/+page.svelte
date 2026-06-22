<script lang="ts">
	// Showcase static mockup of the live broadcast "Switcher" (the real console
	// connects to Daily.co; here we present a representative visual-only layout).
	import { Mic, Video as VideoIcon, Monitor, Radio, Power, Share2 } from 'lucide-svelte';
	import { heroMemorial } from '../../_lib/mocks/memorials';

	const cameras = [
		{ id: 'cam-1', label: 'Chapel — Wide', live: true },
		{ id: 'cam-2', label: 'Chapel — Podium', live: false },
		{ id: 'cam-3', label: 'Mobile — Operator', live: false }
	];
</script>

<div class="sw">
	<div class="sw-top">
		<div>
			<h1>Live Switcher</h1>
			<p>{heroMemorial.lovedOneName} — Celebration of Life</p>
		</div>
		<div class="sw-status"><Radio size={16} /> LIVE · 00:42:15</div>
	</div>

	<div class="sw-main">
		<div class="sw-program">
			<div class="sw-program-stage" style={`background-image:url(${heroMemorial.photos[0]})`}>
				<span class="sw-badge">PROGRAM</span>
			</div>
			<div class="sw-controls">
				<button class="sw-btn"><Mic size={16} /> Mute</button>
				<button class="sw-btn"><VideoIcon size={16} /> Cut</button>
				<button class="sw-btn"><Monitor size={16} /> Share Screen</button>
				<button class="sw-btn"><Share2 size={16} /> Copy Link</button>
				<button class="sw-btn sw-danger"><Power size={16} /> End Stream</button>
			</div>
		</div>

		<div class="sw-sources">
			<div class="sw-sources-title">Sources</div>
			{#each cameras as c (c.id)}
				<button class="sw-source" class:live={c.live} style={`background-image:url(${heroMemorial.photos[1]})`}>
					<span>{c.label}</span>
					{#if c.live}<em>ON AIR</em>{/if}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.sw { padding: 1.5rem; color: #e2e8f0; background: #0b1220; min-height: 100%; font-family: ui-sans-serif, system-ui, sans-serif; }
	.sw-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
	.sw-top h1 { margin: 0; font-size: 1.5rem; font-weight: 800; }
	.sw-top p { margin: 0.15rem 0 0; color: #94a3b8; }
	.sw-status { display: flex; align-items: center; gap: 0.4rem; background: #b91c1c; color: #fff; padding: 0.4rem 0.75rem; border-radius: 999px; font-weight: 700; font-size: 0.8rem; }
	.sw-main { display: grid; grid-template-columns: 2fr 1fr; gap: 1.25rem; }
	.sw-program-stage { position: relative; aspect-ratio: 16/9; background-size: cover; background-position: center; border-radius: 12px; border: 2px solid #ef4444; }
	.sw-badge { position: absolute; top: 0.5rem; left: 0.5rem; background: #ef4444; color: #fff; font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 6px; }
	.sw-controls { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.85rem; }
	.sw-btn { display: inline-flex; align-items: center; gap: 0.4rem; background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 8px; padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.85rem; }
	.sw-danger { background: #7f1d1d; border-color: #991b1b; }
	.sw-sources-title { font-weight: 700; margin-bottom: 0.6rem; color: #cbd5e1; }
	.sw-source { position: relative; display: block; width: 100%; aspect-ratio: 16/9; background-size: cover; background-position: center; border-radius: 10px; border: 1px solid #334155; margin-bottom: 0.6rem; cursor: pointer; color: #fff; }
	.sw-source.live { border-color: #ef4444; }
	.sw-source span { position: absolute; bottom: 0.4rem; left: 0.5rem; background: rgba(0,0,0,0.6); padding: 0.15rem 0.45rem; border-radius: 6px; font-size: 0.75rem; }
	.sw-source em { position: absolute; top: 0.4rem; right: 0.5rem; background: #ef4444; padding: 0.15rem 0.45rem; border-radius: 6px; font-size: 0.7rem; font-style: normal; font-weight: 700; }
</style>
