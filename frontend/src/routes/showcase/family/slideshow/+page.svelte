<script lang="ts">
	// Showcase static mockup of the Slideshow Generator (the real tool relies on
	// uploads + media processing, which we present here as a visual-only mock).
	import { Image, Music, Wand2, Play } from 'lucide-svelte';
	import { heroMemorial } from '../../_lib/mocks/memorials';

	const photos = heroMemorial.photos;
</script>

<div class="ss">
	<header class="ss-head">
		<h1>Slideshow Generator</h1>
		<p>Turn cherished photos into a beautiful tribute slideshow for {heroMemorial.lovedOneName}.</p>
	</header>

	<div class="ss-grid">
		<section class="ss-card">
			<div class="ss-card-title"><Image size={18} /> Photos ({photos.length})</div>
			<div class="ss-thumbs">
				{#each photos as p (p)}
					<img src={p} alt="memorial" />
				{/each}
				<button class="ss-add">+ Add photos</button>
			</div>
		</section>

		<section class="ss-card">
			<div class="ss-card-title"><Music size={18} /> Music</div>
			<select class="ss-select">
				<option>Gentle Piano — "Remembrance"</option>
				<option>Acoustic — "Sunset Memories"</option>
				<option>Strings — "Eternal"</option>
			</select>
			<div class="ss-card-title" style="margin-top:1rem"><Wand2 size={18} /> Transition</div>
			<select class="ss-select">
				<option>Cross-fade</option>
				<option>Slide</option>
				<option>Ken Burns</option>
			</select>
		</section>

		<section class="ss-card ss-preview">
			<div class="ss-card-title"><Play size={18} /> Preview</div>
			<div class="ss-stage" style={`background-image:url(${photos[0]})`}>
				<button class="ss-play"><Play size={28} /></button>
			</div>
			<button class="ss-generate">Generate Slideshow</button>
		</section>
	</div>
</div>

<style>
	.ss { max-width: 1000px; margin: 0 auto; padding: 2rem 1.5rem 4rem; font-family: ui-sans-serif, system-ui, sans-serif; }
	.ss-head h1 { font-size: 2rem; font-weight: 800; margin: 0 0 0.25rem; color: #1a1a1a; }
	.ss-head p { color: #6b7280; margin: 0 0 2rem; }
	.ss-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
	.ss-preview { grid-column: 1 / -1; }
	.ss-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 1.25rem; }
	.ss-card-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: #374151; margin-bottom: 0.75rem; }
	.ss-thumbs { display: flex; flex-wrap: wrap; gap: 0.5rem; }
	.ss-thumbs img { width: 84px; height: 84px; object-fit: cover; border-radius: 8px; }
	.ss-add { width: 84px; height: 84px; border: 2px dashed #d1d5db; border-radius: 8px; color: #6b7280; background: #f9fafb; cursor: pointer; }
	.ss-select { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; }
	.ss-stage { position: relative; aspect-ratio: 16 / 9; background-size: cover; background-position: center; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
	.ss-play { background: rgba(0,0,0,0.55); color: #fff; border: none; border-radius: 999px; width: 64px; height: 64px; display: grid; place-items: center; cursor: pointer; }
	.ss-generate { margin-top: 1rem; width: 100%; padding: 0.85rem; border: none; border-radius: 10px; background: linear-gradient(135deg, #d5ba7f, #b8a06b); color: #1a1a1a; font-weight: 700; cursor: pointer; }
</style>
