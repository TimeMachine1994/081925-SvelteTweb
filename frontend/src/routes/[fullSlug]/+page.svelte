<script lang="ts">
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
	
	// Extract data from server load - using SAME interface as memorials/[id]/streams
	let memorial = $derived(data.memorial);
	let streamsData = $derived(data.streamsData); // MemorialStreamsResponse interface
	
	// Check if we have streams data (IF condition)
	let hasStreams = $derived(streamsData && streamsData.totalStreams > 0);
	
	console.log('📺 [MEMORIAL_PAGE_CLIENT] Loaded data:', {
		memorial: memorial?.lovedOneName,
		hasStreamsData: !!streamsData,
		totalStreams: streamsData?.totalStreams || 0,
		live: streamsData?.liveStreams?.length || 0,
		scheduled: streamsData?.scheduledStreams?.length || 0,
		ready: streamsData?.readyStreams?.length || 0,
		recorded: streamsData?.recordedStreams?.length || 0,
		publicRecorded: streamsData?.publicRecordedStreams?.length || 0
	});
</script>

<svelte:head>
	<title>{memorial?.lovedOneName ? `${memorial.lovedOneName} Memorial` : 'Memorial'}</title>
</svelte:head>

<!-- Memorial Header -->
<div class="memorial-header">
	<h1>{memorial?.lovedOneName || 'Memorial'}</h1>
	{#if memorial?.description}
		<p class="memorial-description">{memorial.description}</p>
	{/if}
	{#if memorial?.isPublic === false}
		<div class="private-notice">
			<p>🔒 This memorial is private and not publicly accessible.</p>
		</div>
	{/if}
</div>

<!-- IF STREAMS EXIST: Show Full JSON Data -->
{#if hasStreams}
	<div class="streams-section">
		<h2>📺 Memorial Services Available</h2>
		<p class="streams-summary">Found {streamsData.totalStreams} stream(s) - displaying full data from unified API</p>
		
		<!-- Full JSON Data Display -->
		<div class="json-data-section">
			<h3>🔍 Complete Streams Data (Same as /memorials/{memorial?.id}/streams)</h3>
			<div class="json-container">
				<pre class="json-display">{JSON.stringify(streamsData, null, 2)}</pre>
			</div>
		</div>
		
		<!-- Stream Categories Summary -->
		<div class="stream-categories">
			<div class="category-grid">
				{#if streamsData.liveStreams?.length > 0}
					<div class="category-card live">
						<h4>🔴 Live Now ({streamsData.liveStreams.length})</h4>
						<ul>
							{#each streamsData.liveStreams as stream}
								<li>{stream.title}</li>
							{/each}
						</ul>
					</div>
				{/if}
				
				{#if streamsData.scheduledStreams?.length > 0}
					<div class="category-card scheduled">
						<h4>📅 Scheduled ({streamsData.scheduledStreams.length})</h4>
						<ul>
							{#each streamsData.scheduledStreams as stream}
								<li>{stream.title}</li>
							{/each}
						</ul>
					</div>
				{/if}
				
				{#if streamsData.readyStreams?.length > 0}
					<div class="category-card ready">
						<h4>⚡ Ready ({streamsData.readyStreams.length})</h4>
						<ul>
							{#each streamsData.readyStreams as stream}
								<li>{stream.title}</li>
							{/each}
						</ul>
					</div>
				{/if}
				
				{#if streamsData.publicRecordedStreams?.length > 0}
					<div class="category-card recorded">
						<h4>📺 Recorded ({streamsData.publicRecordedStreams.length})</h4>
						<ul>
							{#each streamsData.publicRecordedStreams as stream}
								<li>{stream.title}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<!-- ELSE: Show No Data Notice (only when there really is no data) -->
	<div class="no-streams">
		<p>No public memorial services are currently available.</p>
		{#if memorial?.isPublic === false}
			<p class="private-note">This memorial is private.</p>
		{/if}
	</div>
{/if}

<!-- Memorial Information -->
{#if memorial}
	<div class="memorial-info">
		<h2>Memorial Information</h2>
		
		{#if memorial.services?.main}
			<div class="service-details">
				<h3>Service Details</h3>
				{#if memorial.services.main.location?.name}
					<p><strong>Location:</strong> {memorial.services.main.location.name}</p>
					{#if memorial.services.main.location.address}
						<p><strong>Address:</strong> {memorial.services.main.location.address}</p>
					{/if}
				{/if}
				{#if memorial.services.main.time?.date}
					<p><strong>Date:</strong> {memorial.services.main.time.date}</p>
				{/if}
				{#if memorial.services.main.time?.time}
					<p><strong>Time:</strong> {memorial.services.main.time.time}</p>
				{/if}
			</div>
		{/if}
		
		{#if memorial.services?.additional && memorial.services.additional.length > 0}
			<div class="additional-services">
				<h3>Additional Services</h3>
				{#each memorial.services.additional as service}
					<div class="additional-service">
						{#if service.location?.name}
							<p><strong>Location:</strong> {service.location.name}</p>
						{/if}
						{#if service.time?.date}
							<p><strong>Date:</strong> {service.time.date}</p>
						{/if}
						{#if service.time?.time}
							<p><strong>Time:</strong> {service.time.time}</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.memorial-header {
		text-align: center;
		padding: 2rem 0;
		border-bottom: 1px solid #eee;
		margin-bottom: 2rem;
	}
	
	.memorial-header h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		color: #333;
	}
	
	.memorial-description {
		font-size: 1.1rem;
		color: #666;
		max-width: 600px;
		margin: 0 auto;
	}
	
	.private-notice {
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 6px;
		padding: 1rem;
		margin: 1rem auto;
		max-width: 600px;
		text-align: center;
	}
	
	.private-notice p {
		margin: 0;
		color: #856404;
		font-weight: 500;
	}
	
	.streams-section {
		margin-bottom: 3rem;
	}
	
	.streams-section h2 {
		font-size: 1.8rem;
		margin-bottom: 1rem;
		color: #333;
	}
	
	.streams-summary {
		font-size: 1rem;
		color: #666;
		margin-bottom: 2rem;
		font-style: italic;
	}
	
	.json-data-section {
		margin-bottom: 2rem;
	}
	
	.json-data-section h3 {
		font-size: 1.2rem;
		margin-bottom: 1rem;
		color: #555;
	}
	
	.json-container {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 1rem;
		overflow-x: auto;
		max-height: 400px;
		overflow-y: auto;
	}
	
	.json-display {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.85rem;
		line-height: 1.4;
		margin: 0;
		color: #333;
		white-space: pre-wrap;
		word-break: break-word;
	}
	
	.stream-categories {
		margin-top: 2rem;
	}
	
	.category-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}
	
	.category-card {
		background: #fff;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}
	
	.category-card h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
	}
	
	.category-card ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	
	.category-card li {
		padding: 0.25rem 0;
		font-size: 0.9rem;
		color: #666;
		border-bottom: 1px solid #f0f0f0;
	}
	
	.category-card li:last-child {
		border-bottom: none;
	}
	
	.category-card.live {
		border-left: 4px solid #dc3545;
		background: #fff5f5;
	}
	
	.category-card.scheduled {
		border-left: 4px solid #ffc107;
		background: #fffbf0;
	}
	
	.category-card.ready {
		border-left: 4px solid #17a2b8;
		background: #f0f9ff;
	}
	
	.category-card.recorded {
		border-left: 4px solid #28a745;
		background: #f8fff9;
	}
	
	.stream-category {
		margin-bottom: 2rem;
	}
	
	.stream-category h3 {
		font-size: 1.3rem;
		margin-bottom: 1rem;
		color: #555;
	}
	
	.stream-list {
		list-style: none;
		padding: 0;
	}
	
	.stream-item {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.stream-item.live {
		border-left: 4px solid #dc3545;
		background: #fff5f5;
	}
	
	.stream-item.scheduled {
		border-left: 4px solid #ffc107;
		background: #fffbf0;
	}
	
	.stream-item.recorded {
		border-left: 4px solid #28a745;
		background: #f8fff9;
	}
	
	.stream-title {
		font-weight: 600;
		font-size: 1.1rem;
		color: #333;
	}
	
	.stream-status {
		font-size: 0.8rem;
		font-weight: 600;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		width: fit-content;
	}
	
	.stream-item.live .stream-status {
		background: #dc3545;
		color: white;
	}
	
	.stream-item.recorded .stream-status {
		background: #28a745;
		color: white;
	}
	
	.stream-time {
		font-size: 0.9rem;
		color: #666;
	}
	
	.stream-description {
		font-size: 0.9rem;
		color: #666;
		margin: 0;
		font-style: italic;
	}
	
	.no-streams {
		text-align: center;
		padding: 2rem;
		color: #666;
		font-style: italic;
	}
	
	.private-note {
		color: #856404;
		font-weight: 500;
		margin-top: 0.5rem;
	}
	
	.memorial-info {
		background: #f8f9fa;
		padding: 2rem;
		border-radius: 8px;
		margin-top: 2rem;
	}
	
	.memorial-info h2 {
		margin-bottom: 1.5rem;
		color: #333;
	}
	
	.service-details, .additional-services {
		margin-bottom: 1.5rem;
	}
	
	.service-details h3, .additional-services h3 {
		margin-bottom: 1rem;
		color: #555;
	}
	
	.additional-service {
		background: white;
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 0.5rem;
		border: 1px solid #e9ecef;
	}
	
	.additional-service p {
		margin: 0.25rem 0;
	}
	
	@media (max-width: 768px) {
		.memorial-header h1 {
			font-size: 2rem;
		}
		
		.stream-item {
			padding: 0.75rem;
		}
		
		.memorial-info {
			padding: 1.5rem;
		}
	}
</style>