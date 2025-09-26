<script lang="ts">
	import LivestreamPlayer from '$lib/components/LivestreamPlayer.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { memorial, scheduledServices, archiveEntries, user, isOwner, isFollowing: initialFollowing } = data;

	let isFollowing = $state(initialFollowing);

	async function toggleFollow() {
		if (!user) {
			window.location.href = '/login';
			return;
		}

		const method = isFollowing ? 'DELETE' : 'POST';
		const response = await fetch(`/api/memorials/${memorial.id}/follow`, { method });

		if (response.ok) {
			isFollowing = !isFollowing;
		} else {
			alert('Something went wrong. Please try again.');
		}
	}
</script>

<div class="tribute-page">
	<!-- Hero Header Section -->
	<header class="hero-header">
		<div class="hero-overlay"></div>
		<div class="hero-content">
			<div class="memorial-info">
				{#if memorial.imageUrl}
					<div class="memorial-photo">
						<img src={memorial.imageUrl} alt={memorial.lovedOneName} />
					</div>
				{/if}
				<div class="memorial-details">
					<h1 class="memorial-title">Celebrating the Life of</h1>
					<h2 class="loved-one-name">{memorial.lovedOneName}</h2>
					{#if memorial.birthDate && memorial.deathDate}
						<p class="life-dates">
							{new Date(memorial.birthDate).toLocaleDateString()} - {new Date(
								memorial.deathDate
							).toLocaleDateString()}
						</p>
					{/if}
					{#if memorial.services?.main?.location?.name}
						<p class="service-location">
							<svg class="location-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								<circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							{memorial.services.main.location.name}
						</p>
					{/if}
					{#if memorial.services?.main?.time?.date && memorial.services?.main?.time?.time}
						<p class="service-time">
							<svg class="time-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
								<polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							{new Date(memorial.services.main.time.date + 'T' + memorial.services.main.time.time).toLocaleString()}
						</p>
					{/if}
				</div>
			</div>
			{#if user && !isOwner}
				<button onclick={toggleFollow} class="follow-btn" aria-label="Follow memorial">
					<svg
						class="heart {isFollowing ? 'following' : ''}"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
						></path>
					</svg>
					<span class="follow-text">{isFollowing ? 'Following' : 'Follow'}</span>
				</button>
			{/if}
		</div>
	</header>

	<main class="main-content">
		<div class="livestream-player">
			<LivestreamPlayer {memorial} {scheduledServices} {archiveEntries} />
		</div>

		<!-- Photo gallery removed in V1 - photo upload functionality disabled -->
	</main>
</div>

<style>
	.tribute-page {
		font-family: sans-serif;
		margin: 0;
		padding: 0;
		overflow-x: hidden;
	}

	.hero-header {
		position: relative;
		min-height: 60vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background-image: url('https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/Background.jpg?alt=media&token=460aeba9-0879-4e88-b10f-f012dc79c0e6');
		background-size: cover;
		background-position: center center;
		color: white;
		text-align: center;
		margin: 0;
		width: 100vw;
		margin-left: calc(-50vw + 50%);
	}

	.hero-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
	}

	.hero-content {
		position: relative;
		z-index: 2;
		padding: 2rem;
	}

	.memorial-photo {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		overflow: hidden;
		border: 3px solid white;
		margin: 0 auto 1rem;
	}

	.memorial-photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.loved-one-name {
		font-size: 2.5rem;
		font-weight: bold;
		margin: 0.5rem 0;
	}


	.memorial-title {
		font-size: 1.2rem;
		font-weight: 300;
		margin: 0;
		opacity: 0.9;
	}

	.life-dates {
		font-size: 1.1rem;
		margin: 0.5rem 0;
		opacity: 0.9;
	}

	.service-location,
	.service-time {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1rem;
		margin: 0.25rem 0;
		opacity: 0.9;
	}

	.location-icon,
	.time-icon {
		width: 16px;
		height: 16px;
	}

	.follow-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.3);
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 50px;
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
	}

	.follow-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.5);
		transform: translateY(-2px);
	}

	.heart {
		width: 20px;
		height: 20px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		transition: all 0.3s ease;
	}

	.heart.following {
		fill: #ff6b6b;
		stroke: #ff6b6b;
	}

	.follow-text {
		font-weight: 500;
		font-size: 0.9rem;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.hero-header {
			min-height: 50vh;
		}

		.hero-content {
			padding: 1rem;
		}

		.loved-one-name {
			font-size: 2rem;
		}

		.memorial-title {
			font-size: 1rem;
		}

		.memorial-photo {
			width: 100px;
			height: 100px;
		}

		.follow-btn {
			padding: 0.5rem 1rem;
			font-size: 0.85rem;
		}
	}

	.main-content {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.livestream-player {
		position: relative;
		padding-top: 56.25%; /* 16:9 aspect ratio */
		margin-bottom: 2rem;
		background-color: #000;
	}

</style>