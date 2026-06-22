<script lang="ts">
	// Showcase static mockup of the broadcaster Camera page.
	import { Mic, Video as VideoIcon, Radio, Settings } from 'lucide-svelte';
	import { heroMemorial } from '../../_lib/mocks/memorials';
</script>

<div class="cam">
	<div class="cam-stage" style={`background-image:url(${heroMemorial.photos[1] ?? heroMemorial.photos[0]})`}>
		<span class="cam-self">You · Camera 1</span>
		<span class="cam-ready">Ready to broadcast</span>
	</div>
	<div class="cam-controls">
		<button class="cam-btn"><Mic size={18} /> Mic On</button>
		<button class="cam-btn"><VideoIcon size={18} /> Camera On</button>
		<button class="cam-btn"><Settings size={18} /> Settings</button>
		<button class="cam-go"><Radio size={18} /> Go Live</button>
	</div>
	<p class="cam-hint">Room: chapel-main · Operator broadcast view for {heroMemorial.lovedOneName}</p>
</div>

<style>
	.cam { padding: 1.5rem; min-height: 100vh; background: #0b1220; color: #e2e8f0; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; }
	.cam-stage { position: relative; width: 100%; max-width: 900px; aspect-ratio: 16/9; background-size: cover; background-position: center; border-radius: 14px; border: 1px solid #1e293b; }
	.cam-self { position: absolute; bottom: 0.6rem; left: 0.6rem; background: rgba(0,0,0,0.6); padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.8rem; }
	.cam-ready { position: absolute; top: 0.6rem; right: 0.6rem; background: #166534; padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.75rem; }
	.cam-controls { display: flex; gap: 0.6rem; margin: 1.25rem 0 0.5rem; flex-wrap: wrap; justify-content: center; }
	.cam-btn { display: inline-flex; align-items: center; gap: 0.4rem; background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 10px; padding: 0.6rem 0.9rem; cursor: pointer; }
	.cam-go { display: inline-flex; align-items: center; gap: 0.4rem; background: #b91c1c; color: #fff; border: none; border-radius: 10px; padding: 0.6rem 1.1rem; font-weight: 700; cursor: pointer; }
	.cam-hint { color: #94a3b8; margin-top: 0.5rem; }
</style>
