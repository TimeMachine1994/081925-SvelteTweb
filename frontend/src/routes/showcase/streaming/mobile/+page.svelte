<script lang="ts">
	// Showcase static mockup of the mobile broadcaster.
	import { Radio, SwitchCamera, Mic } from 'lucide-svelte';
	import { heroMemorial } from '../../_lib/mocks/memorials';
</script>

<div class="mob-wrap">
	<div class="phone">
		<div class="phone-stage" style={`background-image:url(${heroMemorial.photos[0]})`}>
			<span class="phone-live"><Radio size={12} /> LIVE</span>
			<div class="phone-controls">
				<button><Mic size={20} /></button>
				<button class="phone-go"><Radio size={22} /></button>
				<button><SwitchCamera size={20} /></button>
			</div>
		</div>
	</div>
	<p>Mobile broadcast · {heroMemorial.lovedOneName}</p>
</div>

<style>
	.mob-wrap { min-height: 100vh; background: #0b1220; color: #e2e8f0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; font-family: ui-sans-serif, system-ui, sans-serif; padding: 1.5rem; }
	.phone { width: 300px; height: 600px; border-radius: 36px; border: 10px solid #1e293b; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
	.phone-stage { position: relative; width: 100%; height: 100%; background-size: cover; background-position: center; }
	.phone-live { position: absolute; top: 0.75rem; left: 0.75rem; display: inline-flex; align-items: center; gap: 0.3rem; background: #b91c1c; color: #fff; padding: 0.25rem 0.55rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; }
	.phone-controls { position: absolute; bottom: 1.25rem; left: 0; right: 0; display: flex; align-items: center; justify-content: center; gap: 1.5rem; }
	.phone-controls button { background: rgba(0,0,0,0.55); color: #fff; border: none; width: 48px; height: 48px; border-radius: 999px; display: grid; place-items: center; cursor: pointer; }
	.phone-go { background: #b91c1c !important; width: 64px !important; height: 64px !important; }
	.mob-wrap p { color: #94a3b8; }
</style>
