<script lang="ts">
	import { Clock } from 'lucide-svelte';

	interface Props {
		scheduledStartTime: string;
		streamTitle: string;
		streamDescription?: string;
		posterUrl?: string;
		theme?: 'memorial' | 'homepage';
		currentTime: Date;
	}

	let { 
		scheduledStartTime, 
		streamTitle, 
		streamDescription, 
		posterUrl = 'https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/image_assets%2Fthumb%20for%20homevid%20002.png?alt=media&token=b5a29196-eceb-44cf-8e65-1b135d6b03ad',
		theme = 'memorial',
		currentTime
	}: Props = $props();

	// Get countdown for scheduled stream
	function getCountdown(scheduledTime: string, currentTime: Date): {
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
		isStarted: boolean;
	} {
		const now = currentTime.getTime();
		const target = new Date(scheduledTime).getTime();
		const diff = target - now;

		if (diff <= 0) {
			return { days: 0, hours: 0, minutes: 0, seconds: 0, isStarted: true };
		}

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		return { days, hours, minutes, seconds, isStarted: false };
	}

	// Format date for display
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	// Reactive countdown that updates with current time from parent
	let countdown = $derived.by(() => {
		return getCountdown(scheduledStartTime, currentTime);
	});
</script>

<div class="countdown-video-player" class:memorial-theme={theme === 'memorial'} class:homepage-theme={theme === 'homepage'}>
	<div class="video-container">
		<!-- Video Screen with Poster Background -->
		<div class="video-screen" style="background-image: url({posterUrl})">
			<!-- Dark Overlay for Better Text Contrast -->
			<div class="video-overlay"></div>
			
			<!-- Countdown Overlay -->
			<div class="countdown-overlay">
				<div class="countdown-content">
					<h3 class="countdown-title">Service Starts In</h3>
					
					<div class="countdown-display">
						{#if countdown.days > 0}
							<div class="countdown-unit">
								<span class="countdown-number">{countdown.days}</span>
								<span class="countdown-label">Days</span>
							</div>
						{/if}
						<div class="countdown-unit">
							<span class="countdown-number">{countdown.hours.toString().padStart(2, '0')}</span>
							<span class="countdown-label">Hours</span>
						</div>
						<div class="countdown-unit">
							<span class="countdown-number">{countdown.minutes.toString().padStart(2, '0')}</span>
							<span class="countdown-label">Minutes</span>
						</div>
						<div class="countdown-unit">
							<span class="countdown-number">{countdown.seconds.toString().padStart(2, '0')}</span>
							<span class="countdown-label">Seconds</span>
						</div>
					</div>
					
					<p class="scheduled-time">
						<Clock class="time-icon" />
						{formatDate(scheduledStartTime)}
					</p>
				</div>
			</div>
		</div>
		
		<!-- Fake Video Controls -->
		<div class="video-controls">
			<div class="control-bar">
				<!-- Play Button (Disabled) -->
				<button class="play-button" disabled aria-label="Stream not yet available">
					<svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
						<polygon points="5,3 19,12 5,21"></polygon>
					</svg>
				</button>
				
				<!-- Progress Bar (Empty) -->
				<div class="progress-container">
					<div class="progress-bar">
						<div class="progress-fill" style="width: 0%"></div>
					</div>
				</div>
				
				<!-- Time Display -->
				<span class="time-display">Stream starts soon</span>
				
				<!-- Volume Button (Disabled) -->
				<button class="volume-button" disabled aria-label="Volume control unavailable">
					<svg class="volume-icon" viewBox="0 0 24 24" fill="currentColor">
						<polygon points="11,5 6,9 2,9 2,15 6,15 11,19"></polygon>
						<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
					</svg>
				</button>
				
				<!-- Fullscreen Button (Disabled) -->
				<button class="fullscreen-button" disabled aria-label="Fullscreen unavailable">
					<svg class="fullscreen-icon" viewBox="0 0 24 24" fill="currentColor">
						<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
					</svg>
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.countdown-video-player {
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
		background: #000;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.video-container {
		position: relative;
		width: 100%;
	}

	.video-screen {
		aspect-ratio: 16/9;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		background-color: #1a1a1a;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.video-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		z-index: 1;
	}

	.countdown-overlay {
		position: relative;
		z-index: 2;
		text-align: center;
		color: white;
		padding: 2rem;
	}

	.countdown-content {
		max-width: 500px;
		margin: 0 auto;
	}

	.countdown-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: white;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
	}

	.countdown-display {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 1.5rem;
	}

	.countdown-unit {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 60px;
	}

	.countdown-number {
		font-size: 2.5rem;
		font-weight: 700;
		line-height: 1;
		color: #D5BA7F;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
		font-family: 'Courier New', monospace;
	}

	.countdown-label {
		font-size: 0.875rem;
		opacity: 0.9;
		margin-top: 0.25rem;
		color: white;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
		font-weight: 500;
	}

	.scheduled-time {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 1.1rem;
		margin: 0;
		opacity: 0.95;
		color: white;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
	}

	.time-icon {
		width: 16px;
		height: 16px;
	}

	/* Video Controls */
	.video-controls {
		background: #1a1a1a;
		padding: 0.75rem 1rem;
		border-top: 1px solid #333;
	}

	.control-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: #888;
		font-size: 0.9rem;
	}

	.play-button,
	.volume-button,
	.fullscreen-button {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #333;
		border: none;
		border-radius: 4px;
		cursor: not-allowed;
		opacity: 0.5;
		color: #888;
		transition: all 0.2s ease;
	}

	.play-button:disabled,
	.volume-button:disabled,
	.fullscreen-button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.play-icon,
	.volume-icon,
	.fullscreen-icon {
		width: 14px;
		height: 14px;
	}

	.progress-container {
		flex: 1;
		margin: 0 0.5rem;
	}

	.progress-bar {
		height: 4px;
		background: #333;
		border-radius: 2px;
		position: relative;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #666;
		border-radius: 2px;
		transition: width 0.2s ease;
	}

	.time-display {
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		min-width: 120px;
		text-align: center;
		color: #888;
	}

	/* Theme Variations */
	.memorial-theme {
		/* Memorial page specific styling */
	}

	.homepage-theme {
		/* Homepage specific styling if needed */
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.countdown-overlay {
			padding: 1.5rem;
		}

		.countdown-title {
			font-size: 1.25rem;
			margin-bottom: 1rem;
		}

		.countdown-display {
			gap: 1rem;
		}

		.countdown-number {
			font-size: 2rem;
		}

		.countdown-unit {
			min-width: 50px;
		}

		.scheduled-time {
			font-size: 1rem;
		}

		.control-bar {
			gap: 0.75rem;
		}

		.time-display {
			min-width: 100px;
			font-size: 0.8rem;
		}
	}

	@media (max-width: 480px) {
		.countdown-display {
			gap: 0.75rem;
		}

		.countdown-number {
			font-size: 1.75rem;
		}

		.countdown-label {
			font-size: 0.75rem;
		}

		.countdown-unit {
			min-width: 45px;
		}
	}
</style>
