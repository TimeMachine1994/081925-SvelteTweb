<!--
  QR CODE MODAL COMPONENT
  =======================
  
  Modal dialog displaying QR codes for phone sources to connect.
  Shows all available source slots with their QR codes and URLs.
  
  Features:
  - Full-screen backdrop overlay
  - Multiple QR codes (one per source slot)
  - Copy URL to clipboard functionality
  - Click outside to close
  - Escape key to close
  - Smooth animations
  
  Props:
  - isOpen: Whether modal is visible
  - sources: Array of source configurations with QR codes and tokens
  - onClose: Callback when modal is closed
  
  @see SwitcherMockup.html lines 200-225 for design reference
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// Types (matching server data structure)
	interface Source {
		slot: number;
		token: string;
		qrCode: string;  // Data URL from server
		url: string;     // Join URL from server
	}

	// Local state for copy feedback
	let copiedSlot = $state<number | null>(null);
	let copyTimeout: number | undefined;

	// Props
	let { 
		isOpen = false,
		sources = [],
		onClose = () => {}
	}: {
		isOpen?: boolean;
		sources?: Source[];
		onClose?: () => void;
	} = $props();

	/**
	 * Handle escape key press
	 */
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			console.log('⌨️  [QR MODAL] Escape key pressed, closing modal');
			onClose();
		}
	}

	/**
	 * Handle backdrop click (close modal)
	 */
	function handleBackdropClick(e: MouseEvent) {
		// Only close if clicking the backdrop itself, not the content
		if (e.target === e.currentTarget) {
			console.log('🖱️  [QR MODAL] Backdrop clicked, closing modal');
			onClose();
		}
	}

	/**
	 * Copy URL to clipboard with visual feedback
	 */
	async function copyToClipboard(url: string, slot: number) {
		try {
			await navigator.clipboard.writeText(url);
			console.log(`📋 [QR MODAL] Copied URL to clipboard (Source ${slot})`);
			
			// Show feedback
			copiedSlot = slot;
			
			// Clear previous timeout
			if (copyTimeout) {
				clearTimeout(copyTimeout);
			}
			
			// Auto-hide after 2 seconds
			copyTimeout = window.setTimeout(() => {
				copiedSlot = null;
			}, 2000);
		} catch (err) {
			console.error('❌ [QR MODAL] Failed to copy:', err);
		}
	}

	// Lifecycle
	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		console.log('🎬 [QR MODAL] Component mounted');
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeydown);
		console.log('🧹 [QR MODAL] Component unmounted');
	});
</script>

<!--
  MODAL MARKUP
  ============
  Full-screen overlay with centered content
-->
{#if isOpen}
	<div
		class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="qr-modal-title"
		tabindex="-1"
	>
		<div class="bg-gray-900 border border-gray-700 text-gray-100 p-6 rounded-2xl flex flex-col items-center gap-6 max-w-2xl w-full shadow-2xl transform transition-transform duration-300 max-h-[90vh] overflow-y-auto">
			
			<!-- Header -->
			<div class="flex justify-between w-full items-center">
				<h3 id="qr-modal-title" class="text-lg font-bold">
					Connect Phone Sources
				</h3>
				<button 
					onclick={onClose}
					class="text-gray-500 hover:text-white transition"
					aria-label="Close modal"
				>
					<svg 
						xmlns="http://www.w3.org/2000/svg" 
						class="w-5 h-5"
						viewBox="0 0 24 24" 
						fill="none" 
						stroke="currentColor" 
						stroke-width="2" 
						stroke-linecap="round" 
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<!-- Instructions -->
			<p class="text-center text-gray-400 text-sm">
				Scan any QR code below with a phone camera to join as a video source.
				Each source can connect independently.
			</p>

			<!-- QR Codes Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
				{#each sources as source (source.slot)}
					<div class="flex flex-col items-center gap-3 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
						
						<!-- Source Label -->
						<div class="text-sm font-semibold text-gray-300">
							Source {source.slot}
						</div>

						<!-- QR Code -->
						<div class="w-48 h-48 bg-white rounded-xl flex items-center justify-center p-3 relative shadow-lg">
							<img 
								src={source.qrCode} 
								alt="QR code for source {source.slot}"
								class="w-full h-full object-contain"
							/>
						</div>

						<!-- Join URL with Copy Button -->
						<div class="flex items-center gap-2 bg-black/50 p-2.5 rounded border border-gray-700 w-full relative">
							<svg 
								xmlns="http://www.w3.org/2000/svg" 
								class="w-3.5 h-3.5 text-blue-500 flex-shrink-0"
								viewBox="0 0 24 24" 
								fill="none" 
								stroke="currentColor" 
								stroke-width="2" 
								stroke-linecap="round" 
								stroke-linejoin="round"
							>
								<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
								<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
							</svg>
							<code class="text-xs text-blue-400 flex-1 truncate font-mono">
								{source.url}
							</code>
							<button 
								onclick={() => copyToClipboard(source.url, source.slot)}
								class="flex-shrink-0 transition"
								class:text-green-400={copiedSlot === source.slot}
								class:text-gray-500={copiedSlot !== source.slot}
								class:hover:text-white={copiedSlot !== source.slot}
								title={copiedSlot === source.slot ? 'Copied!' : 'Copy URL'}
								aria-label={copiedSlot === source.slot ? 'Copied to clipboard' : 'Copy URL to clipboard'}
							>
								{#if copiedSlot === source.slot}
									<!-- Checkmark icon -->
									<svg 
										xmlns="http://www.w3.org/2000/svg" 
										class="w-3.5 h-3.5"
										viewBox="0 0 24 24" 
										fill="none" 
										stroke="currentColor" 
										stroke-width="2" 
										stroke-linecap="round" 
										stroke-linejoin="round"
									>
										<polyline points="20 6 9 17 4 12"></polyline>
									</svg>
								{:else}
									<!-- Copy icon -->
									<svg 
										xmlns="http://www.w3.org/2000/svg" 
										class="w-3.5 h-3.5"
										viewBox="0 0 24 24" 
										fill="none" 
										stroke="currentColor" 
										stroke-width="2" 
										stroke-linecap="round" 
										stroke-linejoin="round"
									>
										<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
										<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
									</svg>
								{/if}
							</button>
						</div>
					</div>
				{/each}
			</div>

			<!-- Footer Tips -->
			<div class="text-center text-xs text-gray-500 space-y-1">
				<p>💡 <strong>Tip:</strong> Use landscape mode on phones for best results</p>
				<p>🔒 These URLs are secure and expire in 4 hours</p>
			</div>
		</div>
	</div>
{/if}
