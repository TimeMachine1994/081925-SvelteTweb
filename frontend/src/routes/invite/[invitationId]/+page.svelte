<script lang="ts">
	import { enhance } from '$app/forms';
	import { Heart, Mail, Calendar, Building2, UserPlus, UserX, LogIn } from 'lucide-svelte';
	
	let { data, form } = $props();
	
	let invitation = $derived(data.invitation);
	let memorial = $derived(data.memorial);
	let user = $derived(data.user);
	let canAccept = $derived(data.canAccept);
</script>

<svelte:head>
	<title>Memorial Invitation - {memorial?.lovedOneName || 'Tributestream'}</title>
	<meta name="description" content="You've been invited to contribute to a memorial" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 relative overflow-hidden">
	<!-- Animated background elements -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
		<div class="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-200/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
	</div>

	<div class="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<div class="text-center mb-12">
			<div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mb-6 shadow-2xl">
				<Mail class="w-12 h-12 text-white" />
			</div>
			<h1 class="text-4xl font-bold text-gray-900 mb-4">Memorial Invitation</h1>
			<p class="text-xl text-gray-600">You've been invited to contribute to a memorial</p>
		</div>

		{#if memorial}
			<!-- Memorial Information Card -->
			<div class="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
				<div class="flex items-center space-x-6 mb-6">
					<div class="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
						<span class="text-white font-bold text-2xl">
							{memorial.lovedOneName?.charAt(0) || 'M'}
						</span>
					</div>
					<div>
						<h2 class="text-3xl font-bold text-gray-900">{memorial.lovedOneName}</h2>
						<p class="text-lg text-gray-600">Memorial Service</p>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					<div class="flex items-center space-x-3 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
						<Calendar class="w-6 h-6 text-purple-600" />
						<div>
							<p class="text-sm font-medium text-purple-600">Created</p>
							<p class="text-gray-900 font-semibold">
								{new Date(memorial.createdAt).toLocaleDateString()}
							</p>
						</div>
					</div>
					<div class="flex items-center space-x-3 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
						<Heart class="w-6 h-6 text-blue-600" />
						<div>
							<p class="text-sm font-medium text-blue-600">Role</p>
							<p class="text-gray-900 font-semibold capitalize">
								{invitation.roleToAssign.replace('_', ' ')}
							</p>
						</div>
					</div>
				</div>

				<div class="p-6 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100">
					<h3 class="text-lg font-semibold text-gray-900 mb-3">What you can do as a {invitation.roleToAssign.replace('_', ' ')}:</h3>
					{#if invitation.roleToAssign === 'family_member'}
						<ul class="space-y-2 text-gray-700">
							<li class="flex items-center space-x-2">
								<div class="w-2 h-2 bg-purple-500 rounded-full"></div>
								<span>Upload and manage your own photos</span>
							</li>
							<li class="flex items-center space-x-2">
								<div class="w-2 h-2 bg-purple-500 rounded-full"></div>
								<span>View memorial content and schedule</span>
							</li>
							<li class="flex items-center space-x-2">
								<div class="w-2 h-2 bg-purple-500 rounded-full"></div>
								<span>Contribute memories and stories</span>
							</li>
						</ul>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Action Cards -->
		{#if canAccept}
			<!-- User can accept/decline -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Accept Card -->
				<div class="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 hover:shadow-3xl transition-all duration-500">
					<div class="text-center mb-6">
						<div class="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
							<UserPlus class="w-8 h-8 text-white" />
						</div>
						<h3 class="text-2xl font-bold text-gray-900 mb-2">Accept Invitation</h3>
						<p class="text-gray-600">Join this memorial and start contributing</p>
					</div>

					<form method="POST" action="?/accept" use:enhance class="space-y-4">
						<button
							type="submit"
							class="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
						>
							Accept & Join Memorial
						</button>
					</form>
				</div>

				<!-- Decline Card -->
				<div class="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 hover:shadow-3xl transition-all duration-500">
					<div class="text-center mb-6">
						<div class="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center mb-4 shadow-lg">
							<UserX class="w-8 h-8 text-white" />
						</div>
						<h3 class="text-2xl font-bold text-gray-900 mb-2">Decline Invitation</h3>
						<p class="text-gray-600">Politely decline this invitation</p>
					</div>

					<form method="POST" action="?/decline" use:enhance class="space-y-4">
						<button
							type="submit"
							class="w-full bg-gradient-to-r from-gray-400 to-gray-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
						>
							No Thank You
						</button>
					</form>
				</div>
			</div>

		{:else if data.needsLogin}
			<!-- User needs to log in -->
			<div class="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
				<div class="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
					<LogIn class="w-8 h-8 text-white" />
				</div>
				<h3 class="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h3>
				<p class="text-gray-600 mb-6">
					To accept this invitation, please sign in with the email address: 
					<span class="font-semibold text-purple-600">{invitation.inviteeEmail}</span>
				</p>
				<a 
					href="/login?redirect=/invite/{invitation.id}"
					class="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
				>
					<LogIn class="w-5 h-5 mr-2" />
					Sign In to Continue
				</a>
			</div>

		{:else if data.emailMismatch}
			<!-- Wrong email address -->
			<div class="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
				<div class="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg">
					<Mail class="w-8 h-8 text-white" />
				</div>
				<h3 class="text-2xl font-bold text-gray-900 mb-4">Email Address Mismatch</h3>
				<p class="text-gray-600 mb-2">
					This invitation is for: <span class="font-semibold text-purple-600">{invitation.inviteeEmail}</span>
				</p>
				<p class="text-gray-600 mb-6">
					You're signed in as: <span class="font-semibold text-blue-600">{user?.email}</span>
				</p>
				<div class="space-y-4">
					<a 
						href="/logout?redirect=/invite/{invitation.id}"
						class="inline-block px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
					>
						Sign Out & Try Again
					</a>
				</div>
			</div>
		{/if}

		<!-- Error Display -->
		{#if form?.error}
			<div class="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6">
				<h4 class="text-lg font-semibold text-red-800 mb-2">Error</h4>
				<p class="text-red-600">{form.error}</p>
			</div>
		{/if}
	</div>
</div>

