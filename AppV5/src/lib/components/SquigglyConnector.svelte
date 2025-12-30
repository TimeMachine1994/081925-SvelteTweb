<script lang="ts">
	let { height = 60 }: { height?: number } = $props();
</script>

<div class="squiggly-connector" style="height: {height}px;">
	<svg width="100%" height="{height}" viewBox="0 0 100 {height}" preserveAspectRatio="none">
		<path
			d="M 50,0 Q 30,{height/4} 50,{height/2} T 50,{height}"
			stroke="#94a3b8"
			stroke-width="2"
			fill="none"
			stroke-dasharray="5,5"
		/>
		<circle cx="50" cy="0" r="4" fill="#94a3b8" />
		<circle cx="50" cy="{height}" r="4" fill="#94a3b8" />
	</svg>
</div>

<style>
	.squiggly-connector {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 1rem 0;
	}

	svg {
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05));
	}
</style>
