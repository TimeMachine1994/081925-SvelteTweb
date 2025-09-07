<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';
	import { Calendar, Users, Video, Plus, Settings, Phone, Mail, MapPin, Clock, Edit, Eye, Play } from 'lucide-svelte';
	import LivestreamControl from '$lib/components/LivestreamControl.svelte';
	
	let { memorials }: { memorials: Memorial[] } = $props();
	
	console.log('🏢 FuneralDirectorPortal rendering with', memorials.length, 'assigned memorials');
</script>

<div class="max-w-6xl mx-auto px-4 py-6">
	<!-- Header Section -->
	<div class="mb-8">
		<div class="flex items-center space-x-4 mb-6">
			<div class="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
				<Building2 class="w-8 h-8 text-white" />
			</div>
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Funeral Director Dashboard</h1>
				<p class="text-lg text-gray-600">Manage memorial services and support families</p>
			</div>
		</div>
		
		<!-- Quick Stats -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
			<div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
						<Building2 class="w-5 h-5 text-purple-600" />
					</div>
					<div>
						<p class="text-2xl font-bold text-gray-900">{memorials.length}</p>
						<p class="text-sm text-gray-600">Active Memorials</p>
					</div>
				</div>
			</div>
			
			<div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
						<Calendar class="w-5 h-5 text-green-600" />
					</div>
					<div>
						<p class="text-2xl font-bold text-gray-900">{memorials.filter(m => m.serviceDate).length}</p>
						<p class="text-sm text-gray-600">Scheduled Services</p>
					</div>
				</div>
			</div>
			
			<div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
						<Video class="w-5 h-5 text-red-600" />
					</div>
					<div>
						<p class="text-2xl font-bold text-gray-900">{memorials.filter(m => m.livestreamEnabled).length}</p>
						<p class="text-sm text-gray-600">Live Ready</p>
					</div>
				</div>
			</div>
			
			<div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
						<Users class="w-5 h-5 text-blue-600" />
					</div>
					<div>
						<p class="text-2xl font-bold text-gray-900">{memorials.reduce((sum, m) => sum + (m.familyMemberCount || 0), 0)}</p>
						<p class="text-sm text-gray-600">Family Members</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="mb-8">
		<h2 class="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<a 
				href="/app/calculator"
				class="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
			>
				<div class="flex items-center space-x-3 mb-3">
					<Plus class="w-6 h-6" />
					<h3 class="text-lg font-semibold">Create Memorial</h3>
				</div>
				<p class="text-green-100">Set up a new memorial service with livestream</p>
			</a>
			
			<a 
				href="/app/calculator"
				class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
			>
				<div class="flex items-center space-x-3 mb-3">
					<Calendar class="w-6 h-6" />
					<h3 class="text-lg font-semibold">Manage Schedule</h3>
				</div>
				<p class="text-purple-100">Update service times and livestream schedule</p>
			</a>
			
			<a 
				href="#livestream-section"
				class="bg-gradient-to-r from-red-500 to-pink-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
				onclick={() => document.getElementById('livestream-section')?.scrollIntoView({behavior: 'smooth'})}
			>
				<div class="flex items-center space-x-3 mb-3">
					<Video class="w-6 h-6" />
					<h3 class="text-lg font-semibold">Livestream Control</h3>
				</div>
				<p class="text-red-100">Start or manage livestreams for your memorials</p>
			</a>
		</div>
	</div>

	<!-- Assigned Memorials -->
	<div class="mb-8">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-semibold text-gray-900">Assigned Memorials</h2>
			<span class="text-sm text-gray-500">{memorials.length} total</span>
		</div>

		{#if memorials && memorials.length > 0}
			<div class="grid gap-4">
				{#each memorials as memorial}
					<div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-4">
								<div class="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
									<span class="text-white font-bold text-lg">
										{memorial.lovedOneName?.charAt(0) || 'M'}
									</span>
								</div>
								<div>
									<h3 class="text-lg font-semibold text-gray-900">{memorial.lovedOneName}</h3>
									<div class="flex items-center space-x-4 text-sm text-gray-500">
										<span class="flex items-center">
											<Calendar class="w-4 h-4 mr-1" />
											{memorial.serviceDate ? new Date(memorial.serviceDate).toLocaleDateString() : 'Not scheduled'}
										</span>
										{#if memorial.livestreamEnabled}
											<span class="flex items-center text-green-600">
												<Video class="w-4 h-4 mr-1" />
												Live Ready
											</span>
										{/if}
									</div>
								</div>
							</div>
							
							<div class="flex space-x-2">
								<a 
									href="/my-portal/tributes/{memorial.id}/edit"
									class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
								>
									<Camera class="w-4 h-4" />
									<span>Manage</span>
								</a>
								
								{#if memorial.serviceDate}
									<button class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1">
										<Calendar class="w-4 h-4" />
										<span>Schedule</span>
									</button>
								{/if}
								
								{#if memorial.livestreamEnabled}
									<button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1">
										<Video class="w-4 h-4" />
										<span>Go Live</span>
									</button>
								{:else}
									<button class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
										Setup Stream
									</button>
								{/if}
								
								<a 
									href="/tributes/{memorial.slug}"
									class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
								>
									View
								</a>
							</div>
						</div>
						
						<!-- Memorial Details -->
						<div class="mt-4 pt-4 border-t border-gray-100">
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
								<div>
									<span class="text-gray-500">Family Contact:</span>
									<p class="font-medium text-gray-900">{memorial.familyContactEmail || 'Not provided'}</p>
								</div>
								<div>
									<span class="text-gray-500">Created:</span>
									<p class="font-medium text-gray-900">{new Date(memorial.createdAt).toLocaleDateString()}</p>
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
			<div class="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
				<div class="text-gray-400 text-6xl mb-4">🏛️</div>
				<h3 class="text-lg font-medium text-gray-900 mb-2">No Assigned Memorials</h3>
				<p class="text-gray-600 mb-6">You don't have any memorials assigned to you yet. Create a new memorial to get started.</p>
				<a 
					href="/funeral-director/create-memorial"
					class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
				>
					<Plus class="w-5 h-5 mr-2" />
					Create First Memorial
				</a>
			</div>
		{/if}
	</div>

	<!-- Support Section -->
	<div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 p-6">
		<div class="flex items-center space-x-3 mb-4">
			<Phone class="w-6 h-6 text-purple-600" />
			<h3 class="text-lg font-semibold text-gray-900">Need Support?</h3>
		</div>
		<p class="text-gray-600 mb-4">
			Our technical support team is available to help you with livestreaming, memorial setup, and family coordination.
		</p>
		<div class="flex space-x-4">
			<a 
				href="tel:+1-800-TRIBUTE"
				class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
			>
				Call Support
			</a>
			<a 
				href="/funeral-director/help"
				class="px-4 py-2 bg-white text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
			>
				Help Center
			</a>
		</div>
	</div>

	<!-- Livestream Management Section -->
	<div id="livestream-section" class="mb-8">
		<h2 class="text-xl font-semibold text-gray-900 mb-6">Livestream Management</h2>
		
		{#if memorials.length > 0}
			<div class="space-y-6">
				{#each memorials as memorial}
					<div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
						<div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
							<div class="flex items-center justify-between">
								<div>
									<h3 class="text-lg font-semibold text-gray-900">{memorial.lovedOneName}</h3>
									<p class="text-sm text-gray-600">
										Service: {memorial.serviceDate ? new Date(memorial.serviceDate).toLocaleDateString() : 'Date TBD'}
										{#if memorial.serviceTime}
											at {memorial.serviceTime}
										{/if}
									</p>
								</div>
								<div class="flex items-center space-x-2">
									<a 
										href="/my-portal/tributes/{memorial.id}/edit"
										class="text-blue-600 hover:text-blue-700 text-sm font-medium"
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
			<div class="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
				<div class="text-gray-400 text-6xl mb-4">📺</div>
				<h3 class="text-lg font-medium text-gray-900 mb-2">No Assigned Memorials</h3>
				<p class="text-gray-600 mb-6">You don't have any memorials assigned to you yet. Contact your administrator to get started.</p>
				<a 
					href="/app/calculator"
					class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
				>
					<Plus class="w-5 h-5 mr-2" />
					Create Memorial
				</a>
			</div>
		{/if}
	</div>

	<!-- Logout Button -->
	<div class="mt-12 text-center">
		<form method="POST" action="?/logout">
			<button type="submit" class="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors">
				Log Out
			</button>
		</form>
	</div>
</div>