<script lang="ts">
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
	
	// Extract memorial data from server load
	let memorial = $derived(data.memorial);
	
	// Format date helper
	function formatDate(dateString: string | null): string {
		if (!dateString) return 'Date TBD';
		try {
			return new Date(dateString).toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch {
			return dateString;
		}
	}
	
	// Format time helper
	function formatTime(timeString: string | null): string {
		if (!timeString) return 'Time TBD';
		try {
			return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			});
		} catch {
			return timeString;
		}
	}
</script>

<svelte:head>
	<title>{memorial?.lovedOneName ? `${memorial.lovedOneName} - Memorial` : 'Memorial'}</title>
	<meta name="description" content={memorial?.content || 'Memorial service information'} />
</svelte:head>

<div class="memorial-page">
	{#if memorial}
		<!-- Memorial Header -->
		<div class="memorial-header">
			{#if memorial.imageUrl}
				<div class="memorial-image">
					<img src={memorial.imageUrl} alt={memorial.lovedOneName} />
				</div>
			{/if}
			<div class="memorial-content">
				<h1>{memorial.lovedOneName}</h1>
				{#if memorial.birthDate || memorial.deathDate}
					<div class="dates">
						{#if memorial.birthDate}
							<span>{formatDate(memorial.birthDate)}</span>
						{/if}
						{#if memorial.birthDate && memorial.deathDate}
							<span> - </span>
						{/if}
						{#if memorial.deathDate}
							<span>{formatDate(memorial.deathDate)}</span>
						{/if}
					</div>
				{/if}
				{#if memorial.content}
					<div class="memorial-description">
						{@html memorial.content}
					</div>
				{/if}
			</div>
		</div>

		<!-- Service Information -->
		{#if memorial.services}
			<div class="service-info">
				<h2>Service Information</h2>
				
				{#if memorial.services.main}
					<div class="main-service">
						<h3>Memorial Service</h3>
						<div class="service-details">
							{#if memorial.services.main.time && !memorial.services.main.time.isUnknown}
								<p><strong>Date:</strong> {formatDate(memorial.services.main.time.date)}</p>
								<p><strong>Time:</strong> {formatTime(memorial.services.main.time.time)}</p>
							{:else}
								<p><strong>Date & Time:</strong> To be announced</p>
							{/if}
							
							{#if memorial.services.main.location && !memorial.services.main.location.isUnknown}
								<p><strong>Location:</strong> {memorial.services.main.location.name}</p>
								{#if memorial.services.main.location.address}
									<p><strong>Address:</strong> {memorial.services.main.location.address}</p>
								{/if}
							{:else}
								<p><strong>Location:</strong> To be announced</p>
							{/if}
							
							{#if memorial.services.main.hours}
								<p><strong>Duration:</strong> {memorial.services.main.hours} hour{memorial.services.main.hours !== 1 ? 's' : ''}</p>
							{/if}
						</div>
					</div>
				{/if}

				{#if memorial.services.additional && memorial.services.additional.length > 0}
					<div class="additional-services">
						<h3>Additional Services</h3>
						{#each memorial.services.additional as service, index}
							{#if service.enabled}
								<div class="additional-service">
									<h4>Additional Service {index + 1}</h4>
									<div class="service-details">
										{#if service.time && !service.time.isUnknown}
											<p><strong>Date:</strong> {formatDate(service.time.date)}</p>
											<p><strong>Time:</strong> {formatTime(service.time.time)}</p>
										{:else}
											<p><strong>Date & Time:</strong> To be announced</p>
										{/if}
										
										{#if service.location && !service.location.isUnknown}
											<p><strong>Location:</strong> {service.location.name}</p>
											{#if service.location.address}
												<p><strong>Address:</strong> {service.location.address}</p>
											{/if}
										{:else}
											<p><strong>Location:</strong> To be announced</p>
										{/if}
										
										{#if service.hours}
											<p><strong>Duration:</strong> {service.hours} hour{service.hours !== 1 ? 's' : ''}</p>
										{/if}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Contact Information -->
		{#if memorial.familyContactName || memorial.familyContactEmail || memorial.familyContactPhone}
			<div class="contact-info">
				<h2>Contact Information</h2>
				<div class="contact-details">
					{#if memorial.familyContactName}
						<p><strong>Family Contact:</strong> {memorial.familyContactName}</p>
					{/if}
					{#if memorial.familyContactEmail}
						<p><strong>Email:</strong> <a href="mailto:{memorial.familyContactEmail}">{memorial.familyContactEmail}</a></p>
					{/if}
					{#if memorial.familyContactPhone}
						<p><strong>Phone:</strong> <a href="tel:{memorial.familyContactPhone}">{memorial.familyContactPhone}</a></p>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Funeral Home Information -->
		{#if memorial.funeralHomeName || memorial.directorFullName}
			<div class="funeral-home-info">
				<h2>Funeral Home</h2>
				<div class="funeral-details">
					{#if memorial.funeralHomeName}
						<p><strong>Funeral Home:</strong> {memorial.funeralHomeName}</p>
					{/if}
					{#if memorial.directorFullName}
						<p><strong>Funeral Director:</strong> {memorial.directorFullName}</p>
					{/if}
					{#if memorial.directorEmail}
						<p><strong>Director Email:</strong> <a href="mailto:{memorial.directorEmail}">{memorial.directorEmail}</a></p>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Additional Notes -->
		{#if memorial.additionalNotes}
			<div class="additional-notes">
				<h2>Additional Information</h2>
				<div class="notes-content">
					{@html memorial.additionalNotes}
				</div>
			</div>
		{/if}

		<!-- Photos -->
		{#if memorial.photos && memorial.photos.length > 0}
			<div class="photos-section">
				<h2>Photos</h2>
				<div class="photos-grid">
					{#each memorial.photos as photo}
						<div class="photo-item">
							<img src={photo} alt="Memorial photo" />
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Embeds -->
		{#if memorial.embeds && memorial.embeds.length > 0}
			<div class="embeds-section">
				<h2>Videos</h2>
				<div class="embeds-grid">
					{#each memorial.embeds as embed}
						<div class="embed-item">
							<h3>{embed.title}</h3>
							<iframe 
								src={embed.embedUrl} 
								title={embed.title}
								frameborder="0" 
								allowfullscreen>
							</iframe>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<div class="loading">
			<p>Loading memorial information...</p>
		</div>
	{/if}
</div>

<style>
	.memorial-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.memorial-header {
		text-align: center;
		margin-bottom: 3rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid #e9ecef;
	}

	.memorial-image {
		margin-bottom: 1.5rem;
	}

	.memorial-image img {
		width: 200px;
		height: 200px;
		object-fit: cover;
		border-radius: 50%;
		border: 4px solid #f8f9fa;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.memorial-header h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		color: #333;
		font-weight: 300;
	}

	.dates {
		font-size: 1.1rem;
		color: #666;
		margin-bottom: 1rem;
		font-style: italic;
	}

	.memorial-description {
		font-size: 1.1rem;
		line-height: 1.6;
		color: #555;
		max-width: 600px;
		margin: 0 auto;
	}

	.service-info, .contact-info, .funeral-home-info, .additional-notes, .photos-section, .embeds-section {
		background: #f8f9fa;
		padding: 2rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.service-info h2, .contact-info h2, .funeral-home-info h2, .additional-notes h2, .photos-section h2, .embeds-section h2 {
		margin-bottom: 1.5rem;
		color: #333;
		font-size: 1.5rem;
		font-weight: 400;
	}

	.main-service, .additional-services {
		margin-bottom: 1.5rem;
	}

	.main-service h3, .additional-services h3 {
		margin-bottom: 1rem;
		color: #555;
		font-size: 1.2rem;
	}

	.additional-service {
		background: white;
		padding: 1.5rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		border: 1px solid #e9ecef;
	}

	.additional-service h4 {
		margin-bottom: 1rem;
		color: #666;
		font-size: 1.1rem;
	}

	.service-details p, .contact-details p, .funeral-details p {
		margin: 0.5rem 0;
		line-height: 1.5;
	}

	.service-details strong, .contact-details strong, .funeral-details strong {
		color: #333;
	}

	.contact-details a, .funeral-details a {
		color: #007bff;
		text-decoration: none;
	}

	.contact-details a:hover, .funeral-details a:hover {
		text-decoration: underline;
	}

	.notes-content {
		line-height: 1.6;
		color: #555;
	}

	.photos-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.photo-item img {
		width: 100%;
		height: 200px;
		object-fit: cover;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.embeds-grid {
		display: grid;
		gap: 2rem;
	}

	.embed-item h3 {
		margin-bottom: 1rem;
		color: #555;
	}

	.embed-item iframe {
		width: 100%;
		height: 315px;
		border-radius: 8px;
	}

	.loading {
		text-align: center;
		padding: 4rem 2rem;
		color: #666;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.memorial-page {
			padding: 1rem;
		}

		.memorial-header h1 {
			font-size: 2rem;
		}

		.service-info, .contact-info, .funeral-home-info, .additional-notes, .photos-section, .embeds-section {
			padding: 1.5rem;
		}

		.photos-grid {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		}

		.embed-item iframe {
			height: 250px;
		}
	}
</style>
