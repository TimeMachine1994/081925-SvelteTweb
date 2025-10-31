export interface MemorialSlideshow {
	id: string;
	title: string;
	memorialId: string;
	firebaseStoragePath: string; // Firebase Storage path (required)
	playbackUrl: string; // Firebase Storage video URL (required)
	thumbnailUrl?: string | null; // Optional thumbnail
	status: 'ready' | 'error' | 'processing' | 'local_only' | 'unpublished'; // Slideshow status
	isFirebaseHosted: boolean; // Always true for new slideshows
	photos: SlideshowPhoto[];
	settings: SlideshowSettings;
	createdBy: string;
	createdAt: string;
	updatedAt: string;

	// Demo mode fields - for sandboxed demo data
	isDemo?: boolean;
	demoSessionId?: string;
	demoExpiresAt?: string;
}

export interface SlideshowPhoto {
	id: string;
	url: string; // Firebase Storage URL (required)
	storagePath: string; // Firebase Storage path for management (required)
	caption?: string;
	duration?: number;
}

export interface SlideshowSettings {
	photoDuration: number;
	transitionType: 'fade' | 'slide' | 'zoom';
	videoQuality: 'low' | 'medium' | 'high';
	aspectRatio: '16:9' | '4:3' | '1:1';
}

export interface SlideshowGenerationProgress {
	progress: number;
	phase: 'loading' | 'rendering' | 'encoding' | 'complete';
	currentPhoto?: number;
	totalPhotos?: number;
}
