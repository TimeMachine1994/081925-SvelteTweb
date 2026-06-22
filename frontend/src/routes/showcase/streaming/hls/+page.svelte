<script lang="ts">
	// Showcase static mockup of the public HLS viewer.
	import { Radio, Users, Send } from 'lucide-svelte';
	import { heroMemorial } from '../../_lib/mocks/memorials';
</script>

<div class="vw">
	<div class="vw-main">
		<div class="vw-stage" style={`background-image:url(${heroMemorial.photos[0]})`}>
			<span class="vw-live"><Radio size={14} /> LIVE</span>
			<span class="vw-viewers"><Users size={14} /> 128 watching</span>
		</div>
		<h1>Celebration of Life for {heroMemorial.lovedOneName}</h1>
		<p>Streaming live from St. Mary's Chapel · Quality: 1080p (HLS)</p>
	</div>
	<aside class="vw-chat">
		<div class="vw-chat-title">Live Chat</div>
		<div class="vw-chat-list">
			<p><b>Maria</b> Sending love to the family ❤️</p>
			<p><b>Tom</b> Beautiful service.</p>
			<p><b>Aunt Lin</b> Watching from London 🌍</p>
		</div>
		<div class="vw-chat-input">
			<input placeholder="Say something kind…" />
			<button><Send size={16} /></button>
		</div>
	</aside>
</div>

<style>
	.vw { display: grid; grid-template-columns: 1fr 320px; gap: 1rem; padding: 1rem; min-height: 100vh; background: #0b1220; color: #e2e8f0; font-family: ui-sans-serif, system-ui, sans-serif; }
	.vw-stage { position: relative; aspect-ratio: 16/9; background-size: cover; background-position: center; border-radius: 12px; }
	.vw-live { position: absolute; top: 0.75rem; left: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem; background: #b91c1c; color: #fff; padding: 0.3rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
	.vw-viewers { position: absolute; top: 0.75rem; right: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(0,0,0,0.55); padding: 0.3rem 0.6rem; border-radius: 999px; font-size: 0.75rem; }
	.vw-main h1 { margin: 1rem 0 0.25rem; font-size: 1.4rem; }
	.vw-main p { margin: 0; color: #94a3b8; }
	.vw-chat { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; display: flex; flex-direction: column; }
	.vw-chat-title { padding: 0.85rem 1rem; border-bottom: 1px solid #1e293b; font-weight: 700; }
	.vw-chat-list { flex: 1; padding: 1rem; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.875rem; }
	.vw-chat-list b { color: #d5ba7f; margin-right: 0.35rem; }
	.vw-chat-input { display: flex; gap: 0.5rem; padding: 0.75rem; border-top: 1px solid #1e293b; }
	.vw-chat-input input { flex: 1; background: #1e293b; border: 1px solid #334155; color: #e2e8f0; border-radius: 8px; padding: 0.5rem 0.65rem; }
	.vw-chat-input button { background: #d5ba7f; color: #1a1a1a; border: none; border-radius: 8px; padding: 0 0.75rem; cursor: pointer; }
</style>
