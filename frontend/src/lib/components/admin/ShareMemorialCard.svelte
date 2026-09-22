<!--
ShareMemorialCard — the headline "give this to the family" block for a
memorial's admin page: an actual hyperlink (opens in a new tab), a copy
button, a native-share button (mobile only, when supported), and a locally
generated, printable QR code. No third-party QR API is used — codes are
rendered client-side and downloadable as print-quality PNG/SVG.
-->
<script lang="ts">
	import { Card, SectionHeader, CopyButton, QrCodePanel, Button } from './ui';
	import { memorialPublicUrl } from '$lib/utils/memorial-url';

	let {
		fullSlug,
		lovedOneName
	}: {
		fullSlug: string | null | undefined;
		lovedOneName: string;
	} = $props();

	const publicUrl = $derived(memorialPublicUrl(fullSlug));

	// navigator.share is undefined on desktop browsers — the button only
	// renders where it actually works, rather than showing a dead control.
	let canNativeShare = $state(false);
	$effect(() => {
		canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
	});

	async function nativeShare() {
		if (!publicUrl) return;
		try {
			await navigator.share({
				title: `${lovedOneName}'s Memorial`,
				url: publicUrl
			});
		} catch (err) {
			// AbortError when the user cancels the share sheet — not a real error.
			if ((err as Error)?.name !== 'AbortError') {
				console.error('❌ [ShareMemorialCard] Native share failed:', err);
			}
		}
	}
</script>

<Card class="mb-6">
	<SectionHeader title="Share This Memorial" icon="share" />

	{#if !publicUrl}
		<p class="text-sm italic text-slate-500">
			No public URL yet — set a slug in Settings to enable sharing.
		</p>
	{:else}
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="min-w-0 flex-1">
				<a
					href={publicUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1.5 break-all text-sm font-medium text-sky-700 hover:underline"
				>
					{publicUrl}
					<span class="shrink-0 text-slate-400"
						><svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline
								points="15 3 21 3 21 9"
							/><line x1="10" y1="14" x2="21" y2="3" /></svg
						></span
					>
				</a>

				<div class="mt-3 flex flex-wrap gap-2">
					<CopyButton
						value={publicUrl}
						label="Copy Link"
						toastMessage="Memorial link copied"
						class="w-full sm:w-auto"
					/>
					{#if canNativeShare}
						<Button
							variant="secondary"
							icon="share"
							onclick={nativeShare}
							class="min-h-11 w-full sm:w-auto sm:min-h-0"
						>
							Share…
						</Button>
					{/if}
				</div>
			</div>

			<div class="shrink-0 self-center sm:self-start">
				<QrCodePanel
					value={publicUrl}
					filenameBase={`memorial-qr-${fullSlug}`}
					size={140}
				/>
			</div>
		</div>
	{/if}
</Card>
