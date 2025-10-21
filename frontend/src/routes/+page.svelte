<script lang="ts">
	import { goto } from '$app/navigation';
	import { Heart, Sparkles, ArrowRight } from 'lucide-svelte';
	import { browser } from '$app/environment';

	// Brand selection functions
	function selectLegacy() {
		if (browser) {
			localStorage.setItem('tributestream-brand', 'legacy');
		}
		goto('/legacy');
	}

	function selectLive() {
		if (browser) {
			localStorage.setItem('tributestream-brand', 'live');
		}
		goto('/live');
	}
</script>

<svelte:head>
	<title>TributeStream - Choose Your Experience</title>
	<meta name="description" content="Choose between TributeStream Legacy for memorial services or TributeStream Live for celebrations and events." />
</svelte:head>

<!-- Brand Selection Splash Page -->
<div class="min-h-screen flex">
	<!-- TributeStream Legacy - Left Half -->
	<button 
		onclick={selectLegacy}
		class="w-1/2 relative overflow-hidden group transition-all duration-500 hover:w-3/5 focus:outline-none focus:ring-4 focus:ring-amber-500/50"
	>
		<!-- Background Image/Gradient -->
		<div class="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900"></div>
		
		<!-- Overlay -->
		<div class="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all duration-500"></div>
		
		<!-- Content -->
		<div class="relative z-10 h-full flex flex-col justify-center items-center text-white p-8">
			<div class="text-center space-y-6">
				<Heart class="w-16 h-16 mx-auto text-amber-300 group-hover:scale-110 transition-transform duration-500" />
				<div>
					<h1 class="text-4xl md:text-6xl font-bold mb-4 group-hover:scale-105 transition-transform duration-500">
						TributeStream
					</h1>
					<h2 class="text-2xl md:text-4xl font-semibold text-amber-200 mb-6">
						Legacy
					</h2>
				</div>
				<p class="text-lg md:text-xl max-w-md mx-auto leading-relaxed opacity-90">
					Honor your loved one's memory with beautiful memorial livestreams
				</p>
				<div class="flex items-center justify-center space-x-2 text-amber-200">
					<span class="text-sm font-medium">Memorial Services</span>
					<ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
				</div>
			</div>
		</div>
	</button>

	<!-- TributeStream Live - Right Half -->
	<button 
		onclick={selectLive}
		class="w-1/2 relative overflow-hidden group transition-all duration-500 hover:w-3/5 focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
	>
		<!-- Background Image/Gradient -->
		<div class="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-700"></div>
		
		<!-- Overlay -->
		<div class="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all duration-500"></div>
		
		<!-- Content -->
		<div class="relative z-10 h-full flex flex-col justify-center items-center text-white p-8">
			<div class="text-center space-y-6">
				<Sparkles class="w-16 h-16 mx-auto text-emerald-300 group-hover:scale-110 transition-transform duration-500" />
				<div>
					<h1 class="text-4xl md:text-6xl font-bold mb-4 group-hover:scale-105 transition-transform duration-500">
						TributeStream
					</h1>
					<h2 class="text-2xl md:text-4xl font-semibold text-emerald-200 mb-6">
						Live
					</h2>
				</div>
				<p class="text-lg md:text-xl max-w-md mx-auto leading-relaxed opacity-90">
					Celebrate life's special moments with live event streaming
				</p>
				<div class="flex items-center justify-center space-x-2 text-emerald-200">
					<span class="text-sm font-medium">Celebrations & Events</span>
					<ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
				</div>
			</div>
		</div>
	</button>
</div>
