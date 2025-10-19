/**
 * Simplified slideshow generator with better MediaRecorder handling
 */

export interface SlideshowPhoto {
	id: string;
	file?: File;
	preview: string;
	caption?: string;
	duration: number;
}

export interface SlideshowSettings {
	photoDuration: number;
	transitionType: 'fade' | 'slide' | 'none';
	videoQuality: 'low' | 'medium' | 'high';
	aspectRatio: '16:9' | '4:3' | '1:1';
}

export interface GenerationProgress {
	phase: 'loading' | 'rendering' | 'encoding';
	progress: number;
	currentPhoto?: number;
	totalPhotos: number;
}

export class SimpleSlideshowGenerator {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private mediaRecorder: MediaRecorder | null = null;
	private recordedChunks: Blob[] = [];
	private onProgress?: (progress: GenerationProgress) => void;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Could not get 2D context from canvas');
		}
		this.ctx = ctx;
	}

	/**
	 * Generate slideshow video with simplified approach
	 */
	async generateVideo(
		photos: SlideshowPhoto[],
		settings: SlideshowSettings,
		onProgress?: (progress: GenerationProgress) => void
	): Promise<Blob> {
		this.onProgress = onProgress;
		
		if (photos.length === 0) {
			throw new Error('No photos provided');
		}

		console.log('🎬 Starting simplified video generation...');
		console.log('📊 Input:', { photoCount: photos.length, settings });

		try {
			// Setup canvas
			this.setupCanvas(settings);
			
			// Load images
			const images = await this.loadImages(photos);
			console.log(`✅ Loaded ${images.length} images`);

			// Try to generate video with MediaRecorder
			return await this.generateWithMediaRecorder(images, photos, settings);
			
		} catch (error) {
			console.error('❌ Video generation failed:', error);
			throw error;
		}
	}

	/**
	 * Setup canvas dimensions
	 */
	private setupCanvas(settings: SlideshowSettings) {
		const dimensions = {
			'low': { width: 854, height: 480 },    // 480p
			'medium': { width: 1280, height: 720 }, // 720p
			'high': { width: 1920, height: 1080 }   // 1080p
		};

		const { width, height } = dimensions[settings.videoQuality];
		this.canvas.width = width;
		this.canvas.height = height;
		
		console.log(`🖼️ Canvas setup: ${width}x${height}`);
	}

	/**
	 * Load all images
	 */
	private async loadImages(photos: SlideshowPhoto[]): Promise<HTMLImageElement[]> {
		this.reportProgress('loading', 0, photos.length);

		const images = await Promise.all(
			photos.map((photo, index) => {
				return new Promise<HTMLImageElement>((resolve, reject) => {
					const img = new Image();
					img.crossOrigin = 'anonymous'; // Handle CORS
					img.onload = () => {
						console.log(`✅ Loaded image ${index + 1}/${photos.length}`);
						resolve(img);
					};
					img.onerror = () => {
						console.error(`❌ Failed to load image ${index + 1}`);
						reject(new Error(`Failed to load image ${index + 1}`));
					};
					img.src = photo.preview;
				});
			})
		);

		this.reportProgress('loading', 100, photos.length);
		return images;
	}

	/**
	 * Generate video using MediaRecorder
	 */
	private async generateWithMediaRecorder(
		images: HTMLImageElement[],
		photos: SlideshowPhoto[],
		settings: SlideshowSettings
	): Promise<Blob> {
		console.log('🎥 Starting MediaRecorder generation...');

		// Draw first frame to initialize canvas
		this.drawPhoto(images[0], photos[0].caption || '');
		
		// Get stream
		const stream = this.canvas.captureStream(30);
		console.log('📹 Canvas stream created');

		// Check for video track
		const videoTrack = stream.getVideoTracks()[0];
		if (!videoTrack) {
			throw new Error('No video track available');
		}

		console.log('📺 Video track ready:', videoTrack.readyState);

		// Find supported codec
		const codecs = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
		let mimeType = '';
		
		for (const codec of codecs) {
			if (MediaRecorder.isTypeSupported(codec)) {
				mimeType = codec;
				console.log(`✅ Using codec: ${codec}`);
				break;
			}
		}

		if (!mimeType) {
			throw new Error('No supported video codec found');
		}

		// Setup MediaRecorder
		this.recordedChunks = [];
		this.mediaRecorder = new MediaRecorder(stream, {
			mimeType,
			videoBitsPerSecond: 1000000 // 1 Mbps
		});

		// Setup event handlers
		this.mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				console.log(`📦 Chunk: ${event.data.size} bytes`);
				this.recordedChunks.push(event.data);
			}
		};

		// Start recording
		return new Promise((resolve, reject) => {
			this.mediaRecorder!.onstop = () => {
				console.log(`🛑 Recording stopped. Chunks: ${this.recordedChunks.length}`);
				const blob = new Blob(this.recordedChunks, { type: mimeType });
				console.log(`📹 Final video: ${blob.size} bytes`);
				
				if (blob.size === 0) {
					reject(new Error('Generated video is empty'));
				} else {
					resolve(blob);
				}
			};

			this.mediaRecorder!.onerror = (event) => {
				console.error('❌ MediaRecorder error:', event);
				reject(new Error('MediaRecorder failed'));
			};

			// Start recording
			console.log('🔴 Starting recording...');
			this.mediaRecorder!.start(1000); // 1 second chunks

			// Render slideshow
			this.renderSlideshow(images, photos, settings).then(() => {
				console.log('🏁 Rendering complete, stopping recording...');
				setTimeout(() => {
					this.mediaRecorder!.stop();
				}, 500); // Wait a bit before stopping
			}).catch(reject);
		});
	}

	/**
	 * Render the slideshow animation
	 */
	private async renderSlideshow(
		images: HTMLImageElement[],
		photos: SlideshowPhoto[],
		settings: SlideshowSettings
	): Promise<void> {
		console.log('🎨 Starting slideshow rendering...');
		this.reportProgress('rendering', 0, photos.length);

		const fps = 30;
		const frameDuration = 1000 / fps; // ms per frame

		for (let i = 0; i < images.length; i++) {
			console.log(`🖼️ Rendering photo ${i + 1}/${images.length}`);
			
			// Show photo for specified duration
			const frames = Math.floor(photos[i].duration * fps);
			
			for (let frame = 0; frame < frames; frame++) {
				this.drawPhoto(images[i], photos[i].caption || '');
				await this.waitFrame(frameDuration);
			}

			this.reportProgress('rendering', ((i + 1) / images.length) * 100, photos.length, i + 1);
		}

		console.log('✅ Slideshow rendering complete');
	}

	/**
	 * Draw a photo on the canvas
	 */
	private drawPhoto(image: HTMLImageElement, caption: string) {
		// Clear canvas
		this.ctx.fillStyle = '#000000';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// Calculate image dimensions to fit canvas
		const canvasAspect = this.canvas.width / this.canvas.height;
		const imageAspect = image.width / image.height;

		let drawWidth, drawHeight, drawX, drawY;

		if (imageAspect > canvasAspect) {
			// Image is wider - fit to width
			drawWidth = this.canvas.width;
			drawHeight = drawWidth / imageAspect;
			drawX = 0;
			drawY = (this.canvas.height - drawHeight) / 2;
		} else {
			// Image is taller - fit to height
			drawHeight = this.canvas.height;
			drawWidth = drawHeight * imageAspect;
			drawX = (this.canvas.width - drawWidth) / 2;
			drawY = 0;
		}

		// Draw image
		this.ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

		// Draw caption if provided
		if (caption.trim()) {
			this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
			this.ctx.fillRect(0, this.canvas.height - 80, this.canvas.width, 80);
			
			this.ctx.fillStyle = '#ffffff';
			this.ctx.font = '24px Arial';
			this.ctx.textAlign = 'center';
			this.ctx.fillText(caption, this.canvas.width / 2, this.canvas.height - 30);
		}
	}

	/**
	 * Wait for next frame
	 */
	private waitFrame(duration: number): Promise<void> {
		return new Promise(resolve => {
			setTimeout(resolve, duration);
		});
	}

	/**
	 * Report progress
	 */
	private reportProgress(
		phase: GenerationProgress['phase'],
		progress: number,
		totalPhotos: number,
		currentPhoto?: number
	) {
		if (this.onProgress) {
			this.onProgress({
				phase,
				progress: Math.min(100, Math.max(0, progress)),
				currentPhoto,
				totalPhotos
			});
		}
	}

	/**
	 * Cleanup
	 */
	dispose() {
		if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
			this.mediaRecorder.stop();
		}
		this.recordedChunks = [];
	}
}
