<!--
NavProgress — a slim top-of-page loading bar shown during SvelteKit
navigations. Gives immediate feedback when a click triggers a slow server
`load` (e.g. the admin dashboard's Firestore queries) so the app never feels
frozen.
-->
<script lang="ts">
	import { navigating } from '$app/stores';
</script>

{#if $navigating}
	<div class="nav-progress" role="progressbar" aria-label="Loading page" aria-busy="true">
		<div class="nav-progress__bar"></div>
	</div>
{/if}

<style>
	.nav-progress {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		z-index: 9999;
		background: transparent;
		overflow: hidden;
		pointer-events: none;
	}

	.nav-progress__bar {
		height: 100%;
		width: 100%;
		transform: translateX(-100%);
		background: linear-gradient(90deg, #3182ce, #63b3ed);
		animation: nav-progress-slide 1.2s ease-in-out infinite;
	}

	@keyframes nav-progress-slide {
		0% {
			transform: translateX(-100%);
		}
		50% {
			transform: translateX(0%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-progress__bar {
			animation-duration: 2.4s;
		}
	}
</style>
