<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';
	import { Heart, Eye, Calendar, Users, Search, Plus } from 'lucide-svelte';

	let { memorials }: { memorials: Memorial[] } = $props();

	console.log('👀 ViewerPortal rendering with', memorials.length, 'followed memorials');

	// Unfollow memorial function
	async function unfollowMemorial(memorialId: string) {
		try {
			const response = await fetch(`/api/memorials/${memorialId}/follow`, {
				method: 'DELETE'
			});

			if (response.ok) {
				// Refresh the page to update the list
				window.location.reload();
			} else {
				console.error('Failed to unfollow memorial');
			}
		} catch (error) {
			console.error('Error unfollowing memorial:', error);
		}
	}
</script>

<div class="mx-auto max-w-6xl px-4 py-6">
	<!-- Header Section -->
	<div class="mb-8">
		<div class="mb-6 flex items-center space-x-4">
			<div
				class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 shadow-lg"
			>
				<Heart class="h-8 w-8 text-white" />
			</div>
			<div>
				<h1 class="text-3xl font-bold text-gray-900">My Followed Memorials</h1>
				<p class="text-lg text-gray-600">Stay connected with the memorials you care about</p>
			</div>
		</div>

		<!-- Quick Stats -->
		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
				<div class="flex items-center space-x-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
						<Heart class="h-5 w-5 text-pink-600" />
					</div>
					<div>
						<p class="text-2xl font-bold text-gray-900">{memorials.length}</p>
						<p class="text-sm text-gray-600">Following</p>
					</div>
				</div>
			</div>

			<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
				<div class="flex items-center space-x-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
						<Calendar class="h-5 w-5 text-green-600" />
					</div>
					<div>
						<p class="text-2xl font-bold text-gray-900">
							{memorials.filter((m) => m.serviceDate && new Date(m.serviceDate) > new Date())
								.length}
						</p>
						<p class="text-sm text-gray-600">Upcoming Services</p>
					</div>
				</div>
			</div>

			<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
				<div class="flex items-center space-x-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
						<Eye class="h-5 w-5 text-blue-600" />
					</div>
					<div>
						<p class="text-2xl font-bold text-gray-900">
							{memorials.filter((m) => m.isPublic).length}
						</p>
						<p class="text-sm text-gray-600">Public</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="mb-8">
		<h2 class="mb-4 text-xl font-semibold text-gray-900">Discover</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<a
				href="/search"
				class="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
			>
				<div class="mb-3 flex items-center space-x-3">
					<Search class="h-6 w-6" />
					<h3 class="text-lg font-semibold">Find Memorials</h3>
				</div>
				<p class="text-blue-100">Search for memorials to follow and support families</p>
			</a>

			<a
				href="/tributes"
				class="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
			>
				<div class="mb-3 flex items-center space-x-3">
					<Eye class="h-6 w-6" />
					<h3 class="text-lg font-semibold">Browse All</h3>
				</div>
				<p class="text-emerald-100">Explore public memorials and tributes</p>
			</a>
		</div>
	</div>

	<!-- Followed Memorials -->
	<div class="mb-8">
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-xl font-semibold text-gray-900">Followed Memorials</h2>
			<span class="text-sm text-gray-500">{memorials.length} total</span>
		</div>

		{#if memorials && memorials.length > 0}
			<div class="grid gap-4">
				{#each memorials as memorial}
					<div
						class="rounded-xl border border-gray-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
					>
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-4">
								<div
									class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg"
								>
									<span class="text-lg font-bold text-white">
										{memorial.lovedOneName?.charAt(0) || 'M'}
									</span>
								</div>
								<div>
									<h3 class="text-lg font-semibold text-gray-900">{memorial.lovedOneName}</h3>
									<div class="flex items-center space-x-4 text-sm text-gray-500">
										<span class="flex items-center">
											<Calendar class="mr-1 h-4 w-4" />
											{memorial.serviceDate
												? new Date(memorial.serviceDate).toLocaleDateString()
												: 'Date TBD'}
										</span>
										<span class="flex items-center">
											<Users class="mr-1 h-4 w-4" />
											{memorial.followerCount || 0} followers
										</span>
									</div>
								</div>
							</div>

							<div class="flex space-x-2">
								<a
									href="/{memorial.slug}"
									class="flex items-center space-x-1 rounded-lg bg-pink-600 px-4 py-2 text-white transition-colors hover:bg-pink-700"
								>
									<Eye class="h-4 w-4" />
									<span>View</span>
								</a>

								<button
									onclick={() => unfollowMemorial(memorial.id)}
									class="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
									title="Unfollow memorial"
								>
									Following
								</button>
							</div>
						</div>

						<!-- Memorial Preview -->
						<div class="mt-4 border-t border-gray-100 pt-4">
							<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
								<div>
									<span class="text-gray-500">Service Location:</span>
									<p class="font-medium text-gray-900">
										{memorial.location?.name || 'Location TBD'}
									</p>
								</div>
								<div>
									<span class="text-gray-500">Service Time:</span>
									<p class="font-medium text-gray-900">
										{memorial.serviceTime || 'Time TBD'}
									</p>
								</div>
								<div>
									<span class="text-gray-500">Duration:</span>
									<p class="font-medium text-gray-900">
										{memorial.duration ? `${memorial.duration} hours` : 'TBD'}
									</p>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- No followed memorials state -->
			<div class="rounded-xl border border-gray-200 bg-white py-12 text-center shadow-lg">
				<div class="mb-4 text-6xl text-gray-400">💝</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">No Followed Memorials</h3>
				<p class="mb-6 text-gray-600">
					You haven't followed any memorials yet. Discover memorials to stay connected with families
					and their loved ones.
				</p>
				<div class="space-x-4">
					<a
						href="/search"
						class="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
					>
						<Search class="mr-2 h-5 w-5" />
						Find Memorials
					</a>
					<a
						href="/tributes"
						class="inline-flex items-center rounded-lg border border-gray-200 bg-white px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50"
					>
						<Eye class="mr-2 h-5 w-5" />
						Browse All
					</a>
				</div>
			</div>
		{/if}
	</div>

	<!-- Logout Button -->
	<div class="mt-12 text-center">
		<form method="POST" action="/logout">
			<button
				type="submit"
				class="text-sm text-gray-500 transition-colors hover:text-gray-700 hover:underline"
			>
				Log Out
			</button>
		</form>
	</div>
</div>
