<script lang="ts">
	interface LightboxImage {
		url: string;
		caption?: string;
	}

	interface Props {
		images: LightboxImage[];
		startIndex: number;
		onClose: () => void;
	}

	let { images, startIndex, onClose }: Props = $props();

	let index = $state(startIndex);

	const current = $derived(images[index]);

	function goPrev() {
		index = (index - 1 + images.length) % images.length;
	}

	function goNext() {
		index = (index + 1) % images.length;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
		else if (e.key === 'ArrowLeft') goPrev();
		else if (e.key === 'ArrowRight') goNext();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_interactive_supports_focus -->
<div class="lightbox-overlay" onclick={onClose} role="dialog" aria-modal="true" tabindex="-1">
	<button class="close-btn" onclick={onClose} aria-label="Close">✕</button>

	{#if images.length > 1}
		<button
			class="nav-btn prev-btn"
			onclick={(e) => {
				e.stopPropagation();
				goPrev();
			}}
			aria-label="Previous image"
		>
			‹
		</button>
	{/if}

	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="lightbox-content" onclick={(e) => e.stopPropagation()}>
		<img src={current.url} alt={current.caption || 'Gallery image'} />
		{#if current.caption}
			<p class="lightbox-caption">{current.caption}</p>
		{/if}
		{#if images.length > 1}
			<p class="lightbox-counter">{index + 1} / {images.length}</p>
		{/if}
	</div>

	{#if images.length > 1}
		<button
			class="nav-btn next-btn"
			onclick={(e) => {
				e.stopPropagation();
				goNext();
			}}
			aria-label="Next image"
		>
			›
		</button>
	{/if}
</div>

<style>
	.lightbox-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.92);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		padding: 2rem;
	}

	.lightbox-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 90vw;
		max-height: 90vh;
	}

	.lightbox-content img {
		max-width: 100%;
		max-height: 80vh;
		object-fit: contain;
		border-radius: 0.25rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
	}

	.lightbox-caption {
		margin: 0.75rem 0 0 0;
		color: #e0e0e0;
		font-size: 0.9375rem;
		text-align: center;
		font-family: 'Fanwood Text', serif;
	}

	.lightbox-counter {
		margin: 0.375rem 0 0 0;
		color: #d5ba7f;
		font-size: 0.8125rem;
		letter-spacing: 0.05em;
	}

	.close-btn {
		position: absolute;
		top: 1.25rem;
		right: 1.5rem;
		background: none;
		border: none;
		color: #e0e0e0;
		font-size: 1.5rem;
		cursor: pointer;
		line-height: 1;
		padding: 0.5rem;
		transition: color 0.2s;
	}

	.close-btn:hover {
		color: #d5ba7f;
	}

	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(255, 255, 255, 0.08);
		border: none;
		color: #e0e0e0;
		font-size: 2.5rem;
		line-height: 1;
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.nav-btn:hover {
		background: rgba(213, 186, 127, 0.25);
		color: #d5ba7f;
	}

	.prev-btn {
		left: 1rem;
	}

	.next-btn {
		right: 1rem;
	}

	@media (max-width: 640px) {
		.lightbox-overlay {
			padding: 1rem;
		}

		.nav-btn {
			width: 2.5rem;
			height: 2.5rem;
			font-size: 2rem;
		}
	}
</style>
