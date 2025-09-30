<script lang="ts">
	let { lovedOneName }: { lovedOneName: string } = $props();
</script>

<div class="placeholder-video-container">
	<h2 class="video-title">Celebration of Life for {lovedOneName}</h2>
	
	<div class="video-placeholder">
		<div class="play-icon">
			<svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M8 5V19L19 12L8 5Z" fill="white"/>
			</svg>
		</div>
	</div>
</div>

<style>
	.placeholder-video-container {
		background-color: black;
		padding: 2rem;
		text-align: center;
	}

	.video-title {
		color: white;
		font-family: 'Fanwood', serif;
		font-style: italic;
		font-size: 42px;
		margin: 0 0 2rem 0;
	}

	.video-placeholder {
		width: 33.33vw;
		height: 33.33vh;
		background-color: #333;
		border: 2px solid #555;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		cursor: pointer;
		margin: 0 auto;
	}

	.play-icon {
		opacity: 0.8;
		transition: opacity 0.3s ease;
	}

	.video-placeholder:hover .play-icon {
		opacity: 1;
	}
</style>
