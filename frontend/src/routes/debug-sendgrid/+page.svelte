<script lang="ts">
	import { onMount } from 'svelte';
	
	let configData: any = null;
	let testResult: any = null;
	let loading = false;
	let testEmail = 'test@example.com';
	let lovedOneName = 'John Doe';

	async function loadConfig() {
		try {
			const response = await fetch('/api/debug-sendgrid');
			configData = await response.json();
		} catch (error) {
			console.error('Failed to load config:', error);
		}
	}

	async function testSendGrid() {
		loading = true;
		testResult = null;
		
		try {
			const response = await fetch('/api/test-sendgrid', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					testEmail,
					lovedOneName,
					password: 'TestPassword123!'
				})
			});
			
			testResult = await response.json();
		} catch (error) {
			testResult = {
				error: 'Request failed',
				details: error instanceof Error ? error.message : 'Unknown error'
			};
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadConfig();
	});
</script>

<div class="max-w-4xl mx-auto p-6">
	<h1 class="text-3xl font-bold mb-6">SendGrid Debug Dashboard</h1>
	
	<!-- Configuration Section -->
	<div class="bg-white shadow rounded-lg p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Configuration Status</h2>
		
		{#if configData}
			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<strong>API Key:</strong> 
						{configData.configuration.apiKeyConfigured ? '✅ Configured' : '❌ Missing'}
						{#if configData.configuration.apiKeyLength}
							<span class="text-sm text-gray-600">({configData.configuration.apiKeyLength} chars)</span>
						{/if}
					</div>
					<div>
						<strong>From Email:</strong> 
						{configData.configuration.fromEmail || '❌ Not set'}
					</div>
				</div>
				
				<div>
					<strong>Template Validation:</strong>
					{configData.configuration.templateValidation.valid ? '✅ All Valid' : '❌ Issues Found'}
					{#if !configData.configuration.templateValidation.valid}
						<div class="text-red-600 text-sm mt-1">
							Missing: {configData.configuration.templateValidation.missing.join(', ')}
						</div>
					{/if}
				</div>
				
				<div>
					<h3 class="font-semibold mb-2">Template IDs:</h3>
					<div class="grid grid-cols-1 gap-2 text-sm">
						{#each configData.configuration.templateIds as template}
							<div class="flex justify-between items-center p-2 bg-gray-50 rounded">
								<span class="font-mono">{template.name}:</span>
								<span class="font-mono text-xs {template.isConfigured ? 'text-green-600' : 'text-red-600'}">
									{template.id} {template.isConfigured ? '✅' : '❌'}
								</span>
							</div>
						{/each}
					</div>
				</div>
				
				{#if configData.recommendations.length > 0}
					<div class="bg-yellow-50 border border-yellow-200 rounded p-4">
						<h3 class="font-semibold text-yellow-800 mb-2">Recommendations:</h3>
						<ul class="list-disc list-inside text-yellow-700 text-sm">
							{#each configData.recommendations as rec}
								<li>{rec}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{:else}
			<div class="text-gray-500">Loading configuration...</div>
		{/if}
	</div>
	
	<!-- Test Section -->
	<div class="bg-white shadow rounded-lg p-6">
		<h2 class="text-xl font-semibold mb-4">Test Email Sending</h2>
		
		<div class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium mb-1">Test Email:</label>
					<input 
						type="email" 
						bind:value={testEmail}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="test@example.com"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Loved One Name:</label>
					<input 
						type="text" 
						bind:value={lovedOneName}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="John Doe"
					/>
				</div>
			</div>
			
			<button 
				on:click={testSendGrid}
				disabled={loading || !testEmail}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{loading ? 'Sending...' : 'Test Send Email'}
			</button>
		</div>
		
		{#if testResult}
			<div class="mt-4 p-4 rounded-md {testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
				<h3 class="font-semibold {testResult.success ? 'text-green-800' : 'text-red-800'} mb-2">
					{testResult.success ? '✅ Success' : '❌ Error'}
				</h3>
				<div class="text-sm {testResult.success ? 'text-green-700' : 'text-red-700'}">
					{#if testResult.success}
						<p>{testResult.message}</p>
					{:else}
						<p><strong>Error:</strong> {testResult.error}</p>
						{#if testResult.details}
							<p><strong>Details:</strong> {testResult.details}</p>
						{/if}
					{/if}
					<p class="text-xs mt-2 opacity-75">Timestamp: {testResult.timestamp}</p>
				</div>
			</div>
		{/if}
	</div>
	
	<!-- Instructions -->
	<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
		<h2 class="text-xl font-semibold text-blue-800 mb-4">Troubleshooting Guide</h2>
		<div class="text-blue-700 space-y-2 text-sm">
			<p><strong>If API Key is missing:</strong> Set SENDGRID_API_KEY in your .env file</p>
			<p><strong>If templates are missing:</strong> Set SENDGRID_TEMPLATE_* environment variables</p>
			<p><strong>If you get 400 errors:</strong> Check that template IDs are valid in your SendGrid dashboard</p>
			<p><strong>If you get 401 errors:</strong> Verify your SendGrid API key has send permissions</p>
		</div>
	</div>
</div>

<style>
	/* Add any additional styling here */
</style>
