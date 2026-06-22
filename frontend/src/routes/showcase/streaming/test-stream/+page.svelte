<script lang="ts">
	// Showcase static mockup of the internal Test Stream / diagnostics page.
	import { CheckCircle, Radio } from 'lucide-svelte';

	const checks = [
		{ label: 'Camera access', ok: true },
		{ label: 'Microphone access', ok: true },
		{ label: 'Network bandwidth (8.4 Mbps up)', ok: true },
		{ label: 'Encoder (H.264 / 1080p60)', ok: true },
		{ label: 'Ingest connection (Mux)', ok: true }
	];
</script>

<div class="ts">
	<h1>Stream Diagnostics</h1>
	<p>Run a quick check before going live.</p>

	<div class="ts-stage">
		<span class="ts-bars">▁▃▅▇▅▃▁</span>
		<span class="ts-label">Preview · color bars</span>
	</div>

	<ul class="ts-checks">
		{#each checks as c (c.label)}
			<li><CheckCircle size={18} /> {c.label}</li>
		{/each}
	</ul>

	<button class="ts-go"><Radio size={18} /> Start Test Broadcast</button>
</div>

<style>
	.ts { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 4rem; color: #e2e8f0; font-family: ui-sans-serif, system-ui, sans-serif; }
	.ts h1 { font-size: 1.6rem; margin: 0 0 0.25rem; }
	.ts p { color: #94a3b8; margin: 0 0 1.5rem; }
	.ts-stage { aspect-ratio: 16/9; background: linear-gradient(90deg,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #0b1220; font-weight: 800; }
	.ts-bars { font-size: 2rem; letter-spacing: 0.2rem; }
	.ts-label { background: rgba(0,0,0,0.5); color: #fff; padding: 0.2rem 0.6rem; border-radius: 6px; margin-top: 0.5rem; font-weight: 600; }
	.ts-checks { list-style: none; padding: 0; margin: 1.5rem 0; display: flex; flex-direction: column; gap: 0.6rem; }
	.ts-checks li { display: flex; align-items: center; gap: 0.5rem; color: #86efac; }
	.ts-go { display: inline-flex; align-items: center; gap: 0.5rem; background: #b91c1c; color: #fff; border: none; border-radius: 10px; padding: 0.75rem 1.25rem; font-weight: 700; cursor: pointer; }
</style>
