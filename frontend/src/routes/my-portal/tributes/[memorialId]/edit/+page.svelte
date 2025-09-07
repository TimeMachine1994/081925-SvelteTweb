<script lang="ts">
	import { enhance } from '$app/forms';
	import { Camera, Upload, Trash2, Shield, Eye, Edit3, Calendar, Video, Clock, MapPin, Users, Settings } from 'lucide-svelte';
	import PhotoUploader from '$lib/components/PhotoUploader.svelte';
	import LivestreamScheduleTable from '$lib/components/ui/LivestreamScheduleTable.svelte';
	import LivestreamControl from '$lib/components/LivestreamControl.svelte';
	
	let { data } = $props();
	
	let memorial = $derived(data.memorial);
	let photos = $derived(data.photos);
	let permissions = $derived(data.permissions);
	let user = $derived(data.user);
</script>

<svelte:head>
	<title>Edit Memorial - {memorial.lovedOneName}</title>
	<meta name="description" content="Manage photos and content for {memorial.lovedOneName}'s memorial" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">{memorial.lovedOneName}</h1>
					<p class="text-lg text-gray-600">Memorial Management</p>
				</div>
				<a 
					href="/my-portal"
					class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
				>
					← Back to Portal
				</a>
			</div>
			
			<!-- Access Info -->
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div class="flex items-center space-x-2">
					<Shield class="w-5 h-5 text-blue-600" />
					<span class="text-blue-800 font-medium">Access Level:</span>
					<span class="text-blue-700">{data.accessReason}</span>
				</div>
			</div>
		</div>

		<!-- Action Tabs/Cards -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
			
			<!-- Photo Management -->
			<div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
				<div class="flex items-center space-x-3 mb-4">
					<div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
						<Camera class="w-5 h-5 text-purple-600" />
					</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900">Photos</h3>
						<p class="text-sm text-gray-600">{photos.length} uploaded</p>
					</div>
				</div>
				
				{#if permissions.canUploadPhotos}
					<div class="space-y-3">
						<button class="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
							<Upload class="w-4 h-4" />
							<span>Upload Photos</span>
						</button>
						{#if permissions.canModeratePhotos}
							<button class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
								<Eye class="w-4 h-4" />
								<span>Moderate Photos</span>
							</button>
						{/if}
					</div>
				{:else}
					<p class="text-sm text-gray-500">You don't have permission to upload photos to this memorial.</p>
				{/if}
			</div>

			<!-- Memorial Content -->
			{#if permissions.canEditMemorial}
				<div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
					<div class="flex items-center space-x-3 mb-4">
						<div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
							<Edit3 class="w-5 h-5 text-green-600" />
						</div>
						<div>
							<h3 class="text-lg font-semibold text-gray-900">Content</h3>
							<p class="text-sm text-gray-600">Edit memorial details</p>
						</div>
					</div>
					
					<div class="space-y-3">
						<button class="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
							Edit Memorial Info
						</button>
						<button class="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
							Manage Tributes
						</button>
					</div>
				</div>
			{/if}

			<!-- Schedule & Livestream -->
			{#if permissions.canManageSchedule}
				<div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
					<div class="flex items-center space-x-3 mb-4">
						<div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
							<Calendar class="w-5 h-5 text-orange-600" />
						</div>
						<div>
							<h3 class="text-lg font-semibold text-gray-900">Schedule</h3>
							<p class="text-sm text-gray-600">Manage service details</p>
						</div>
					</div>
					
					<div class="space-y-3">
						<button class="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2">
							<Calendar class="w-4 h-4" />
							<span>Edit Schedule</span>
						</button>
						{#if permissions.canManageLivestream}
							<button class="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2">
								<Video class="w-4 h-4" />
								<span>Manage Livestream</span>
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Photo Upload Section -->
		{#if permissions.canUploadPhotos}
			<div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
				<h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
					<Upload class="w-6 h-6 text-purple-600" />
					<span>Upload New Photos</span>
				</h2>
				<PhotoUploader memorialId={memorial.id} />
			</div>
		{/if}

		<!-- Livestream Management -->
		<div class="space-y-6">
			<!-- Livestream Control -->
			<LivestreamControl 
				memorialId={memorial.id} 
				memorialName={memorial.lovedOneName}
			/>
			
			<!-- Schedule Table -->
			<div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
				<div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
					<h3 class="text-lg font-medium text-gray-900">Livestream Schedule</h3>
				</div>
				<div class="p-6">
					<LivestreamScheduleTable {memorial} />
				</div>
			</div>
		</div>

		<!-- Photo Gallery -->
		<div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-xl font-semibold text-gray-900 flex items-center space-x-2">
					<Camera class="w-6 h-6 text-blue-600" />
					<span>Photo Gallery</span>
				</h2>
				<span class="text-sm text-gray-500">{photos.length} photos</span>
			</div>

			{#if photos.length > 0}
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{#each photos as photo}
						<div class="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square">
							<!-- Placeholder for photo thumbnail -->
							<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
								<Camera class="w-8 h-8 text-gray-500" />
							</div>
							
							<!-- Photo Info Overlay -->
							<div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-end">
								<div class="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-full">
									<p class="text-xs font-medium truncate">{photo.fileName}</p>
									<p class="text-xs text-gray-300">
										By: {photo.uploadedByRole === 'owner' ? 'Owner' : 
										     photo.uploadedByRole === 'family_member' ? 'Family' : 
										     photo.uploadedByRole === 'funeral_director' ? 'Funeral Director' : 
										     'Admin'}
									</p>
									<p class="text-xs text-gray-300">
										{new Date(photo.uploadedAt.seconds * 1000).toLocaleDateString()}
									</p>
								</div>
							</div>

							<!-- Action Buttons -->
							{#if permissions.canModeratePhotos && photo.uploadedBy !== user.uid}
								<div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
									<button class="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors">
										<Trash2 class="w-3 h-3" />
									</button>
								</div>
							{/if}

							<!-- Approval Status -->
							{#if !photo.approved}
								<div class="absolute top-2 left-2">
									<span class="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
										Pending
									</span>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-12">
					<Camera class="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<h3 class="text-lg font-medium text-gray-900 mb-2">No Photos Yet</h3>
					<p class="text-gray-500 mb-6">
						{#if permissions.canUploadPhotos}
							Upload the first photo to get started.
						{:else}
							Photos will appear here once they're uploaded.
						{/if}
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
