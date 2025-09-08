<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { User, Mail, Edit3, LogOut, Heart, Calendar, Users, Crown, Building2, Video, Settings, Sparkles, Clock } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let { data, form } = $props();
	let displayName = $state(data.profile?.displayName || '');
	let isEditing = $state(false);
	let showScheduleModal = $state(false);
	let selectedMemorial = $state(null);
	let scheduleForm = $state({
		serviceDate: '',
		serviceTime: '',
		duration: 2,
		location: {
			name: '',
			address: '',
			isUnknown: false
		},
		timeIsUnknown: false
	});
	let mounted = $state(false);

	// Get user role from locals or profile data
	const userRole = data.user?.role || 'owner';

	onMount(() => {
		mounted = true;
	});

	function getRoleInfo(role: string) {
		switch (role) {
			case 'funeral_director':
				return {
					title: 'Funeral Director',
					icon: Building2,
					gradient: 'from-purple-600 via-blue-600 to-cyan-600',
					bgGradient: 'from-purple-50 to-blue-50',
					accentColor: 'purple'
				};
			case 'owner':
				return {
					title: 'Memorial Owner',
					icon: Crown,
					gradient: 'from-amber-500 via-orange-500 to-red-500',
					bgGradient: 'from-amber-50 to-orange-50',
					accentColor: 'amber'
				};
			default:
				return {
					title: 'User',
					icon: User,
					gradient: 'from-gray-600 to-gray-800',
					bgGradient: 'from-gray-50 to-gray-100',
					accentColor: 'gray'
				};
		}
	}

	const roleInfo = getRoleInfo(userRole);

	function openScheduleModal(memorial: any) {
		selectedMemorial = memorial;
		// Pre-fill with existing data if available
		scheduleForm.serviceDate = memorial.serviceDate ? new Date(memorial.serviceDate).toISOString().split('T')[0] : '';
		scheduleForm.serviceTime = memorial.serviceTime || '';
		scheduleForm.duration = memorial.duration || 2;
		scheduleForm.location.name = memorial.location?.name || '';
		scheduleForm.location.address = memorial.location?.address || '';
		scheduleForm.location.isUnknown = memorial.location?.isUnknown || false;
		scheduleForm.timeIsUnknown = memorial.timeIsUnknown || false;
		showScheduleModal = true;
	}

	async function updateSchedule() {
		if (!selectedMemorial) return;

		try {
			const response = await fetch(`/api/memorials/${selectedMemorial.id}/schedule`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(scheduleForm)
			});

			if (response.ok) {
				showScheduleModal = false;
				// Refresh the page to show updated data
				location.reload();
			} else {
				const error = await response.json();
				alert('Error updating schedule: ' + error.message);
			}
		} catch (err) {
			alert('Network error occurred');
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br {roleInfo.bgGradient} relative overflow-hidden">
	<!-- Animated background elements -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
		<div class="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-white/5 to-transparent rounded-full blur-2xl animate-spin" style="animation-duration: 20s;"></div>
	</div>

	<div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		{#if data.profile}
			<!-- Header Section -->
			<div class="text-center mb-12 {mounted ? 'animate-fade-in-up' : 'opacity-0'}" style="animation-delay: 0.1s;">
				<div class="relative inline-block mb-6">
					<div class="w-32 h-32 mx-auto rounded-full bg-gradient-to-r {roleInfo.gradient} p-1 shadow-2xl">
						<div class="w-full h-full rounded-full bg-white flex items-center justify-center">
							{@render roleInfo.icon({ class: "w-16 h-16 text-gray-700" })}
						</div>
					</div>
					<div class="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r {roleInfo.gradient} rounded-full flex items-center justify-center shadow-lg">
						<Sparkles class="w-4 h-4 text-white" />
					</div>
				</div>
				
				<h1 class="text-4xl font-bold text-gray-900 mb-2">
					{displayName || 'Welcome'}
				</h1>
				<div class="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r {roleInfo.gradient} text-white font-medium shadow-lg">
					{@render roleInfo.icon({ class: "w-4 h-4 mr-2" })}
					{roleInfo.title}
				</div>
			</div>

			<!-- Main Content Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				
				<!-- Profile Info Card -->
				<div class="lg:col-span-1 {mounted ? 'animate-fade-in-up' : 'opacity-0'}" style="animation-delay: 0.2s;">
					<div class="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 hover:shadow-3xl transition-all duration-500 hover:scale-105">
						<div class="flex items-center justify-between mb-6">
							<h2 class="text-2xl font-bold text-gray-900 flex items-center">
								<User class="w-6 h-6 mr-3 text-{roleInfo.accentColor}-600" />
								Profile
							</h2>
							<button
								onclick={() => isEditing = !isEditing}
								class="p-2 rounded-full bg-{roleInfo.accentColor}-100 text-{roleInfo.accentColor}-600 hover:bg-{roleInfo.accentColor}-200 transition-colors"
							>
								<Edit3 class="w-4 h-4" />
							</button>
						</div>

						<div class="space-y-6">
							<div class="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100">
								<Mail class="w-5 h-5 text-gray-500" />
								<div>
									<p class="text-sm text-gray-500 font-medium">Email</p>
									<p class="text-gray-900 font-semibold">{data.profile.email}</p>
								</div>
							</div>

							{#if isEditing}
								<form method="POST" action="?/updateProfile" use:enhance class="space-y-4">
									<div class="space-y-2">
										<label for="displayName" class="block text-sm font-medium text-gray-700">Display Name</label>
										<input
											type="text"
											id="displayName"
											name="displayName"
											bind:value={displayName}
											class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-{roleInfo.accentColor}-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
											placeholder="Enter your display name"
										/>
									</div>
									<div class="flex space-x-3">
										<button
											type="submit"
											class="flex-1 bg-gradient-to-r {roleInfo.gradient} text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
										>
											Save Changes
										</button>
										<button
											type="button"
											onclick={() => isEditing = false}
											class="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
										>
											Cancel
										</button>
									</div>
								</form>
							{:else}
								<div class="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-{roleInfo.accentColor}-50 to-white border border-{roleInfo.accentColor}-100">
									<User class="w-5 h-5 text-{roleInfo.accentColor}-600" />
									<div>
										<p class="text-sm text-{roleInfo.accentColor}-600 font-medium">Display Name</p>
										<p class="text-gray-900 font-semibold">{displayName || 'Not set'}</p>
									</div>
								</div>
							{/if}

							{#if form?.message}
								<div class="p-4 rounded-xl bg-green-50 border border-green-200">
									<p class="text-green-800 font-medium">{form.message}</p>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Memorials/Dashboard Card -->
				<div class="lg:col-span-2 {mounted ? 'animate-fade-in-up' : 'opacity-0'}" style="animation-delay: 0.3s;">
					<div class="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 hover:shadow-3xl transition-all duration-500">
						<div class="flex items-center justify-between mb-8">
							<h2 class="text-2xl font-bold text-gray-900 flex items-center">
								<Heart class="w-6 h-6 mr-3 text-{roleInfo.accentColor}-600" />
								{userRole === 'funeral_director' ? 'Managed Memorials' : 'Your Memorials'}
							</h2>
							<div class="flex items-center space-x-2">
								<span class="px-3 py-1 rounded-full bg-{roleInfo.accentColor}-100 text-{roleInfo.accentColor}-800 text-sm font-medium">
									{data.memorials?.length || 0} Total
								</span>
							</div>
						</div>

						{#if data.memorials && data.memorials.length > 0}
							<div class="grid gap-4">
								{#each data.memorials as memorial, index}
									<div 
										class="group p-6 rounded-2xl bg-gradient-to-r from-white/80 to-white/60 border border-white/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] {mounted ? 'animate-fade-in-up' : 'opacity-0'}"
										style="animation-delay: {0.4 + index * 0.1}s;"
									>
										<div class="flex items-center justify-between">
											<div class="flex items-center space-x-4">
												<div class="w-12 h-12 rounded-full bg-gradient-to-r {roleInfo.gradient} flex items-center justify-center shadow-lg">
													<span class="text-white font-bold text-lg">
														{memorial.lovedOneName?.charAt(0) || memorial.title?.charAt(0) || 'M'}
													</span>
												</div>
												<div>
													<h3 class="font-bold text-gray-900 group-hover:text-{roleInfo.accentColor}-600 transition-colors">
														{memorial.lovedOneName || memorial.title}
													</h3>
													<div class="flex items-center space-x-4 text-sm text-gray-500">
														<span class="flex items-center">
															<Calendar class="w-4 h-4 mr-1" />
															{new Date(memorial.createdAt).toLocaleDateString()}
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
											<div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
												<a
													href="/schedule"
													class="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center"
												>
													<Clock class="w-3 h-3 mr-1" />
													Schedule
												</a>
												<a 
													href="/tributes/{memorial.slug}"
													class="px-4 py-2 rounded-xl bg-gradient-to-r {roleInfo.gradient} text-white font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
												>
													View
												</a>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-center py-12">
								<div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-r {roleInfo.gradient} animate-spin mb-4"></div>
								<h3 class="text-xl font-semibold text-gray-900 mb-2">No memorials yet</h3>
								<p class="text-gray-500 mb-6">Create your first memorial to get started</p>
								<a 
									href="/create"
									class="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r {roleInfo.gradient} text-white font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
								>
									<Heart class="w-4 h-4 mr-2" />
									Create Memorial
								</a>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Actions Section -->
			<div class="mt-12 {mounted ? 'animate-fade-in-up' : 'opacity-0'}" style="animation-delay: 0.5s;">
				<div class="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
					<div class="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
						<div class="flex items-center space-x-4">
							<Settings class="w-6 h-6 text-gray-600" />
							<div>
								<h3 class="font-semibold text-gray-900">Account Settings</h3>
								<p class="text-sm text-gray-500">Manage your account and preferences</p>
							</div>
						</div>
						<div class="flex space-x-4">
							{#if userRole === 'funeral_director'}
								<a 
									href="/funeral-director/dashboard"
									class="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
								>
									Director Dashboard
								</a>
							{/if}
							<form method="POST" action="/logout" class="inline">
								<button
									type="submit"
									class="flex items-center px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-300"
								>
									<LogOut class="w-4 h-4 mr-2" />
									Sign Out
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>

		{:else}
			<div class="flex justify-center items-center min-h-[60vh]">
				<div class="text-center">
					<div class="w-16 h-16 mx-auto rounded-full bg-gradient-to-r {roleInfo.gradient} animate-spin mb-4"></div>
					<p class="text-gray-600 font-medium">Loading your profile...</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Schedule Editing Modal -->
{#if showScheduleModal && selectedMemorial}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-3xl bg-white/90 backdrop-blur-xl">
			<div class="mt-3">
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-xl font-bold text-gray-900 flex items-center">
						<Clock class="w-6 h-6 mr-3 text-blue-600" />
						Edit Schedule
					</h3>
					<button
						onclick={() => showScheduleModal = false}
						class="text-gray-400 hover:text-gray-600 transition-colors"
						aria-label="Close modal"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
				
				<div class="mb-4 p-4 rounded-2xl bg-gradient-to-r {roleInfo.bgGradient} border border-white/20">
					<p class="font-semibold text-gray-900">{selectedMemorial.lovedOneName || selectedMemorial.title}</p>
					<p class="text-sm text-gray-600">Memorial Service Schedule</p>
				</div>
				
				<form onsubmit={(e) => { e.preventDefault(); updateSchedule(); }} class="space-y-6">
					<!-- Date and Time Section -->
					<div class="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
						<h4 class="font-semibold text-gray-900 mb-4 flex items-center">
							<Calendar class="w-4 h-4 mr-2 text-blue-600" />
							Service Date & Time
						</h4>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
							<div>
								<label for="serviceDate" class="block text-sm font-medium text-gray-700 mb-2">Date of Service</label>
								<input
									type="date"
									id="serviceDate"
									bind:value={scheduleForm.serviceDate}
									disabled={scheduleForm.timeIsUnknown}
									class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm disabled:bg-gray-100 disabled:text-gray-500"
								/>
							</div>
							<div>
								<label for="serviceTime" class="block text-sm font-medium text-gray-700 mb-2">Time of Service</label>
								<input
									type="time"
									id="serviceTime"
									bind:value={scheduleForm.serviceTime}
									disabled={scheduleForm.timeIsUnknown}
									class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm disabled:bg-gray-100 disabled:text-gray-500"
								/>
							</div>
							<button
								type="button"
								onclick={() => scheduleForm.timeIsUnknown = !scheduleForm.timeIsUnknown}
								class="px-4 py-3 rounded-xl font-medium transition-all {scheduleForm.timeIsUnknown ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
							>
								Unknown
							</button>
						</div>
					</div>

					<!-- Duration Section -->
					<div class="p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
						<h4 class="font-semibold text-gray-900 mb-4 flex items-center">
							<Clock class="w-4 h-4 mr-2 text-green-600" />
							Service Duration
						</h4>
						<div class="space-y-3">
							<div class="block text-sm font-medium text-gray-700">
								Service Duration: {scheduleForm.duration} {scheduleForm.duration === 1 ? 'hour' : 'hours'}
							</div>
							<div class="relative">
								<input
									type="range"
									bind:value={scheduleForm.duration}
									min="0.5"
									max="8"
									step="0.5"
									class="w-full h-3 bg-gradient-to-r from-purple-200 to-blue-200 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-purple-500"
									style="background: linear-gradient(to right, #a855f7 0%, #3b82f6 {(scheduleForm.duration - 0.5) / 7.5 * 100}%, #e5e7eb {(scheduleForm.duration - 0.5) / 7.5 * 100}%, #e5e7eb 100%)"
								/>
								<div class="flex justify-between text-xs text-gray-500 mt-1">
									<span>30 min</span>
									<span>4 hrs</span>
									<span>8 hrs</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Location Section -->
					<div class="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
						<h4 class="font-semibold text-gray-900 mb-4 flex items-center">
							<Building2 class="w-4 h-4 mr-2 text-purple-600" />
							Service Location
						</h4>
						<div class="space-y-4">
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
								<div class="md:col-span-2">
									<label for="locationName" class="block text-sm font-medium text-gray-700 mb-2">Location Name</label>
									<input
										type="text"
										id="locationName"
										bind:value={scheduleForm.location.name}
										disabled={scheduleForm.location.isUnknown}
										placeholder="e.g., St. Mary's Church"
										class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm disabled:bg-gray-100 disabled:text-gray-500"
									/>
								</div>
								<button
									type="button"
									onclick={() => scheduleForm.location.isUnknown = !scheduleForm.location.isUnknown}
									class="px-4 py-3 rounded-xl font-medium transition-all {scheduleForm.location.isUnknown ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
								>
									Unknown
								</button>
							</div>
							<div>
								<label for="locationAddress" class="block text-sm font-medium text-gray-700 mb-2">Location Address</label>
								<input
									type="text"
									id="locationAddress"
									bind:value={scheduleForm.location.address}
									disabled={scheduleForm.location.isUnknown}
									placeholder="123 Main St, Anytown, USA"
									class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm disabled:bg-gray-100 disabled:text-gray-500"
								/>
							</div>
						</div>
					</div>

					<div class="flex justify-end space-x-3 pt-4">
						<button
							type="button"
							onclick={() => showScheduleModal = false}
							class="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
						>
							Update Schedule
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.animate-fade-in-up {
		animation: fade-in-up 0.8s ease-out forwards;
	}
	
	.shadow-3xl {
		box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
	}
</style>