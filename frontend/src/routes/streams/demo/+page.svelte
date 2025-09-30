<script lang="ts">
	import { onMount } from 'svelte';
	import UnifiedStreamControl from '$lib/components/UnifiedStreamControl.svelte';
	import { streamAPI } from '$lib/api/streamClient';

	let activeTab = $state('my-streams');
	let migrationStatus = $state(null);
	let migrationLoading = $state(false);

	async function assessMigration() {
		migrationLoading = true;
		try {
			migrationStatus = await streamAPI.assessMigration();
		} catch (error) {
			console.error('Migration assessment failed:', error);
			migrationStatus = { error: error.message };
		} finally {
			migrationLoading = false;
		}
	}

	async function executeMigration(dryRun = true) {
		migrationLoading = true;
		try {
			const result = await streamAPI.executeMigration({
				dryRun,
				migrateFrom: ['mvp_two', 'memorial_archives', 'legacy']
			});
			migrationStatus = { ...migrationStatus, migrationResult: result };
		} catch (error) {
			console.error('Migration failed:', error);
			migrationStatus = { ...migrationStatus, migrationError: error.message };
		} finally {
			migrationLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Unified Livestream System - Demo</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold text-gray-900 mb-4">
				🎬 Unified Livestream System
			</h1>
			<p class="text-xl text-gray-600 max-w-3xl mx-auto">
				Consolidated livestream API with unified stream management, 
				memorial integration, and modern WHIP protocol support.
			</p>
		</div>

		<!-- Features Overview -->
		<div class="grid md:grid-cols-3 gap-6 mb-8">
			<div class="bg-white p-6 rounded-lg shadow-md">
				<div class="text-2xl mb-3">🚀</div>
				<h3 class="text-lg font-semibold mb-2">Unified API</h3>
				<p class="text-gray-600 text-sm">
					Single API replacing 4 fragmented systems with consistent endpoints and data models.
				</p>
			</div>
			
			<div class="bg-white p-6 rounded-lg shadow-md">
				<div class="text-2xl mb-3">🎥</div>
				<h3 class="text-lg font-semibold mb-2">WHIP Protocol</h3>
				<p class="text-gray-600 text-sm">
					Modern WebRTC streaming directly from browsers with automatic recording.
				</p>
			</div>
			
			<div class="bg-white p-6 rounded-lg shadow-md">
				<div class="text-2xl mb-3">🏛️</div>
				<h3 class="text-lg font-semibold mb-2">Memorial Integration</h3>
				<p class="text-gray-600 text-sm">
					Seamless integration with memorial services and archive management.
				</p>
			</div>
		</div>

		<!-- Tab Navigation -->
		<div class="bg-white rounded-lg shadow-md mb-6">
			<div class="border-b border-gray-200">
				<nav class="flex space-x-8 px-6">
					<button 
						onclick={() => activeTab = 'my-streams'}
						class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'my-streams' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						My Streams
					</button>
					
					<button 
						onclick={() => activeTab = 'public-streams'}
						class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'public-streams' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						Public Streams
					</button>
					
					<button 
						onclick={() => activeTab = 'memorial-demo'}
						class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'memorial-demo' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						Memorial Demo
					</button>
					
					<button 
						onclick={() => activeTab = 'migration'}
						class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'migration' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						Migration Tools
					</button>
				</nav>
			</div>

			<div class="p-6">
				{#if activeTab === 'my-streams'}
					<div>
						<h2 class="text-2xl font-bold mb-4">My Streams</h2>
						<p class="text-gray-600 mb-6">
							Create and manage your personal streams. These can be standalone or associated with memorials.
						</p>
						<UnifiedStreamControl showCreateForm={true} />
					</div>

				{:else if activeTab === 'public-streams'}
					<div>
						<h2 class="text-2xl font-bold mb-4">Public Streams</h2>
						<p class="text-gray-600 mb-6">
							Browse publicly available streams from across the platform.
						</p>
						<UnifiedStreamControl showPublicStreams={true} showCreateForm={false} />
					</div>

				{:else if activeTab === 'memorial-demo'}
					<div>
						<h2 class="text-2xl font-bold mb-4">Memorial Stream Demo</h2>
						<p class="text-gray-600 mb-6">
							Example of memorial-specific stream management. Replace with actual memorial ID.
						</p>
						
						<div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
							<p class="text-yellow-800 text-sm">
								<strong>Demo Mode:</strong> This shows how streams would appear for a specific memorial. 
								In production, this would be populated with an actual memorial ID.
							</p>
						</div>
						
						<!-- Example with a placeholder memorial ID -->
						<UnifiedStreamControl memorialId="demo-memorial-123" showCreateForm={true} />
					</div>

				{:else if activeTab === 'migration'}
					<div>
						<h2 class="text-2xl font-bold mb-4">Migration Tools</h2>
						<p class="text-gray-600 mb-6">
							Tools to migrate data from the old fragmented systems to the unified API.
						</p>

						<div class="space-y-6">
							<!-- Assessment -->
							<div class="bg-blue-50 border border-blue-200 rounded-md p-4">
								<h3 class="text-lg font-semibold text-blue-900 mb-2">Migration Assessment</h3>
								<p class="text-blue-800 text-sm mb-4">
									Check how much data exists in the old systems that can be migrated.
								</p>
								
								<button 
									onclick={assessMigration}
									disabled={migrationLoading}
									class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
								>
									{migrationLoading ? 'Assessing...' : 'Assess Migration'}
								</button>

								{#if migrationStatus && !migrationStatus.error}
									<div class="mt-4 p-3 bg-white rounded border">
										<h4 class="font-semibold mb-2">Assessment Results:</h4>
										<div class="grid grid-cols-2 gap-4 text-sm">
											<div>Legacy Streams: <strong>{migrationStatus.legacyStreams}</strong></div>
											<div>MVP Two Streams: <strong>{migrationStatus.mvpTwoStreams}</strong></div>
											<div>Memorial Archives: <strong>{migrationStatus.memorialArchives}</strong></div>
											<div>Livestream Sessions: <strong>{migrationStatus.livestreamSessions}</strong></div>
										</div>
										
										{#if migrationStatus.conflicts?.length > 0}
											<div class="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
												<strong>Conflicts:</strong>
												<ul class="mt-1 text-sm">
													{#each migrationStatus.conflicts as conflict}
														<li>• {conflict.type}: {conflict.details}</li>
													{/each}
												</ul>
											</div>
										{/if}
									</div>
								{/if}
							</div>

							<!-- Migration Execution -->
							{#if migrationStatus && !migrationStatus.error}
								<div class="bg-green-50 border border-green-200 rounded-md p-4">
									<h3 class="text-lg font-semibold text-green-900 mb-2">Execute Migration</h3>
									<p class="text-green-800 text-sm mb-4">
										Run the migration to move data from old systems to the unified API.
									</p>
									
									<div class="flex gap-3">
										<button 
											onclick={() => executeMigration(true)}
											disabled={migrationLoading}
											class="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors"
										>
											{migrationLoading ? 'Running...' : 'Dry Run'}
										</button>
										
										<button 
											onclick={() => executeMigration(false)}
											disabled={migrationLoading}
											class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
										>
											{migrationLoading ? 'Running...' : 'Execute Migration'}
										</button>
									</div>

									{#if migrationStatus.migrationResult}
										<div class="mt-4 p-3 bg-white rounded border">
											<h4 class="font-semibold mb-2">Migration Results:</h4>
											<div class="text-sm">
												<div>Migrated: <strong class="text-green-600">{migrationStatus.migrationResult.migrated}</strong></div>
												<div>Skipped: <strong class="text-yellow-600">{migrationStatus.migrationResult.skipped}</strong></div>
												<div>Errors: <strong class="text-red-600">{migrationStatus.migrationResult.errors?.length || 0}</strong></div>
												
												{#if migrationStatus.migrationResult.dryRun}
													<div class="mt-2 text-blue-600 font-medium">
														This was a dry run - no changes were made.
													</div>
												{/if}
											</div>
										</div>
									{/if}
								</div>
							{/if}

							{#if migrationStatus?.error || migrationStatus?.migrationError}
								<div class="bg-red-50 border border-red-200 rounded-md p-4">
									<h3 class="text-lg font-semibold text-red-900 mb-2">Error</h3>
									<p class="text-red-800 text-sm">
										{migrationStatus.error || migrationStatus.migrationError}
									</p>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- API Documentation -->
		<div class="bg-white rounded-lg shadow-md p-6">
			<h2 class="text-2xl font-bold mb-4">API Documentation</h2>
			
			<div class="grid md:grid-cols-2 gap-6">
				<div>
					<h3 class="text-lg font-semibold mb-3">Core Endpoints</h3>
					<div class="space-y-2 text-sm font-mono bg-gray-50 p-4 rounded">
						<div><span class="text-green-600">GET</span> /api/streams</div>
						<div><span class="text-blue-600">POST</span> /api/streams</div>
						<div><span class="text-green-600">GET</span> /api/streams/[id]</div>
						<div><span class="text-yellow-600">PUT</span> /api/streams/[id]</div>
						<div><span class="text-red-600">DELETE</span> /api/streams/[id]</div>
						<div><span class="text-blue-600">POST</span> /api/streams/[id]/start</div>
						<div><span class="text-blue-600">POST</span> /api/streams/[id]/stop</div>
						<div><span class="text-blue-600">POST</span> /api/streams/[id]/whip</div>
					</div>
				</div>
				
				<div>
					<h3 class="text-lg font-semibold mb-3">Memorial Integration</h3>
					<div class="space-y-2 text-sm font-mono bg-gray-50 p-4 rounded">
						<div><span class="text-green-600">GET</span> /api/memorials/[id]/streams</div>
						<div><span class="text-blue-600">POST</span> /api/memorials/[id]/streams</div>
						<div><span class="text-green-600">GET</span> /api/streams/public</div>
						<div><span class="text-green-600">GET</span> /api/streams/[id]/status</div>
						<div><span class="text-blue-600">POST</span> /api/streams/[id]/recordings</div>
					</div>
				</div>
			</div>

			<div class="mt-6 p-4 bg-blue-50 rounded-md">
				<h4 class="font-semibold text-blue-900 mb-2">JavaScript Client</h4>
				<pre class="text-sm text-blue-800 overflow-x-auto"><code>import { streamAPI } from '$lib/api/streamClient';

// Create and start a stream
const stream = await streamAPI.createStream({
  title: 'My Stream',
  isPublic: true
});

const credentials = await streamAPI.startStream(stream.id);
console.log('WHIP Endpoint:', credentials.whipEndpoint);</code></pre>
			</div>
		</div>
	</div>
</div>
