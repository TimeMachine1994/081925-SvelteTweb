<!--
QrCodePanel — renders a scannable QR code for `value` entirely client-side
(no third-party QR API — the codes we generate here encode memorial URLs and
should never leave this app). Offers print-quality PNG and SVG downloads.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
	import Button from './Button.svelte';
	import Alert from './Alert.svelte';
	import { adminToast } from '$lib/stores/adminToast';

	let {
		value,
		filenameBase = 'qr-code',
		size = 160
	}: {
		value: string;
		filenameBase?: string;
		size?: number;
	} = $props();

	let svgMarkup = $state<string | null>(null);
	let error = $state<string | null>(null);

	async function render() {
		error = null;
		svgMarkup = null;
		if (!value) return;
		try {
			svgMarkup = await QRCode.toString(value, { type: 'svg', margin: 1, width: size });
		} catch (err) {
			console.error('❌ [QrCodePanel] Failed to render QR code:', err);
			error = 'Failed to generate QR code';
		}
	}

	onMount(render);
	$effect(() => {
		value;
		size;
		render();
	});

	function triggerDownload(url: string, filename: string) {
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	async function downloadPng() {
		if (!value) return;
		try {
			const dataUrl = await QRCode.toDataURL(value, { width: 1024, margin: 2 });
			triggerDownload(dataUrl, `${filenameBase}.png`);
		} catch (err) {
			console.error('❌ [QrCodePanel] PNG export failed:', err);
			adminToast.error('Failed to generate PNG');
		}
	}

	async function downloadSvg() {
		if (!value) return;
		try {
			const svg = await QRCode.toString(value, { type: 'svg', margin: 2, width: 1024 });
			const blob = new Blob([svg], { type: 'image/svg+xml' });
			const url = URL.createObjectURL(blob);
			triggerDownload(url, `${filenameBase}.svg`);
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error('❌ [QrCodePanel] SVG export failed:', err);
			adminToast.error('Failed to generate SVG');
		}
	}
</script>

<div class="flex flex-col items-center gap-3 sm:items-start">
	{#if error}
		<Alert variant="danger" title="QR code unavailable">{error}</Alert>
	{:else if svgMarkup}
		<div class="qr-preview rounded-md border border-slate-200 bg-white p-2" style="--qr-size: {size}px;">
			{@html svgMarkup}
		</div>
		<div class="flex gap-2">
			<Button size="sm" variant="secondary" icon="download" onclick={downloadPng}>PNG</Button>
			<Button size="sm" variant="secondary" icon="download" onclick={downloadSvg}>SVG</Button>
		</div>
	{:else}
		<div class="qr-preview animate-pulse rounded-md bg-slate-100" style="--qr-size: {size}px;"></div>
	{/if}
</div>

<style>
	.qr-preview {
		width: var(--qr-size);
		height: var(--qr-size);
	}

	.qr-preview :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}

	/* Larger, easier-to-scan-off-a-phone-screen QR on small viewports. */
	@media (max-width: 640px) {
		.qr-preview {
			width: 200px;
			height: 200px;
		}
	}
</style>
