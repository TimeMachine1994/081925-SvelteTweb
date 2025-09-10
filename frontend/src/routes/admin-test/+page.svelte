<script lang="ts">
	import type { PageData } from './$types';
	
	export let data: PageData;
</script>

<div class="container mx-auto p-6">
	<h1 class="text-3xl font-bold mb-6">Admin Test Page</h1>
	
	<div class="bg-white rounded-lg shadow-lg p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">User Information</h2>
		<div class="space-y-2">
			<p><strong>Email:</strong> {data.user.email}</p>
			<p><strong>UID:</strong> {data.user.uid}</p>
			<p><strong>Role:</strong> {data.user.role}</p>
			<p><strong>Admin Flag:</strong> {data.user.admin}</p>
		</div>
	</div>

	<div class="bg-white rounded-lg shadow-lg p-6">
		<h2 class="text-xl font-semibold mb-4">Test Results</h2>
		
		{#if data.testResults.error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
				<strong>Error:</strong> {data.testResults.error}
				<br>
				<strong>Type:</strong> {data.testResults.errorType}
			</div>
		{:else}
			<div class="space-y-3">
				<div class="flex items-center space-x-2">
					<span class="text-green-500">✅</span>
					<span>Firestore Connection: {data.testResults.firestoreConnection ? 'Success' : 'Failed'}</span>
				</div>
				
				{#if data.testResults.memorialCount !== undefined}
					<div class="flex items-center space-x-2">
						<span class="text-green-500">✅</span>
						<span>Memorial Count: {data.testResults.memorialCount}</span>
					</div>
				{/if}
				
				{#if data.testResults.userCount !== undefined}
					<div class="flex items-center space-x-2">
						<span class="text-green-500">✅</span>
						<span>User Count: {data.testResults.userCount}</span>
					</div>
				{/if}
				
				{#if data.testResults.sampleMemorialLoaded !== undefined}
					<div class="flex items-center space-x-2">
						<span class="text-green-500">✅</span>
						<span>Sample Memorial Loaded: {data.testResults.sampleMemorialLoaded ? 'Yes' : 'No'}</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>
	
	<div class="mt-6">
		<a href="/admin" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4">
			Try Admin Dashboard
		</a>
		<a href="/profile" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
			Back to Profile
		</a>
	</div>
</div>
