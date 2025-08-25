<script lang="ts">
	import { onMount } from 'svelte';

	let video: HTMLVideoElement;

	onMount(() => {
		console.log('📹 Homepage mounted, setting video playback rate.');
		if (video) {
			video.playbackRate = 0.5;
		}
	});
</script>

<div class="relative h-screen w-full flex items-center justify-center overflow-hidden">
	<video bind:this={video} autoplay loop muted playsinline class="absolute top-1/2 left-1/2 w-full h-full object-cover transform -translate-x-1/2 -translate-y-1/2 -z-20">
		<source
			src="https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/header_ad%20(720p).mp4?alt=media&token=6154f714-8db1-4711-9d58-b4bef32dee0a"
			type="video/mp4"
		/>
		Your browser does not support the video tag.
	</video>
	<div class="absolute top-0 left-0 w-full h-full bg-black/50 -z-10"></div>
	<div class="text-center text-white z-10 p-4">
		<h1 class="text-5xl font-bold mb-6">Tributestream makes hearts full again</h1>
		<div class="flex flex-col items-center gap-4">
			<input type="text" placeholder="Enter a name to search or create" class="w-full max-w-md px-4 py-3 rounded-md border border-gray-300 bg-black/70 text-white placeholder-gray-400 text-lg" />
			<div class="flex gap-4">
				<button class="btn bg-amber-400 text-black font-bold py-3 px-6 rounded-md text-lg">Create Tribute</button>
				<button class="btn bg-amber-400 text-black font-bold py-3 px-6 rounded-md text-lg">Search Tributes</button>
			</div>
		</div>
		<p class="mt-8 text-2xl">Call Us To Book Today 407-221-5922</p>
	</div>
</div>