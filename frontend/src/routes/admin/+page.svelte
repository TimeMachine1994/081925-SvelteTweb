<script lang="ts">
	import AdminPortal from '$lib/components/portals/AdminPortal.svelte';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	let activeTab = $state('dashboard');

	// Use server-side loaded data
	const { user, memorials, allUsers, stats, error } = data;

</script>

{#if error}
	<div class="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
		<div class="bg-white rounded-lg shadow-lg p-8 max-w-md">
			<h1 class="text-2xl font-bold text-red-600 mb-4">Error Loading Admin Dashboard</h1>
			<p class="text-gray-600">{error}</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
		<!-- Animated Background -->
		<div class="fixed inset-0 overflow-hidden pointer-events-none">
			<div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
			<div class="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
			<div class="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
		</div>

		<div class="relative z-10 container mx-auto px-4 py-8">
			<!-- Header -->
			<div class="mb-8">
				<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-2xl">
					<div class="flex items-center gap-4">
						<div class="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
							<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
							</svg>
						</div>
						<div>
							<h1 class="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
							<p class="text-white/70">Welcome {user?.email} - System administration and user management</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Stats Overview -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-white/70 text-sm font-medium">Total Users</p>
							<p class="text-3xl font-bold text-white">{stats.totalUsers}</p>
						</div>
						<div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
							<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
							</svg>
						</div>
					</div>
				</div>

				<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-white/70 text-sm font-medium">Total Memorials</p>
							<p class="text-3xl font-bold text-white">{stats.totalMemorials}</p>
						</div>
						<div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
							<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
							</svg>
						</div>
					</div>
				</div>

				<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-white/70 text-sm font-medium">Active Streams</p>
							<p class="text-3xl font-bold text-white">{stats.activeStreams}</p>
						</div>
						<div class="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl flex items-center justify-center">
							<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path>
							</svg>
						</div>
					</div>
				</div>

				<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-white/70 text-sm font-medium">Recent Memorials</p>
							<p class="text-3xl font-bold text-white">{stats.recentMemorials}</p>
						</div>
						<div class="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
							<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
							</svg>
						</div>
					</div>
				</div>
			</div>

			<!-- Admin Portal Component -->
			<AdminPortal {memorials} {allUsers} />
		</div>
	</div>
{/if}

<style>
	@keyframes blob {
		0% { transform: translate(0px, 0px) scale(1); }
		33% { transform: translate(30px, -50px) scale(1.1); }
		66% { transform: translate(-20px, 20px) scale(0.9); }
		100% { transform: translate(0px, 0px) scale(1); }
	}
	.animate-blob {
		animation: blob 7s infinite;
	}
	.animation-delay-2000 {
		animation-delay: 2s;
	}
	.animation-delay-4000 {
		animation-delay: 4s;
	}
</style>
