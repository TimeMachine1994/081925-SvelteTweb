<script lang="ts">
	let { class: className = '' } = $props();
</script>

<div class="animate-pulse bg-muted rounded {className}"></div>

<style>
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
