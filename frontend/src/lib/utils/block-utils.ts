/**
 * Block Utilities
 * 
 * Helper functions for working with memorial content blocks.
 */

import type {
	MemorialBlock,
	BlockType,
	BlockConfig,
	LivestreamConfig,
	EmbedConfig,
	TextConfig,
	EmbedType,
	TextStyle,
	GalleryImage,
	GalleryVideoItem,
	ImageGalleryConfig,
	VideoGalleryConfig
} from '$lib/types/memorial-blocks';

export interface TextCustomStyles {
	fontSize?: string;
	fontColor?: string;
	lineHeight?: string;
	textAlign?: 'left' | 'center' | 'right';
}

/**
 * Generate a unique block ID
 */
export function generateBlockId(): string {
	return crypto.randomUUID();
}

/**
 * Sort blocks by order field
 */
export function sortBlocksByOrder(blocks: MemorialBlock[]): MemorialBlock[] {
	return [...blocks].sort((a, b) => a.order - b.order);
}

/**
 * Recompute order values after deletion or insertion
 * Ensures order values are sequential: 0, 1, 2, ...
 */
export function recomputeOrder(blocks: MemorialBlock[]): MemorialBlock[] {
	return blocks.map((block, index) => ({
		...block,
		order: index
	}));
}

/**
 * Insert a block at a specific position
 */
export function insertBlockAt(
	blocks: MemorialBlock[],
	newBlock: MemorialBlock,
	position: number
): MemorialBlock[] {
	const sorted = sortBlocksByOrder(blocks);
	const result = [...sorted];
	
	// Clamp position to valid range
	const insertPos = Math.max(0, Math.min(position, result.length));
	
	// Insert at position
	result.splice(insertPos, 0, newBlock);
	
	// Recompute order
	return recomputeOrder(result);
}

/**
 * Remove a block by ID
 */
export function removeBlock(blocks: MemorialBlock[], blockId: string): MemorialBlock[] {
	const filtered = blocks.filter(b => b.id !== blockId);
	return recomputeOrder(sortBlocksByOrder(filtered));
}

/**
 * Update a block by ID
 */
export function updateBlock(
	blocks: MemorialBlock[],
	blockId: string,
	updates: Partial<MemorialBlock>
): MemorialBlock[] {
	return blocks.map(block => {
		if (block.id === blockId) {
			return {
				...block,
				...updates,
				updatedAt: new Date().toISOString()
			};
		}
		return block;
	});
}

/**
 * Reorder blocks based on array of IDs
 */
export function reorderBlocks(blocks: MemorialBlock[], newOrder: string[]): MemorialBlock[] {
	const blockMap = new Map(blocks.map(b => [b.id, b]));
	const now = new Date().toISOString();
	
	return newOrder.map((id, index) => {
		const block = blockMap.get(id);
		if (!block) {
			throw new Error(`Block not found: ${id}`);
		}
		return {
			...block,
			order: index,
			updatedAt: now
		};
	});
}

/**
 * Create a new block with defaults
 */
export function createBlock(
	type: BlockType,
	config: BlockConfig,
	order: number
): MemorialBlock {
	const now = new Date().toISOString();
	return {
		id: generateBlockId(),
		type,
		order,
		enabled: true,
		createdAt: now,
		updatedAt: now,
		config
	};
}

/**
 * Create a livestream block
 */
export function createLivestreamBlock(streamId: string, order: number): MemorialBlock {
	return createBlock('livestream', { streamId } as LivestreamConfig, order);
}

/**
 * Create an embed block
 */
export function createEmbedBlock(
	title: string | undefined,
	embedCode: string,
	embedType: EmbedType,
	order: number
): MemorialBlock {
	return createBlock('embed', { title, embedCode, embedType } as EmbedConfig, order);
}

/**
 * Title to render for an embed block. Blank titles and the legacy
 * auto-generated default of "Embed" (previously applied whenever an admin
 * left the title field empty) both render as "no title".
 */
export function getEmbedDisplayTitle(title?: string | null): string {
	const trimmed = title?.trim() ?? '';
	return trimmed === 'Embed' ? '' : trimmed;
}

/**
 * Create a text block
 */
export function createTextBlock(
	content: string,
	style: TextStyle,
	order: number,
	customStyles?: TextCustomStyles
): MemorialBlock {
	const config: TextConfig = { content, style, ...customStyles };
	return createBlock('text', config, order);
}

/**
 * Create an image gallery block
 */
export function createImageGalleryBlock(
	images: GalleryImage[],
	order: number,
	title?: string
): MemorialBlock {
	const config: ImageGalleryConfig = { title, images };
	return createBlock('image-gallery', config, order);
}

/**
 * Create a video gallery (tribute video gallery) block
 */
export function createVideoGalleryBlock(
	videos: GalleryVideoItem[],
	order: number,
	title?: string
): MemorialBlock {
	const config: VideoGalleryConfig = { title, videos };
	return createBlock('video-gallery', config, order);
}

/**
 * Add an item to a gallery items array (generic over images/videos)
 */
export function addGalleryItem<T extends { id: string; order: number }>(
	items: T[],
	item: Omit<T, 'order'>
): T[] {
	return [...items, { ...item, order: items.length } as T];
}

/**
 * Remove an item from a gallery items array by id, recomputing order
 */
export function removeGalleryItem<T extends { id: string; order: number }>(
	items: T[],
	id: string
): T[] {
	return items
		.filter((item) => item.id !== id)
		.map((item, index) => ({ ...item, order: index }));
}

/**
 * Move an item within a gallery items array, recomputing order
 */
export function moveGalleryItem<T extends { id: string; order: number }>(
	items: T[],
	id: string,
	direction: 'up' | 'down'
): T[] {
	const sorted = [...items].sort((a, b) => a.order - b.order);
	const idx = sorted.findIndex((item) => item.id === id);
	if (idx < 0) return items;

	const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
	if (targetIdx < 0 || targetIdx >= sorted.length) return items;

	[sorted[idx], sorted[targetIdx]] = [sorted[targetIdx], sorted[idx]];
	return sorted.map((item, index) => ({ ...item, order: index }));
}

/**
 * Validate block config based on type
 */
export function validateBlockConfig(type: BlockType, config: BlockConfig): string | null {
	switch (type) {
		case 'livestream': {
			const c = config as LivestreamConfig;
			if (!c.streamId || typeof c.streamId !== 'string') {
				return 'Livestream block requires a valid streamId';
			}
			break;
		}
		case 'embed': {
			const c = config as EmbedConfig;
			if (!c.embedCode || typeof c.embedCode !== 'string') {
				return 'Embed block requires embedCode';
			}
			if (!c.embedType || !['video', 'chat', 'other'].includes(c.embedType)) {
				return 'Embed block requires valid embedType (video, chat, or other)';
			}
			break;
		}
		case 'text': {
			const c = config as TextConfig;
			if (typeof c.content !== 'string') {
				return 'Text block requires content';
			}
			if (!c.style || !['paragraph', 'heading', 'note'].includes(c.style)) {
				return 'Text block requires valid style (paragraph, heading, or note)';
			}
			if (c.fontSize !== undefined && typeof c.fontSize !== 'string') {
				return 'fontSize must be a string CSS value';
			}
			if (c.fontColor !== undefined && typeof c.fontColor !== 'string') {
				return 'fontColor must be a string CSS color';
			}
			if (c.lineHeight !== undefined && typeof c.lineHeight !== 'string') {
				return 'lineHeight must be a string CSS value';
			}
			if (c.textAlign !== undefined && !['left', 'center', 'right'].includes(c.textAlign)) {
				return 'textAlign must be left, center, or right';
			}
			break;
		}
		case 'image-gallery': {
			const c = config as ImageGalleryConfig;
			if (!Array.isArray(c.images)) {
				return 'Image gallery block requires an images array';
			}
			for (const img of c.images) {
				if (!img.url || typeof img.url !== 'string') {
					return 'Each gallery image requires a valid url';
				}
				if (img.width !== undefined && typeof img.width !== 'number') {
					return 'Gallery image width must be a number';
				}
				if (img.height !== undefined && typeof img.height !== 'number') {
					return 'Gallery image height must be a number';
				}
			}
			break;
		}
		case 'video-gallery': {
			const c = config as VideoGalleryConfig;
			if (!Array.isArray(c.videos)) {
				return 'Video gallery block requires a videos array';
			}
			for (const vid of c.videos) {
				if (!vid.embedCode || typeof vid.embedCode !== 'string') {
					return 'Each gallery video requires embedCode';
				}
				if (vid.thumbnailUrl !== undefined && typeof vid.thumbnailUrl !== 'string') {
					return 'Gallery video thumbnailUrl must be a string';
				}
				if (
					vid.thumbnailKind !== undefined &&
					!['derived', 'custom'].includes(vid.thumbnailKind)
				) {
					return 'Gallery video thumbnailKind must be derived or custom';
				}
				if (
					vid.thumbnailTime !== undefined &&
					(typeof vid.thumbnailTime !== 'number' || !Number.isFinite(vid.thumbnailTime) || vid.thumbnailTime < 0)
				) {
					return 'Gallery video thumbnailTime must be a non-negative number';
				}
			}
			break;
		}
		default:
			return `Unknown block type: ${type}`;
	}
	return null;
}

/**
 * Get block icon based on type
 */
export function getBlockIcon(type: BlockType): string {
	switch (type) {
		case 'livestream':
			return '📹';
		case 'embed':
			return '🔗';
		case 'text':
			return '📝';
		case 'image-gallery':
			return '🖼️';
		case 'video-gallery':
			return '🎞️';
		default:
			return '📦';
	}
}

/**
 * Get block type label
 */
export function getBlockTypeLabel(type: BlockType): string {
	switch (type) {
		case 'livestream':
			return 'Livestream';
		case 'embed':
			return 'Embed';
		case 'text':
			return 'Text';
		case 'image-gallery':
			return 'Image Gallery';
		case 'video-gallery':
			return 'Tribute Video Gallery';
		default:
			return 'Unknown';
	}
}

/**
 * Get only enabled blocks, sorted by order
 */
export function getEnabledBlocks(blocks: MemorialBlock[]): MemorialBlock[] {
	return sortBlocksByOrder(blocks.filter(b => b.enabled));
}

/**
 * Find a block by ID
 */
export function findBlock(blocks: MemorialBlock[], blockId: string): MemorialBlock | undefined {
	return blocks.find(b => b.id === blockId);
}

/**
 * Check if blocks array contains a block with the given stream ID
 * @deprecated Used only by the deprecated blocks/sync API. No longer called from UI.
 */
export function hasStreamBlock(blocks: MemorialBlock[], streamId: string): boolean {
	return blocks.some(
		b => b.type === 'livestream' && (b.config as LivestreamConfig).streamId === streamId
	);
}

/**
 * Build safe iframe HTML from an embed code or bare URL.
 * If it's just a URL, wrap it in an iframe; otherwise return as-is
 * (it should already be an iframe/embed snippet).
 */
export function buildEmbedIframeHtml(embedCode: string, height: number = 400): string {
	if (embedCode.startsWith('http') && !embedCode.includes('<')) {
		return `<iframe src="${embedCode}" width="100%" height="${height}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="aspect-ratio: 16/9;"></iframe>`;
	}
	return embedCode;
}

/**
 * Sanitize embed code for security
 * Only allows iframe tags with whitelisted domains
 */
export function sanitizeEmbedCode(embedCode: string): string {
	// If it's just a URL, wrap it in an iframe
	if (embedCode.startsWith('http') && !embedCode.includes('<')) {
		return `<iframe src="${embedCode}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>`;
	}
	
	// Extract iframe src and validate domain
	const srcMatch = embedCode.match(/src=["']([^"']+)["']/);
	if (!srcMatch) {
		return embedCode; // Return as-is, let frontend handle display
	}
	
	const src = srcMatch[1];
	const allowedDomains = [
		'youtube.com',
		'youtube-nocookie.com',
		'youtu.be',
		'vimeo.com',
		'player.vimeo.com',
		'dailymotion.com',
		'facebook.com',
		'twitch.tv',
		'player.twitch.tv',
		'cloudflare.com',
		'cloudflarestream.com',
		'iframe.videodelivery.net',
		'tributestream.com',
		'mux.com'
	];
	
	try {
		const url = new URL(src);
		const isAllowed = allowedDomains.some(domain => 
			url.hostname === domain || url.hostname.endsWith('.' + domain)
		);
		
		if (!isAllowed) {
			console.warn(`Embed domain not in allowlist: ${url.hostname}`);
		}
	} catch {
		// Invalid URL, return as-is
	}
	
	return embedCode;
}
