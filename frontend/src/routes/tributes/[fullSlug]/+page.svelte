<script lang="ts">
	import FakeVideoPlayer from '$lib/components/FakeVideoPlayer.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { memorial, user, isOwner, isFollowing: initialIsFollowing } = data;

	let isFollowing = $state(initialIsFollowing);

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
	<header style={memorial.imageUrl ? `background-image: url(${memorial.imageUrl})` : ''}>
		<div class="header-content">
			<h1>Celebration of Life for {memorial.lovedOneName}</h1>
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
				</button>
			{/if}
		</div>
		{#if memorial.birthDate && memorial.deathDate}
			<p>
				{new Date(memorial.birthDate).toLocaleDateString()} - {new Date(
					memorial.deathDate
				).toLocaleDateString()}
			</p>
		{/if}
	</header>

	<main>
		{#if memorial.livestream?.uid}
			<div class="livestream-player">
				<iframe
					src="https://customer-j17w42139d580s8b.cloudflarestream.com/{memorial.livestream.uid}/iframe"
					style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"
					title="Memorial livestream"
					allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
					allowfullscreen={true}
				></iframe>
			</div>
		{:else}
			<div class="livestream-player blank">
				<FakeVideoPlayer />
			</div>
		{/if}

		<!-- Photo gallery removed in V1 - photo upload functionality disabled -->
	</main>
</div>

<style>
	.tribute-page {
		font-family: sans-serif;
	}

	header {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 33vh;
		text-align: center;
		background-color: #333;
		background-size: cover;
		background-position: center center;
		color: white;
		font-family: 'Fanwood Text', serif;
	}

	.header-content {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
	}

	.follow-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.heart {
		width: 32px;
		height: 32px;
		fill: none;
		stroke: white;
		stroke-width: 2;
	}

	.heart.following {
		fill: red;
		stroke: red;
	}

	main {
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

	.livestream-player.blank {
		display: flex;
		justify-content: center;
		align-items: center;
		color: white;
		font-size: 1.5rem;
	}
</style>