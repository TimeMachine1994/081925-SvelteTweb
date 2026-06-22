<script lang="ts">
	// Showcase static mockup of the low-latency WHEP viewer.
	import { Radio, Zap } from 'lucide-svelte';
	import { heroMemorial } from '../../_lib/mocks/memorials';
</script>

<div class="whep">
	<div class="whep-stage" style={`background-image:url(${heroMemorial.photos[2] ?? heroMemorial.photos[0]})`}>
		<span class="whep-live"><Radio size={14} /> LIVE</span>
		<span class="whep-latency"><Zap size={14} /> ~0.4s latency (WHEP)</span>
	</div>
	<div class="whep-bar">
		<h1>{heroMemorial.lovedOneName} — Low-latency Feed</h1>
		<div class="whep-stats">
			<span>WebRTC</span><span>1080p60</span><span>Bitrate 6.2 Mbps</span>
		</div>
	</div>
</div>

<style>
	.whep { padding: 1.5rem; min-height: 100vh; background: #0b1220; color: #e2e8f0; font-family: ui-sans-serif, system-ui, sans-serif; }
	.whep-stage { position: relative; max-width: 1100px; margin: 0 auto; aspect-ratio: 16/9; background-size: cover; background-position: center; border-radius: 14px; }
	.whep-live { position: absolute; top: 0.75rem; left: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem; background: #b91c1c; color: #fff; padding: 0.3rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
	.whep-latency { position: absolute; top: 0.75rem; right: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(0,0,0,0.55); padding: 0.3rem 0.6rem; border-radius: 999px; font-size: 0.75rem; }
	.whep-bar { max-width: 1100px; margin: 1rem auto 0; display: flex; align-items: center; justify-content: space-between; }
	.whep-bar h1 { font-size: 1.3rem; margin: 0; }
	.whep-stats { display: flex; gap: 0.5rem; }
	.whep-stats span { background: #1e293b; border: 1px solid #334155; border-radius: 999px; padding: 0.25rem 0.6rem; font-size: 0.75rem; color: #94a3b8; }
</style>
