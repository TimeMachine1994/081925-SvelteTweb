<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';
	import {
		Calendar,
		Users,
		Video,
		Plus,
		Settings,
		Phone,
		Mail,
		MapPin,
		Clock,
		Edit,
		Eye,
		Play
	} from 'lucide-svelte';
	import LivestreamControl from '$lib/components/LivestreamControl.svelte';

	let { memorials }: { memorials: Memorial[] } = $props();

	console.log('🏢 FuneralDirectorPortal rendering with', memorials.length, 'assigned memorials');
</script>

<div class="mx-auto max-w-6xl px-4 py-6">
	<!-- Header Section -->
	<div class="mb-8">
		<div class="mb-6 flex items-center space-x-4">
			<div
				class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 shadow-lg"
			>
				<Building2 class="h-8 w-8 text-white" />
			</div>
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Funeral Director Dashboard</h1>
				<p class="text-lg text-gray-600">Manage memorial services and support families</p>
			</div>
		</div>

		<!-- Quick Stats -->
		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
			<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
				<div class="flex items-center space-x-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
						<Building2 class="h-5 w-5 text-yellow-600" />
					</div>
					<div>
						<p class="text-2xl font-bold text-gray-900">{memorials.length}</p>
						<p class="text-sm text-gray-600">Active Memorials</p>
					</div>
				</div>
			</div>

			<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
				<div class="flex items-center space-x-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
						<Users class="h-5 w-5 text-amber-600" />
					</div>
					<div>
						<p class="text-2xl font-bold text-gray-900">
							{memorials.reduce((sum, m) => sum + (m.familyMemberCount || 0), 0)}
						</p>
						<p class="text-sm text-gray-600">Family Members</p>
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
							{memorials.filter((m) => m.serviceDate).length}
						</p>
						<p class="text-sm text-gray-600">Scheduled Services</p>
					</div>
				</div>
			</div>

			<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
				<div class="flex items-center space-x-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
						<Video class="h-5 w-5 text-red-600" />
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
		<h2 class="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<a
				href="/app/calculator"
				class="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
			>
				<div class="mb-3 flex items-center space-x-3">
					<Plus class="h-6 w-6" />
					<h3 class="text-lg font-semibold">Create Memorial</h3>
				</div>
				<p class="text-green-100">Set up a new memorial service with livestream</p>
			</a>

			<a
				href="/app/calculator"
				class="rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 p-6 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
			>
				<div class="mb-3 flex items-center space-x-3">
					<Calendar class="h-6 w-6" />
					<h3 class="text-lg font-semibold">Manage Schedule</h3>
				</div>
				<p class="text-yellow-100">Update service times and livestream schedule</p>
			</a>

			<a
				href="#livestream-section"
				class="rounded-xl bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
				onclick={() =>
					document.getElementById('livestream-section')?.scrollIntoView({ behavior: 'smooth' })}
			>
				<div class="mb-3 flex items-center space-x-3">
					<Video class="h-6 w-6" />
					<h3 class="text-lg font-semibold">Livestream Control</h3>
				</div>
				<p class="text-red-100">Start or manage livestreams for your memorials</p>
			</a>
		</div>
	</div>

	<!-- Assigned Memorials -->
	<div class="mb-8">
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-xl font-semibold text-gray-900">Assigned Memorials</h2>
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
									class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-yellow-600 to-amber-600 shadow-lg"
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
												: 'Not scheduled'}
										</span>
									</div>
								</div>
							</div>

							<div class="flex space-x-2">
								<a
									href="/profile"
									class="flex items-center space-x-1 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
								>
									<Camera class="h-4 w-4" />
									<span>Manage</span>
								</a>

								<a
									href="/schedule/{memorial.id}"
									class="flex items-center space-x-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
								>
									<Calendar class="h-4 w-4" />
									<span>Schedule</span>
								</a>

								<a
									href="/{memorial.slug}"
									class="rounded-lg bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
								>
									View
								</a>
							</div>
						</div>

						<!-- Memorial Details -->
						<div class="mt-4 border-t border-gray-100 pt-4">
							<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
								<div>
									<span class="text-gray-500">Family Contact:</span>
									<p class="font-medium text-gray-900">
										{memorial.familyContactEmail || 'Not provided'}
									</p>
								</div>
								<div>
									<span class="text-gray-500">Created:</span>
									<p class="font-medium text-gray-900">
										{new Date(memorial.createdAt).toLocaleDateString()}
									</p>
								</div>
								<div>
									<span class="text-gray-500">Status:</span>
									<p class="font-medium text-gray-900">
										{#if memorial.serviceDate}
											<span class="text-green-600">Scheduled</span>
										{:else}
											<span class="text-yellow-600">Planning</span>
										{/if}
									</p>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- No memorials state -->
			<div class="rounded-xl border border-gray-200 bg-white py-12 text-center shadow-lg">
				<div class="mb-4 text-6xl text-gray-400">🏛️</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">No Assigned Memorials</h3>
				<p class="mb-6 text-gray-600">
					You don't have any memorials assigned to you yet. Create a new memorial to get started.
				</p>
				<a
					href="/register/funeral-director"
					class="inline-flex items-center rounded-lg bg-gradient-to-r from-yellow-600 to-amber-600 px-6 py-3 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
				>
					<Plus class="mr-2 h-5 w-5" />
					Create First Memorial
				</a>
			</div>
		{/if}
	</div>

	<!-- Support Section -->
	<div class="rounded-xl border border-yellow-100 bg-gradient-to-r from-yellow-50 to-amber-50 p-6">
		<div class="mb-4 flex items-center space-x-3">
			<Phone class="h-6 w-6 text-yellow-600" />
			<h3 class="text-lg font-semibold text-gray-900">Need Support?</h3>
		</div>
		<p class="mb-4 text-gray-600">
			Our technical support team is available to help you with livestreaming, memorial setup, and
			family coordination.
		</p>
		<div class="flex space-x-4">
			<a
				href="tel:+1-800-TRIBUTE"
				class="rounded-lg bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
			>
				Call Support
			</a>
			<a
				href="/funeral-director/help"
				class="rounded-lg border border-yellow-200 bg-white px-4 py-2 text-yellow-600 transition-colors hover:bg-yellow-50"
			>
				Help Center
			</a>
		</div>
	</div>

	<!-- Livestream Management Section -->
	<div id="livestream-section" class="mb-8">
		<h2 class="mb-6 text-xl font-semibold text-gray-900">Livestream Management</h2>

		{#if memorials.length > 0}
			<div class="space-y-6">
				{#each memorials as memorial}
					<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
						<div class="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
							<div class="flex items-center justify-between">
								<div>
									<h3 class="text-lg font-semibold text-gray-900">{memorial.lovedOneName}</h3>
									<p class="text-sm text-gray-600">
										Service: {memorial.serviceDate
											? new Date(memorial.serviceDate).toLocaleDateString()
											: 'Date TBD'}
										{#if memorial.serviceTime}
											at {memorial.serviceTime}
										{/if}
									</p>
								</div>
								<div class="flex items-center space-x-2">
									<a
										href="/profile"
										class="text-sm font-medium text-amber-600 hover:text-amber-700"
									>
										Manage
									</a>
								</div>
							</div>
						</div>

						<div class="p-6">
							<LivestreamControl
								memorialId={memorial.id}
								memorialName={memorial.lovedOneName}
								showTitle={false}
							/>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="rounded-xl border border-gray-200 bg-white py-12 text-center shadow-lg">
				<div class="mb-4 text-6xl text-gray-400">📺</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">No Assigned Memorials</h3>
				<p class="mb-6 text-gray-600">
					You don't have any memorials assigned to you yet. Contact your administrator to get
					started.
				</p>
				<a
					href="/app/calculator"
					class="inline-flex items-center rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
				>
					<Plus class="mr-2 h-5 w-5" />
					Create Memorial
				</a>
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
