/**
 * Memorial Blocks Type Definitions
 * 
 * Defines the data structures for the WYSIWYG memorial content editor.
 * Blocks represent ordered, toggleable content sections on a memorial page.
 */

// Block type discriminator
export type BlockType = 'livestream' | 'embed' | 'text' | 'image-gallery' | 'video-gallery';

// Embed subtypes for styling/icons
export type EmbedType = 'video' | 'chat' | 'other';

// Text display styles
export type TextStyle = 'paragraph' | 'heading' | 'note';

// Livestream block configuration
export interface LivestreamConfig {
	streamId: string; // Reference to stream document in streams subcollection
}

// Embed block configuration
export interface EmbedConfig {
	title: string;
	embedCode: string;
	embedType: EmbedType;
}

// Text block configuration
export interface TextConfig {
	content: string;
	style: TextStyle;
	// Custom styling overrides
	fontSize?: string;    // CSS value, e.g. "1.5rem", "2rem"
	fontColor?: string;   // CSS color, e.g. "#ffffff", "rgba(255,255,255,0.9)"
	lineHeight?: string;  // CSS line-height, e.g. "1.4", "1.8"
	textAlign?: 'left' | 'center' | 'right';
}

// A single image within an image-gallery block
export interface GalleryImage {
	id: string;
	url: string;
	storagePath?: string;
	caption?: string;
	order: number;
}

// A single video embed within a video-gallery block
export interface GalleryVideoItem {
	id: string;
	title?: string;
	embedCode: string;
	order: number;
}

// Image gallery block configuration
export interface ImageGalleryConfig {
	title?: string;
	images: GalleryImage[];
}

// Video gallery block configuration (aka "Tribute Gallery (Video)")
export interface VideoGalleryConfig {
	title?: string;
	videos: GalleryVideoItem[];
}

// Union type for block configurations
export type BlockConfig =
	| LivestreamConfig
	| EmbedConfig
	| TextConfig
	| ImageGalleryConfig
	| VideoGalleryConfig;

// Base memorial block interface
export interface MemorialBlock {
	id: string;
	type: BlockType;
	order: number;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
	config: BlockConfig;
}

// Type guards for block configurations
export function isLivestreamConfig(config: BlockConfig): config is LivestreamConfig {
	return 'streamId' in config;
}

export function isEmbedConfig(config: BlockConfig): config is EmbedConfig {
	return 'embedCode' in config && 'embedType' in config;
}

export function isTextConfig(config: BlockConfig): config is TextConfig {
	return 'content' in config && 'style' in config;
}

export function isImageGalleryConfig(config: BlockConfig): config is ImageGalleryConfig {
	return 'images' in config;
}

export function isVideoGalleryConfig(config: BlockConfig): config is VideoGalleryConfig {
	return 'videos' in config;
}

// Typed block interfaces for convenience
export interface LivestreamBlock extends MemorialBlock {
	type: 'livestream';
	config: LivestreamConfig;
}

export interface EmbedBlock extends MemorialBlock {
	type: 'embed';
	config: EmbedConfig;
}

export interface TextBlock extends MemorialBlock {
	type: 'text';
	config: TextConfig;
}

export interface ImageGalleryBlock extends MemorialBlock {
	type: 'image-gallery';
	config: ImageGalleryConfig;
}

export interface VideoGalleryBlock extends MemorialBlock {
	type: 'video-gallery';
	config: VideoGalleryConfig;
}

// API request/response types
export interface CreateBlockRequest {
	type: BlockType;
	config: BlockConfig;
	insertAt?: number; // Position to insert, defaults to end
}

export interface UpdateBlockRequest {
	enabled?: boolean;
	config?: Partial<BlockConfig>;
}

export interface ReorderBlocksRequest {
	order: string[]; // Array of block IDs in new order
}

export interface BlocksResponse {
	blocks: MemorialBlock[];
	version: number;
}

export interface BlockResponse {
	block: MemorialBlock;
	blocks: MemorialBlock[];
}

export interface DeleteBlockResponse {
	deleted: string;
	blocks: MemorialBlock[];
}

// Create livestream block request (combines stream + block creation)
export interface CreateLivestreamBlockRequest {
	title: string;
	scheduledStartTime: string;
	description?: string;
	insertAt?: number;
	// 'rtmp' (default, OBS/hardware broadcast) or 'upload' (premiere: upload a
	// file, schedule it, and it plays back synced for everyone at start time).
	sourceType?: 'rtmp' | 'upload';
}
