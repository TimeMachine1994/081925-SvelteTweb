<script lang="ts">
	import { Upload, X, Plus, Play, Settings, Download, Camera, Video } from 'lucide-svelte';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { SimpleSlideshowGenerator } from '$lib/utils/SimpleSlideshowGenerator';

	interface SlideshowPhoto {
		id: string;
		file: File;
		preview: string;
		caption: string;
		duration: number;
	}

	interface SlideshowSettings {
		photoDuration: number;
		transitionType: 'fade' | 'slide' | 'zoom';
		videoQuality: 'low' | 'medium' | 'high';
		aspectRatio: '16:9' | '4:3' | '1:1';
	}

	// Props
	interface Props {
		memorialId?: string;
		maxPhotos?: number;
		maxFileSize?: number; // in MB
	}

	let { 
		memorialId, 
		maxPhotos = 30, 
		maxFileSize = 10 
	}: Props = $props();

	// State
	let photos = $state<SlideshowPhoto[]>([]);
	let isDragOver = $state(false);
	let isGenerating = $state(false);
	let generationProgress = $state(0);
	let generationPhase = $state<string>('');
	let currentPhoto = $state(0);
	let generatedVideoBlob = $state<Blob | null>(null);
	let showVideoPreview = $state(false);
	let previewVideoUrl = $state<string | null>(null);
	let hasDraft = $state(false);
	let isLoadingDraft = $state(false);
	let isSavingDraft = $state(false);
	let lastSaveTime = $state<Date | null>(null);
	let publishedSlideshow = $state<any>(null);
	let isPublished = $state(false);
	
	// Drag and drop state for photo reordering
	let draggedPhotoIndex = $state<number | null>(null);
	
	let settings = $state<SlideshowSettings>({
		photoDuration: 3,
		transitionType: 'fade', // Fixed to fade transition
		videoQuality: 'medium', // Fixed to 1080p
		aspectRatio: '16:9' // Fixed to widescreen
	});

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// Cleanup function
	function cleanup() {
		if (previewVideoUrl) {
			URL.revokeObjectURL(previewVideoUrl);
			previewVideoUrl = null;
		}
		// Clean up photo preview URLs
		photos.forEach(photo => {
			if (photo.preview) {
				URL.revokeObjectURL(photo.preview);
			}
		});
	}

	// Cleanup on component destroy
	onDestroy(() => {
		cleanup();
	});
	
	// File input reference
	let fileInput: HTMLInputElement;
	
	// Draft management
	// Auto-load draft and check for published slideshow on component mount
	$effect(() => {
		console.log('🎬 PhotoSlideshowCreator mounted with memorialId:', memorialId);
		if (memorialId) {
			loadDraftAndPublished();
		}
	});
	
	// Load both draft and published slideshow
	async function loadDraftAndPublished() {
		if (!memorialId) return;
		
		try {
			// First check for published slideshow
			await loadPublishedSlideshow();
			
			// If no published slideshow found, check for draft
			if (!isPublished) {
				await loadDraft();
			}
		} catch (error) {
			console.error('❌ Error loading slideshow data:', error);
		}
	}
	
	// Load published slideshow from memorial
	async function loadPublishedSlideshow() {
		if (!memorialId) {
			console.log('⚠️ No memorialId provided for slideshow loading');
			return;
		}
		
		try {
			console.log('🔍 Checking for published slideshow for memorial:', memorialId);
			console.log('🔍 Making API call to:', `/api/memorials/${memorialId}/slideshow`);
			
			const response = await fetch(`/api/memorials/${memorialId}/slideshow`);
			console.log('📡 API Response status:', response.status, response.statusText);
			
			if (response.ok) {
				const result = await response.json();
				console.log('📦 API Response data:', JSON.stringify(result, null, 2));
				
				// Handle both array response and object response
				let slideshow = null;
				
				if (Array.isArray(result) && result.length > 0) {
					// API returned array of slideshows, take the most recent one
					slideshow = result[0];
					console.log('📋 Found array of slideshows, using most recent:', slideshow.id);
				} else if (result.success && result.slideshow) {
					// API returned wrapped slideshow object
					slideshow = result.slideshow;
					console.log('📋 Found wrapped slideshow object:', slideshow.id);
				} else if (result.id) {
					// API returned single slideshow object
					slideshow = result;
					console.log('📋 Found single slideshow object:', slideshow.id);
				}
				
				if (slideshow) {
					publishedSlideshow = slideshow;
					isPublished = true;
					
					console.log('🎬 Published slideshow found:', {
						id: slideshow.id,
						title: slideshow.title,
						hasPhotos: slideshow.photos?.length || 0,
						hasPlaybackUrl: !!slideshow.playbackUrl,
						hasFirebaseUrl: !!slideshow.firebaseStorageUrl,
						playbackUrl: slideshow.playbackUrl,
						firebaseUrl: slideshow.firebaseStorageUrl
					});
					
					// Load the published slideshow photos for editing
					await loadPublishedPhotos(slideshow);
					
					console.log('✅ Loaded published slideshow successfully:', slideshow.id);
					return;
				} else {
					console.log('⚠️ No valid slideshow data found in response:', result);
				}
			} else {
				const errorText = await response.text();
				console.log('❌ API request failed:', response.status, errorText);
			}
			
			// No published slideshow found
			console.log('📝 No published slideshow found, will check for draft');
			isPublished = false;
			publishedSlideshow = null;
		} catch (error) {
			console.error('❌ Error loading published slideshow:', error);
			console.error('❌ Error details:', {
				message: error.message,
				stack: error.stack
			});
			isPublished = false;
			publishedSlideshow = null;
		}
	}
	
	// Load photos from published slideshow for editing
	async function loadPublishedPhotos(slideshow: any) {
		console.log('📸 Loading photos from published slideshow:', {
			photoCount: slideshow.photos?.length || 0,
			photos: slideshow.photos
		});
		
		if (!slideshow.photos || slideshow.photos.length === 0) {
			console.log('⚠️ No photos found in published slideshow');
			return;
		}
		
		try {
			console.log('🔄 Processing photos for editing...');
			const loadedPhotos = await Promise.all(
				slideshow.photos.map(async (slideshowPhoto: any, index: number) => {
					console.log(`📸 Processing photo ${index + 1}:`, {
						id: slideshowPhoto.id,
						hasUrl: !!slideshowPhoto.url,
						hasData: !!slideshowPhoto.data,
						url: slideshowPhoto.url,
						caption: slideshowPhoto.caption
					});
					
					// If photo has a Firebase Storage URL, use it
					if (slideshowPhoto.url) {
						try {
							console.log(`🌐 Fetching photo from URL via proxy: ${slideshowPhoto.url}`);
							// Use proxy endpoint to avoid CORS issues
							const proxyUrl = `/api/proxy/firebase-image?url=${encodeURIComponent(slideshowPhoto.url)}`;
							const response = await fetch(proxyUrl);
							if (!response.ok) {
								console.error(`❌ Failed to fetch photo ${slideshowPhoto.id} via proxy:`, response.status);
								return null;
							}
							const blob = await response.blob();
							const file = new File([blob], `photo-${slideshowPhoto.id}.jpg`, { type: 'image/jpeg' });
							
							console.log(`✅ Successfully loaded photo ${slideshowPhoto.id} from URL`);
							return {
								id: slideshowPhoto.id,
								file: file,
								preview: proxyUrl, // Use proxy URL for preview to avoid CORS issues
								caption: slideshowPhoto.caption || '',
								duration: slideshowPhoto.duration || settings.photoDuration,
								storedUrl: slideshowPhoto.url,
								storagePath: slideshowPhoto.storagePath
							};
						} catch (error) {
							console.error(`❌ Error loading photo ${slideshowPhoto.id} from URL:`, error);
							return null;
						}
					}
					
					// Fallback to base64 if available
					if (slideshowPhoto.data) {
						try {
							console.log(`📄 Loading photo ${slideshowPhoto.id} from base64 data`);
							const file = await base64ToFile(
								slideshowPhoto.data,
								`photo-${slideshowPhoto.id}.jpg`,
								'image/jpeg'
							);
							
							console.log(`✅ Successfully loaded photo ${slideshowPhoto.id} from base64`);
							return {
								id: slideshowPhoto.id,
								file: file,
								preview: slideshowPhoto.data,
								caption: slideshowPhoto.caption || '',
								duration: slideshowPhoto.duration || settings.photoDuration
							};
						} catch (error) {
							console.error(`❌ Error loading photo ${slideshowPhoto.id} from base64:`, error);
							return null;
						}
					}
					
					console.log(`⚠️ Photo ${slideshowPhoto.id} has no URL or base64 data`);
					return null;
				})
			);
			
			// Filter out failed conversions and set photos
			const validPhotos = loadedPhotos.filter(photo => photo !== null);
			console.log(`📊 Photo loading results: ${validPhotos.length}/${slideshow.photos.length} photos loaded successfully`);
			
			if (validPhotos.length > 0) {
				photos = validPhotos;
				console.log('✅ Photos set in component state');
				
				// Load slideshow settings if available
				if (slideshow.settings) {
					settings = { ...settings, ...slideshow.settings };
					console.log('⚙️ Slideshow settings loaded:', slideshow.settings);
				}
				
				// Set up video preview if slideshow has a playback URL
				if (slideshow.playbackUrl || slideshow.firebaseStorageUrl) {
					previewVideoUrl = slideshow.playbackUrl || slideshow.firebaseStorageUrl;
					showVideoPreview = true;
					console.log('🎥 Video preview setup:', {
						url: previewVideoUrl,
						showPreview: showVideoPreview
					});
				} else {
					console.log('⚠️ No video URL found in slideshow data');
				}
				
				// If no photos were loaded (due to CORS), create placeholder photos for display
				if (validPhotos.length === 0 && slideshow.photos && slideshow.photos.length > 0) {
					console.log('📸 Creating placeholder photos for display (CORS workaround)');
					photos = slideshow.photos.map((slideshowPhoto: any) => {
						// Use proxy URL for preview to avoid CORS issues
						const proxyUrl = `/api/proxy/firebase-image?url=${encodeURIComponent(slideshowPhoto.url)}`;
						return {
							id: slideshowPhoto.id,
							file: null, // Will be loaded when needed for editing
							preview: proxyUrl, // Use proxy URL for preview to avoid CORS issues
							caption: slideshowPhoto.caption || '',
							duration: slideshowPhoto.duration || settings.photoDuration,
							storedUrl: slideshowPhoto.url,
							storagePath: slideshowPhoto.storagePath,
							isPlaceholder: true // Flag to indicate this needs to be loaded for editing
						};
					});
					console.log(`✅ Created ${photos.length} placeholder photos for display`);
				}
				
				console.log(`✅ Successfully loaded ${validPhotos.length} photos from published slideshow`);
			} else {
				console.log('❌ No valid photos could be loaded from published slideshow');
			}
		} catch (error) {
			console.error('❌ Error loading published photos:', error);
			console.error('❌ Error details:', {
				message: error.message,
				stack: error.stack
			});
		}
	}
	
	// Unpublish slideshow (convert back to draft)
	async function unpublishSlideshow() {
		if (!publishedSlideshow?.id) return;
		
		try {
			console.log('🔄 Unpublishing slideshow:', publishedSlideshow.id);
			
			// Delete the published slideshow
			const response = await fetch(`/api/memorials/${memorialId}/slideshow`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				// Convert to draft
				isPublished = false;
				publishedSlideshow = null;
				
				// Save current state as draft
				await saveDraft();
				
				console.log('✅ Slideshow unpublished and converted to draft');
				alert('Slideshow unpublished! You can now edit and republish it.');
			} else {
				throw new Error('Failed to unpublish slideshow');
			}
		} catch (error) {
			console.error('❌ Error unpublishing slideshow:', error);
			alert('Failed to unpublish slideshow. Please try again.');
		}
	}
	
	// Save draft to database
	async function saveDraft() {
		if (!memorialId || photos.length === 0) {
			console.log('⚠️ Skipping draft save - memorialId:', memorialId, 'photos:', photos.length);
			return;
		}
		
		try {
			isSavingDraft = true;
			console.log('💾 Saving draft for memorial:', memorialId, 'with', photos.length, 'photos');
			
			// Convert photos to simple serializable format (avoid complex nested objects)
			const draftPhotos = photos.map((photo) => ({
				id: photo.id,
				caption: photo.caption || '',
				duration: photo.duration || settings.photoDuration,
				fileName: photo.file?.name || '',
				fileSize: photo.file?.size || 0,
				fileType: photo.file?.type || '',
				// Store preview URL if available, otherwise we'll need to re-upload
				preview: photo.preview || null,
				storedUrl: photo.storedUrl || null,
				storagePath: photo.storagePath || null
			}));
			
			// Clean settings object to ensure it's serializable
			const cleanSettings = {
				photoDuration: settings.photoDuration || 3,
				transitionType: settings.transitionType || 'fade',
				videoQuality: settings.videoQuality || 'medium',
				aspectRatio: settings.aspectRatio || '16:9'
			};
			
			console.log('📤 Sending draft data:', { memorialId, photoCount: draftPhotos.length, settings: cleanSettings });
			
			const response = await fetch('/api/slideshow/draft', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					memorialId,
					photos: draftPhotos,
					settings: cleanSettings
				})
			});
			
			if (response.ok) {
				hasDraft = true;
				lastSaveTime = new Date();
				console.log('✅ Draft saved to database successfully');
				return true;
			} else {
				const error = await response.json();
				console.error('❌ Failed to save draft:', error.error);
				return false;
			}
		} catch (error) {
			console.error('❌ Error saving draft:', error);
			return false;
		} finally {
			isSavingDraft = false;
		}
	}
	
	// Load draft from database
	async function loadDraft() {
		if (!memorialId) return;
		
		try {
			isLoadingDraft = true;
			console.log('🔍 Loading draft for memorial:', memorialId);
			
			const response = await fetch(`/api/slideshow/draft?memorialId=${memorialId}`);
			console.log('📡 Draft API response status:', response.status);
			
			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Draft API error:', response.status, errorText);
				hasDraft = false;
				return;
			}
			
			const result = await response.json();
			console.log('📦 Draft API result:', result);
			
			if (!result.success || !result.draft || !result.draft.photos) {
				hasDraft = false;
				return;
			}
			
			const draftData = result.draft;
			
			// Convert base64 back to File objects and create photos
			const loadedPhotos = await Promise.all(
				draftData.photos.map(async (draftPhoto: any) => {
					if (!draftPhoto.fileData) return null;
					
					try {
						// Convert base64 back to File
						const file = await base64ToFile(
							draftPhoto.fileData,
							draftPhoto.fileName,
							draftPhoto.fileType
						);
						
						return {
							id: draftPhoto.id,
							file: file,
							preview: URL.createObjectURL(file),
							caption: draftPhoto.caption || '',
							duration: draftPhoto.duration || settings.photoDuration
						};
					} catch (error) {
						console.error('Error converting draft photo:', error);
						return null;
					}
				})
			);
			
			// Filter out failed conversions
			const validPhotos = loadedPhotos.filter(photo => photo !== null);
			
			if (validPhotos.length > 0) {
				photos = validPhotos;
				if (draftData.settings) {
					settings = { ...settings, ...draftData.settings };
				}
				hasDraft = true;
				console.log(`✅ Loaded draft from database with ${validPhotos.length} photos`);
			} else {
				hasDraft = false;
			}
			
		} catch (error) {
			console.error('❌ Error loading draft:', error);
			hasDraft = false;
		} finally {
			isLoadingDraft = false;
		}
	}
	
	// Clear draft from database
	async function clearDraft() {
		if (!memorialId) return;
		
		try {
			const response = await fetch(`/api/slideshow/draft?memorialId=${memorialId}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				hasDraft = false;
				photos = [];
				console.log('🗑️ Draft cleared from database');
			} else {
				console.error('❌ Failed to clear draft');
			}
		} catch (error) {
			console.error('❌ Error clearing draft:', error);
		}
	}
	
	// Utility: Convert File to base64
	function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}
	
	// Utility: Convert base64 to File
	function base64ToFile(base64: string, fileName: string, fileType: string): Promise<File> {
		return new Promise((resolve) => {
			fetch(base64)
				.then(res => res.blob())
				.then(blob => {
					const file = new File([blob], fileName, { type: fileType });
					resolve(file);
				});
		});
	}
	
	// Auto-save draft when photos change (immediate for better UX)
	$effect(() => {
		if (photos.length > 0 && !isLoadingDraft) {
			// Short debounce for immediate feedback (500ms)
			const timeoutId = setTimeout(() => {
				saveDraft();
			}, 500);
			
			return () => clearTimeout(timeoutId);
		}
	});
	
	// Auto-save when settings change
	$effect(() => {
		if (photos.length > 0 && !isLoadingDraft) {
			const timeoutId = setTimeout(() => {
				saveDraft();
			}, 500);
			
			return () => clearTimeout(timeoutId);
		}
	});
	
	// Handle file selection
	function handleFileSelect(event: Event) {
		console.log('📁 File input changed, event:', event);
		const input = event.target as HTMLInputElement;
		console.log('📁 Input files:', input.files);
		if (input.files) {
			processFiles(Array.from(input.files));
		}
	}

	// Handle drag and drop
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		
		if (event.dataTransfer?.files) {
			processFiles(Array.from(event.dataTransfer.files));
		}
	}

	// Process uploaded files
	async function processFiles(files: File[]) {
		const validFiles = files.filter(file => {
			if (!file.type.startsWith('image/')) {
				alert(`File ${file.name} is not an image`);
				return false;
			}
			if (file.size > maxFileSize * 1024 * 1024) {
				alert(`File ${file.name} is too large (max ${maxFileSize}MB)`);
				return false;
			}
			return true;
		});

		validFiles.forEach(file => {
			const photo: SlideshowPhoto = {
				id: crypto.randomUUID(),
				file,
				preview: URL.createObjectURL(file),
				caption: '',
				duration: settings.photoDuration
			};

			photos = [...photos, photo];
		});

		console.log(`Added ${validFiles.length} photos. Total: ${photos.length}`);
		
		// Auto-save immediately after adding photos
		if (validFiles.length > 0) {
			setTimeout(() => saveDraft(), 100);
		}
	}

	// Create image preview
	function createImagePreview(file: File): Promise<string> {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = (e) => resolve(e.target?.result as string);
			reader.readAsDataURL(file);
		});
	}

	// Remove photo
	function removePhoto(id: string) {
		const index = photos.findIndex(p => p.id === id);
		if (index !== -1) {
			photos.splice(index, 1);
			photos = [...photos]; // Trigger reactivity
			
			// Auto-save immediately after removing photo
			setTimeout(() => saveDraft(), 100);
		}
	}
	
	// Photo reordering functions
	function handlePhotoDragStart(event: DragEvent, index: number) {
		draggedPhotoIndex = index;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
		}
	}
	
	function handlePhotoDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}
	
	function handlePhotoDrop(event: DragEvent, targetIndex: number) {
		event.preventDefault();
		
		if (draggedPhotoIndex === null || draggedPhotoIndex === targetIndex) return;
		
		// Reorder photos array
		const newPhotos = [...photos];
		const [draggedPhoto] = newPhotos.splice(draggedPhotoIndex, 1);
		newPhotos.splice(targetIndex, 0, draggedPhoto);
		
		photos = newPhotos;
		draggedPhotoIndex = null;
		
		console.log('Photos reordered');
		
		// Auto-save after reordering
		setTimeout(() => saveDraft(), 100);
	}
	
	function handlePhotoDragEnd() {
		draggedPhotoIndex = null;
	}


	// Reorder photos (drag and drop within grid)
	function movePhoto(fromIndex: number, toIndex: number) {
		const newPhotos = [...photos];
		const [movedPhoto] = newPhotos.splice(fromIndex, 1);
		newPhotos.splice(toIndex, 0, movedPhoto);
		photos = newPhotos;
	}

	// Generate slideshow video
	async function generateSlideshow() {
		if (photos.length === 0) {
			alert('Please add at least one photo.');
			return;
		}

		isGenerating = true;
		generationProgress = 0;
		generationPhase = 'Initializing...';
		currentPhoto = 0;
		generatedVideoBlob = null;

		try {
			// Create canvas for video generation
			const canvas = document.createElement('canvas');
			const generator = new SimpleSlideshowGenerator(canvas);
			
			// Progress callback
			const onProgress = (progress: GenerationProgress) => {
				generationProgress = progress.progress;
				currentPhoto = progress.currentPhoto || 0;
				
				switch (progress.phase) {
					case 'loading':
						generationPhase = `Loading images... (${progress.currentPhoto || 0}/${progress.totalPhotos})`;
						break;
					case 'rendering':
						generationPhase = `Rendering slideshow... (${progress.currentPhoto || 0}/${progress.totalPhotos})`;
						break;
					case 'encoding':
						generationPhase = 'Encoding video...';
						break;
					default:
						generationPhase = 'Processing...';
						break;
				}
			};

			console.log('🎬 Starting slideshow generation with:', { photos: photos.length, settings });
			
			// Generate the video
			const videoBlob = await generator.generateVideo(photos, settings, onProgress);
			
			// Cleanup
			generator.dispose();
			
			generatedVideoBlob = videoBlob;
			console.log('Slideshow generated successfully:', videoBlob.size, 'bytes');

			// Create preview URL and show video preview (hide photos)
			if (previewVideoUrl) {
				URL.revokeObjectURL(previewVideoUrl);
			}
			previewVideoUrl = URL.createObjectURL(videoBlob);
			showVideoPreview = true;
			generationPhase = 'Preview ready!';
			generationProgress = 100;

		} catch (error) {
			console.error('Error generating slideshow:', error);
			alert(`Failed to generate slideshow: ${error.message}`);
		} finally {
			isGenerating = false;
			generationProgress = 0;
			generationPhase = '';
			currentPhoto = 0;
		}
	}

	// Note: updateExistingSlideshow function removed since we no longer support edit mode

	// Upload video to Firebase Storage and update/create slideshow
	async function uploadToFirebase(videoBlob: Blob, photos: SlideshowPhoto[], settings: SlideshowSettings) {
		const formData = new FormData();
		formData.append('video', videoBlob, 'slideshow.webm');
		formData.append('memorialId', memorialId || '');
		formData.append('title', `Memorial Slideshow - ${new Date().toLocaleDateString()}`);
		
		// Send photo files directly instead of JSON
		photos.forEach((photo, index) => {
			// For new photos, send the file
			if (photo.file) {
				formData.append(`photo_${index}_file`, photo.file);
			}
			// Always send photo metadata
			formData.append(`photo_${index}_id`, photo.id);
			formData.append(`photo_${index}_caption`, photo.caption || '');
			formData.append(`photo_${index}_duration`, photo.duration.toString());
			
			// For existing photos, send the stored URL and path
			if (photo.storedUrl) {
				formData.append(`photo_${index}_url`, photo.storedUrl);
				formData.append(`photo_${index}_storagePath`, photo.storagePath || '');
			}
		});
		
		formData.append('settings', JSON.stringify(settings));
		
		// This is always a new slideshow since we removed edit mode

		const response = await fetch('/api/slideshow/upload-firebase', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || `Upload failed: ${response.status} ${response.statusText}`);
		}

		const result = await response.json();
		console.log('✅ Slideshow uploaded to Firebase successfully:', result);
		return result;
	}

	// Add slideshow to memorial (upload to Firebase)
	async function addToMemorial() {
		if (!generatedVideoBlob || !memorialId) return;

		try {
			isGenerating = true;
			generationPhase = 'Adding to memorial...';
			generationProgress = 95;

			const response = await uploadToFirebase(generatedVideoBlob, photos, settings);

			if (response.ok) {
				const result = await response.json();
				console.log('✅ Slideshow uploaded successfully:', result);
				
				// Clear draft since slideshow is now saved
				clearDraft();
				
				// Dispatch success event with upload confirmation
				dispatch('slideshowGenerated', {
					videoBlob: generatedVideoBlob,
					photos,
					settings,
					uploaded: true,
					result
				});
				
				alert('Slideshow uploaded successfully!');
			} else {
				console.error('Failed to upload slideshow');
				alert('Failed to upload slideshow. Please try again.');
			}
		} catch (error) {
			console.error('Error adding to memorial:', error);
			alert(`Failed to add to memorial: ${error.message}`);
		} finally {
			isGenerating = false;
			generationProgress = 0;
			generationPhase = '';
		}
	}

	// Save for later (just download)
	function saveForLater() {
		downloadVideo();
		// Dispatch event without upload
		dispatch('slideshowGenerated', {
			videoBlob: generatedVideoBlob,
			photos,
			settings,
			memorialId,
			uploaded: false
		});
		showPreview = false;
	}

	// Go back to edit photos (hide video, show photos)
	async function editVideo() {
		// If we have placeholder photos, load them properly for editing
		if (photos.some(photo => photo.isPlaceholder)) {
			console.log('📸 Loading placeholder photos for editing...');
			await loadPlaceholderPhotos();
		}
		
		showVideoPreview = false;
		previewVideoUrl = '';
	}
	
	// Load placeholder photos for actual editing
	async function loadPlaceholderPhotos() {
		try {
			const loadedPhotos = await Promise.all(
				photos.map(async (photo) => {
					if (!photo.isPlaceholder || photo.file) {
						return photo; // Already loaded
					}
					
					try {
						console.log(`🌐 Loading placeholder photo for editing: ${photo.id}`);
						const proxyUrl = `/api/proxy/firebase-image?url=${encodeURIComponent(photo.storedUrl)}`;
						const response = await fetch(proxyUrl);
						
						if (!response.ok) {
							console.error(`❌ Failed to load photo ${photo.id} for editing:`, response.status);
							return photo; // Keep as placeholder
						}
						
						const blob = await response.blob();
						const file = new File([blob], `photo-${photo.id}.jpg`, { type: 'image/jpeg' });
						
						return {
							...photo,
							file: file,
							isPlaceholder: false
						};
					} catch (error) {
						console.error(`❌ Error loading photo ${photo.id} for editing:`, error);
						return photo; // Keep as placeholder
					}
				})
			);
			
			photos = loadedPhotos;
			console.log('✅ Placeholder photos loaded for editing');
		} catch (error) {
			console.error('❌ Error loading placeholder photos:', error);
		}
	}

	// Save slideshow to memorial
	async function saveToMemorial() {
		if (!memorialId) return;
		
		// Check if we have a video to save
		if (!generatedVideoBlob) {
			console.log('No video to save - need to generate slideshow first');
			alert('Please generate a slideshow first before saving to memorial.');
			return;
		}

		try {
			isGenerating = true;
			generationPhase = 'Saving to memorial...';
			generationProgress = 95;

			// Upload new video to Firebase
			const result = await uploadToFirebase(generatedVideoBlob, photos, settings);

			if (result.slideshowId) {
				// Update published status
				isPublished = true;
				publishedSlideshow = {
					id: result.slideshowId,
					title: result.title || `Memorial Slideshow - ${new Date().toLocaleDateString()}`,
					playbackUrl: result.downloadURL,
					photos: photos.map(photo => ({
						id: photo.id,
						caption: photo.caption || '',
						duration: photo.duration || settings.photoDuration,
						url: photo.storedUrl || photo.preview,
						storagePath: photo.storagePath
					})),
					settings: settings
				};
				
				// Clear draft since slideshow is now published
				clearDraft();
				
				// Dispatch event to notify parent component
				dispatch('slideshowGenerated', {
					videoBlob: generatedVideoBlob,
					photos,
					settings,
					uploaded: true,
					result
				});

				alert('Slideshow published to memorial successfully!');
			}

			generationProgress = 100;
		} catch (error) {
			console.error('Error saving slideshow to memorial:', error);
			alert('Failed to save slideshow to memorial. Please try again.');
		} finally {
			isGenerating = false;
			generationProgress = 0;
			generationPhase = '';
		}
	}

	// Download generated video
	function downloadVideo() {
		if (!generatedVideoBlob) return;

		const url = URL.createObjectURL(generatedVideoBlob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `memorial-slideshow-${Date.now()}.webm`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	// Future: Download from Cloudflare in preferred format
	async function downloadFromCloudflare(format: 'webm' | 'mp4' = 'mp4') {
		// This would use the Cloudflare Stream API to get transcoded versions
		// Implementation would fetch the video in the requested format
		console.log(`Downloading ${format} version from Cloudflare...`);
	}

	// Clear all photos
	function clearPhotos() {
		if (confirm('Are you sure you want to remove all photos?')) {
			photos = [];
		}
	}
	
	// Save slideshow to memorial (with photos as base64)
	async function saveSlideshow() {
		if (!memorialId || photos.length === 0) {
			alert('Please add photos and ensure memorial ID is set.');
			return;
		}
		
		try {
			// Convert photos to base64 for storage
			const photosData = await Promise.all(
				photos.map(async (photo) => {
					let base64Data;
					
					if (photo.preview && photo.preview.startsWith('data:')) {
						// Already base64
						base64Data = photo.preview;
					} else if (photo.file) {
						// Convert file to base64
						base64Data = await fileToBase64(photo.file);
					} else {
						throw new Error('Photo has no file or preview data');
					}
					
					return {
						id: photo.id,
						data: base64Data,
						caption: photo.caption || '',
						duration: photo.duration || settings.photoDuration
					};
				})
			);
			
			const slideshowData = {
				id: crypto.randomUUID(),
				title: `Memorial Slideshow - ${new Date().toLocaleDateString()}`,
				photos: photosData,
				settings: {
					photoDuration: settings.photoDuration,
					transitionType: settings.transitionType,
					videoQuality: settings.videoQuality,
					aspectRatio: settings.aspectRatio
				},
				status: 'local_only',
				memorialId: memorialId
			};
			
			console.log('Saving slideshow data:', slideshowData);
			
			const response = await fetch(`/api/memorials/${memorialId}/slideshow`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(slideshowData)
			});
			
			if (response.ok) {
				alert('Slideshow saved successfully!');
				
				// Dispatch event for parent components (like Profile modal)
				dispatch('slideshowGenerated', {
					videoBlob: null, // No video blob for save-only operation
					photos: photos,
					settings: settings,
					memorialId: memorialId,
					uploaded: true,
					slideshow: slideshowData
				});
				
				// Refresh to show the updated slideshow
				await fetchExistingSlideshow();
			} else {
				const errorText = await response.text();
				console.error('Failed to save slideshow:', errorText);
				alert('Failed to save slideshow. Please try again.');
			}
		} catch (error) {
			console.error('Error saving slideshow:', error);
			alert('Error saving slideshow. Please try again.');
		}
	}
</script>

<div class="slideshow-creator">
	<!-- Header -->
	<div class="creator-header">
		{#if isLoadingDraft}
			<h2 class="creator-title">Loading draft...</h2>
			<p class="creator-subtitle">Restoring your saved photos</p>
		{:else}
			<div class="header-content">
				<div class="title-section">
					<h2 class="creator-title">
						<Upload class="title-icon" />
						Create Memorial Slideshow
					</h2>
					<p class="creator-subtitle">
						Upload photos to create a beautiful memorial slideshow
					</p>
					
					<!-- Add Photos Button - Always Visible -->
					<div class="header-actions">
						<button 
							class="add-photos-btn"
							onclick={() => {
								console.log('🖱️ Header add photos clicked');
								if (fileInput) {
									fileInput.click();
								}
							}}
							title="Add photos to slideshow"
						>
							<Upload class="btn-icon" />
							{photos.length === 0 ? 'Add Photos' : `Add More Photos (${photos.length}/30)`}
						</button>
					</div>
				</div>
				
				{#if photos.length > 0}
					<div class="draft-status">
						<div class="draft-controls">
							<span class="draft-badge">
								{#if isPublished}
									🌟 Published to Memorial
								{:else if isSavingDraft}
									💾 Saving...
								{:else if lastSaveTime}
									✅ Saved {new Date().getTime() - lastSaveTime.getTime() < 5000 ? 'just now' : 'recently'}
								{:else}
									📝 Auto-saving enabled
								{/if}
							</span>
							
							{#if isPublished}
								<button 
									class="unpublish-btn"
									onclick={unpublishSlideshow}
									title="Unpublish and convert back to draft for editing"
								>
									📝 Unpublish & Edit
								</button>
							{:else}
								<button 
									class="continue-later-btn"
									onclick={() => window.history.back()}
									title="Save progress and return to profile"
								>
									💾 Save & Continue Later
								</button>
								<button 
									class="clear-draft-btn"
									onclick={clearDraft}
									title="Clear draft and start fresh"
								>
									🗑️ Clear Draft
								</button>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>


	<!-- Upload Area -->
	{#if photos.length === 0}
		<div 
			class="upload-area"
			class:drag-over={isDragOver}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			role="button"
			tabindex="0"
			onclick={() => {
				console.log('🖱️ Upload area clicked, fileInput:', fileInput);
				if (fileInput) {
					fileInput.click();
				} else {
					console.error('❌ fileInput is not available');
				}
			}}
			onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
		>
			<div class="upload-content">
				<Upload class="upload-icon" />
				<h3 class="upload-title">Add Photos to Slideshow</h3>
				<p class="upload-text">
					Drag and drop photos here, or click to browse
				</p>
				<p class="upload-limits">
					Maximum 30 photos • 10MB per file
				</p>
			</div>
		</div>
	{/if}

	<!-- Photo Grid -->
	{#if photos.length > 0}
		<div class="photo-section">
			<!-- Settings Panel - Always Visible -->
			<div class="settings-panel">
				<h4 class="settings-title">Slideshow Settings</h4>
				<div class="settings-grid">
					<div class="setting-item">
						<label for="photo-duration">Photo Duration (seconds)</label>
						<input 
							id="photo-duration"
							type="range" 
							min="1" 
							max="10" 
							step="0.5"
							bind:value={settings.photoDuration}
							class="range-input"
						/>
						<span class="range-value">{settings.photoDuration}s</span>
					</div>


				</div>
			</div>

			{#if !showVideoPreview}
				<!-- Photo Grid View -->
				<div class="section-header">
					<h3 class="section-title">Photos ({photos.length})</h3>
					<div class="section-actions">
						<button 
							class="action-btn danger"
							onclick={clearPhotos}
						>
							<X class="btn-icon" />
							Clear All
						</button>
					</div>
				</div>

				<!-- Photo Grid -->
				<div class="photo-grid">
					{#each photos as photo, index (photo.id)}
						<div 
							class="photo-card"
							class:dragging={draggedPhotoIndex === index}
							draggable="true"
							ondragstart={(e) => handlePhotoDragStart(e, index)}
							ondragover={handlePhotoDragOver}
							ondrop={(e) => handlePhotoDrop(e, index)}
							ondragend={handlePhotoDragEnd}
							title="Drag to reorder photos"
						>
							<div class="photo-preview">
								<img src={photo.preview} alt="Photo {index + 1}" />
								<button 
									class="remove-btn"
									onclick={() => removePhoto(photo.id)}
									aria-label="Remove photo"
								>
									<X class="remove-icon" />
								</button>
								<div class="photo-number">#{index + 1}</div>
							</div>
						</div>
					{/each}
					
					<!-- Add More Photos Button -->
					{#if photos.length < maxPhotos}
						<div 
							class="add-more-card"
							onclick={() => {
								console.log('🖱️ Add more photos clicked');
								if (fileInput) {
									fileInput.click();
								}
							}}
							role="button"
							tabindex="0"
							title="Add more photos"
						>
							<div class="add-more-content">
								<Upload class="add-more-icon" />
								<span class="add-more-text">Add More Photos</span>
								<span class="add-more-limit">{photos.length}/{maxPhotos}</span>
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Video Preview View -->
				<div class="section-header">
					<h3 class="section-title">
						{isPublished ? 'Published Slideshow' : 'Video Preview'}
						{#if isPublished}
							<span class="published-indicator">🌟 Live on Memorial</span>
						{/if}
					</h3>
					<div class="section-actions">
						<button 
							class="action-btn secondary"
							onclick={editVideo}
						>
							<Settings class="btn-icon" />
							Edit Video
						</button>
						{#if memorialId && showVideoPreview}
							<button 
								class="action-btn primary"
								onclick={saveToMemorial}
								disabled={isGenerating}
							>
								{#if isGenerating}
									<svg class="btn-icon animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
									</svg>
									Saving...
								{:else}
									<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
									</svg>
									{isPublished ? 'Update Memorial' : 'Save to Memorial'}
								{/if}
							</button>
						{/if}
					</div>
				</div>

				<div class="video-preview-container">
					<div class="video-preview">
						<video 
							src={previewVideoUrl} 
							controls 
							class="preview-video"
							preload="metadata"
						>
							<track kind="captions" src="" srclang="en" label="English" />
							Your browser does not support the video tag.
						</video>
					</div>
					<p class="video-info">
						Video size: {generatedVideoBlob ? (generatedVideoBlob.size / 1024 / 1024).toFixed(2) : '0'} MB • {photos.length} photos
					</p>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="generate-section">
				{#if isGenerating}
					<div class="progress-container">
						<div class="progress-header">
							<h4 class="progress-title">Generating Slideshow</h4>
							<span class="progress-percentage">{Math.round(generationProgress)}%</span>
						</div>
						<div class="progress-bar">
							<div 
								class="progress-fill" 
								style="width: {generationProgress}%"
							></div>
						</div>
						<p class="progress-text">{generationPhase}</p>
						{#if currentPhoto > 0}
							<p class="progress-detail">
								Processing photo {currentPhoto} of {photos.length}
							</p>
						{/if}
					</div>
				{:else if showVideoPreview}
					<!-- Video Preview Actions - Save to Memorial moved to section header -->
					<div class="video-actions">
						<!-- Save to Memorial button moved to section header next to Edit Video -->
					</div>
				{:else}
					<!-- Generate Button -->
					<button 
						class="generate-btn"
						onclick={generateSlideshow}
						disabled={photos.length === 0}
					>
						<Play class="btn-icon" />
						Generate Slideshow
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Hidden file input -->
	<input 
		bind:this={fileInput}
		type="file" 
		multiple 
		accept="image/*"
		onchange={handleFileSelect}
		style="display: none;"
	/>
</div>

<style>
	.slideshow-creator {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* Header */
	.creator-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.creator-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		font-size: 2rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.title-icon {
		width: 2rem;
		height: 2rem;
		color: #D5BA7F;
	}

	.creator-subtitle {
		color: #6b7280;
		font-size: 1.1rem;
		margin: 0;
	}

	.skip-loading-btn {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #6b7280;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.skip-loading-btn:hover {
		background: #4b5563;
	}

	.editing-header {
		text-align: left;
	}

	.back-btn {
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		font-size: 0.9rem;
		margin-bottom: 1rem;
		padding: 0.5rem 0;
		transition: color 0.2s ease;
	}

	.back-btn:hover {
		color: #D5BA7F;
	}

	/* Existing Slideshows Section */
	.existing-slideshows-section {
		margin-bottom: 3rem;
		padding: 2rem;
		background: #f8fafc;
		border-radius: 16px;
		border: 1px solid #e2e8f0;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}

	.new-slideshow-btn,
	.start-new-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #D5BA7F;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.new-slideshow-btn:hover,
	.start-new-btn:hover {
		background: #c4a96e;
		transform: translateY(-1px);
	}

	.btn-icon {
		width: 1rem;
		height: 1rem;
	}

	.loading-state,
	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
		color: #6b7280;
	}

	.empty-state p {
		margin-bottom: 1.5rem;
		font-size: 1.1rem;
	}

	.slideshows-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.slideshow-card {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.slideshow-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.slideshow-preview {
		position: relative;
		aspect-ratio: 16/9;
		background: #f3f4f6;
	}

	.preview-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.photo-count {
		position: absolute;
		bottom: 0.5rem;
		right: 0.5rem;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.no-preview {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #9ca3af;
	}

	.camera-icon {
		width: 2rem;
		height: 2rem;
	}

	.slideshow-info {
		padding: 1rem;
	}

	.slideshow-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.slideshow-date {
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0 0 1rem 0;
	}

	.edit-slideshow-btn {
		width: 100%;
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.edit-slideshow-btn:hover {
		background: #2563eb;
	}

	/* Upload Area */
	.upload-area {
		border: 2px dashed #d1d5db;
		border-radius: 12px;
		padding: 3rem 2rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s ease;
		background: #f9fafb;
		pointer-events: auto;
		position: relative;
		z-index: 1;
		user-select: none;
	}

	.upload-area:hover,
	.upload-area.drag-over {
		border-color: #D5BA7F;
		background: #fffbf5;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(213, 186, 127, 0.2);
	}

	.upload-content {
		max-width: 400px;
		margin: 0 auto;
	}

	.upload-icon {
		width: 3rem;
		height: 3rem;
		color: #9ca3af;
		margin-bottom: 1rem;
	}

	.upload-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 0.5rem 0;
	}

	.upload-text {
		color: #6b7280;
		margin: 0 0 1rem 0;
	}

	.upload-limits {
		color: #9ca3af;
		font-size: 0.9rem;
		margin: 0;
	}

	/* Add More Photos Section */
	.add-more-section {
		margin: 2rem 0;
	}

	.add-more-section h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.add-more-area {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1.5rem;
		border: 2px dashed #d1d5db;
		border-radius: 8px;
		background: #f9fafb;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-more-area:hover,
	.add-more-area.drag-over {
		border-color: #D5BA7F;
		background: #fffbf5;
	}

	.add-icon {
		width: 1.5rem;
		height: 1.5rem;
		color: #6b7280;
	}

	.add-more-area span {
		color: #6b7280;
		font-weight: 500;
	}

	/* Photo Section */
	.photo-section {
		margin-top: 2rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}

	.section-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: white;
		color: #374151;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn:hover {
		background: #f3f4f6;
	}

	.action-btn.primary {
		background: #D5BA7F;
		color: white;
		border-color: #D5BA7F;
		font-weight: 600;
	}

	.action-btn.primary:hover {
		background: #c4a96e;
		border-color: #c4a96e;
	}

	.action-btn.secondary {
		border-color: #D5BA7F;
		color: #92400e;
	}

	.action-btn.secondary:hover {
		background: #fffbf5;
	}

	.action-btn.danger {
		border-color: #ef4444;
		color: #dc2626;
	}

	.action-btn.danger:hover {
		background: #fef2f2;
	}

	.btn-icon {
		width: 1rem;
		height: 1rem;
	}

	/* Settings Panel */
	.settings-panel {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.settings-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 1rem 0;
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.setting-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.setting-item label {
		font-size: 0.9rem;
		font-weight: 500;
		color: #374151;
	}

	.range-input,
	.select-input {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.range-value {
		font-size: 0.8rem;
		color: #6b7280;
		text-align: center;
	}

	/* Photo Grid */
	.photo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.photo-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
		transition: all 0.2s ease;
		cursor: grab;
	}

	.photo-card:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}
	
	.photo-card:active {
		cursor: grabbing;
	}
	
	.photo-card.dragging {
		opacity: 0.5;
		transform: rotate(2deg) scale(0.95);
		z-index: 1000;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
	}

	.photo-preview {
		position: relative;
		aspect-ratio: 16/9;
		overflow: hidden;
	}

	.photo-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.remove-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 2rem;
		height: 2rem;
		background: rgba(0, 0, 0, 0.7);
		border: none;
		border-radius: 50%;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.remove-btn:hover {
		background: rgba(239, 68, 68, 0.9);
	}

	.remove-icon {
		width: 1rem;

.remove-btn:hover {
	background: rgba(239, 68, 68, 0.9);
}

.remove-icon {
	width: 1rem;
	height: 1rem;
}
	}

	.video-preview {
		position: relative;
		width: 100%;
		aspect-ratio: 16/9;
		background: #000;
		border-radius: 12px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.preview-video {
		width: 100%;
		height: 100%;
		border: none;
		display: block;
	}

	/* Draft Status Styles */
	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.title-section {
		flex: 1;
	}

	.draft-status {
		flex-shrink: 0;
	}

	.draft-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 8px;
		padding: 0.5rem 0.75rem;
	}

	.draft-badge {
		font-size: 0.875rem;
		font-weight: 500;
		color: #1d4ed8;
	}

	.continue-later-btn {
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.2);
		color: #16a34a;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-weight: 500;
	}

	.continue-later-btn:hover {
		background: rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.3);
		transform: translateY(-1px);
	}

	.clear-draft-btn {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: #dc2626;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.clear-draft-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.3);
	}

	.unpublish-btn {
		background: rgba(251, 191, 36, 0.1);
		border: 1px solid rgba(251, 191, 36, 0.2);
		color: #d97706;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-weight: 500;
	}

	.unpublish-btn:hover {
		background: rgba(251, 191, 36, 0.2);
		border-color: rgba(251, 191, 36, 0.3);
		transform: translateY(-1px);
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			align-items: stretch;
		}
		
		.draft-controls {
			justify-content: space-between;
			flex-wrap: wrap;
		}
	}

	.video-info {
		text-align: center;
		color: #6b7280;
		font-size: 0.9rem;
		margin: 0;
	}

	.video-actions {
		display: flex;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	/* Generate Section */
	.generate-section {
		text-align: center;
		padding: 2rem;
		background: #f9fafb;
		border-radius: 8px;
	}

	.generate-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		background: #D5BA7F;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.generate-btn:hover:not(:disabled) {
		background: #c4a96e;
		transform: translateY(-1px);
	}

	.generate-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.progress-container {
		max-width: 500px;
		margin: 0 auto;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.progress-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}

	.progress-percentage {
		font-size: 1.1rem;
		font-weight: 600;
		color: #D5BA7F;
	}

	.progress-bar {
		width: 100%;
		height: 12px;
		background: #e5e7eb;
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 1rem;
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #D5BA7F 0%, #c4a96e 100%);
		transition: width 0.3s ease;
		border-radius: 6px;
	}

	.progress-text {
		color: #374151;
		font-size: 1rem;
		font-weight: 500;
		margin: 0 0 0.5rem 0;
		text-align: center;
	}

	.progress-detail {
		color: #6b7280;
		font-size: 0.9rem;
		margin: 0;
		text-align: center;
	}

	.success-container {
		max-width: 500px;
		margin: 0 auto;
		text-align: center;
	}

	.success-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #059669;
		margin: 0 0 0.5rem 0;
	}

	.success-text {
		color: #6b7280;
		font-size: 0.9rem;
		margin: 0 0 1.5rem 0;
	}

	.success-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.preview-container {
		max-width: 600px;
		margin: 0 auto;
		text-align: center;
	}

	.preview-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.preview-text {
		color: #6b7280;
		font-size: 0.9rem;
		margin: 0 0 1.5rem 0;
	}

	.video-preview {
		margin: 0 0 2rem 0;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		background: #000;
	}

	.preview-video {
		width: 100%;
		height: auto;
		max-height: 400px;
		display: block;
		border-radius: 12px;
	}

	.preview-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
		align-items: center;
	}


	.btn-icon {
		width: 16px;
		height: 16px;
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive */
	@media (max-width: 768px) {
		.slideshow-creator {
			padding: 1rem;
		}

		.creator-title {
			font-size: 1.5rem;
		}

		.upload-area {
			padding: 2rem 1rem;
		}

		.section-header {
			flex-direction: column;
			align-items: stretch;
		}

		.section-actions {
			justify-content: center;
		}

		.photo-grid {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		}

		.settings-grid {
			grid-template-columns: 1fr;
		}
	}

	/* Add More Photos Card */
	.add-more-card {
		aspect-ratio: 16/9;
		border: 2px dashed #d1d5db;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		background: #f9fafb;
		min-height: 120px;
	}

	.add-more-card:hover {
		border-color: #D5BA7F;
		background: #fffbf5;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(213, 186, 127, 0.2);
	}

	.add-more-content {
		text-align: center;
		color: #6b7280;
	}

	.add-more-icon {
		width: 1.5rem;
		height: 1.5rem;
		margin: 0 auto 0.5rem;
		display: block;
		color: #9ca3af;
	}

	.add-more-text {
		display: block;
		font-weight: 500;
		margin-bottom: 0.25rem;
		color: #374151;
		font-size: 0.875rem;
	}

	.add-more-limit {
		font-size: 0.75rem;
		color: #6b7280;
	}

	/* Header Add Photos Button */
	.header-actions {
		margin-top: 1rem;
	}

	.add-photos-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #D5BA7F;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
	}

	.add-photos-btn:hover {
		background: #C5AA6F;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(213, 186, 127, 0.3);
	}

	.add-photos-btn .btn-icon {
		width: 1rem;
		height: 1rem;
	}

	/* Published Indicator */
	.published-indicator {
		font-size: 0.75rem;
		font-weight: 400;
		color: #059669;
		margin-left: 0.5rem;
		background: rgba(5, 150, 105, 0.1);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		border: 1px solid rgba(5, 150, 105, 0.2);
	}
</style>
