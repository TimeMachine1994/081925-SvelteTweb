# Slideshow Audio Integration Fix Plan

## 🎯 Objective
Fix the slideshow generator to properly integrate background music with the video, ensuring audio is uploaded before video generation and mixed into the final output.

---

## 🐛 Current Problems

### 1. **Wrong UI Placement**
- AudioUploader appears AFTER "Create Slideshow Video" button (Step 3)
- Hides when video preview is shown (`!showVideoPreview` condition)
- Users see audio upload option only after generating video

### 2. **Audio Not Passed to Generator**
```typescript
// PhotoSlideshowCreator.svelte Line 840
const videoBlob = await generator.generateVideo(photos, settings, onProgress);
// ❌ No audio parameter passed
```

### 3. **Generator Doesn't Support Audio**
```typescript
// SimpleSlideshowGenerator.ts Line 46-50
async generateVideo(
    photos: SlideshowPhoto[],
    settings: SlideshowSettings,
    onProgress?: (progress: GenerationProgress) => void
): Promise<Blob> {
    // ❌ No audio parameter accepted
}
```

### 4. **MediaRecorder Only Captures Video**
```typescript
// SimpleSlideshowGenerator.ts Line 136
const stream = this.canvas.captureStream(30);
// ❌ Only video track, no audio mixed in
```

### 5. **Audio Not Saved with Metadata**
- Audio settings are saved to metadata (lines 955-960)
- But audio file itself is not uploaded to Firebase Storage
- Only name and duration are saved, not the actual audio URL

---

## ✅ Solution Implementation

### **Phase 1: Move AudioUploader to Correct Position**

**File:** `PhotoSlideshowCreator.svelte`

**Change Location:** Lines 1771-1782

**Current Code:**
```svelte
<!-- Step 2.5: Background Music (Optional) -->
{#if photos.length > 0 && !showVideoPreview}
    <div class="workflow-step active">
        <AudioUploader 
            bind:audio={audioTrack}
            bind:volume={audioVolume}
            bind:fadeIn={audioFadeIn}
            bind:fadeOut={audioFadeOut}
            maxFileSize={50}
        />
    </div>
{/if}
```

**New Code (Move BEFORE Step 3):**
```svelte
<!-- Step 2.5: Background Music (Optional) - Show when photos exist and not published -->
{#if photos.length > 0 && (!isPublished || hasDraftChanges)}
    <div class="workflow-step active">
        <div class="step-header">
            <div class="step-number">2.5</div>
            <h3 class="step-title">Background Music (Optional)</h3>
            {#if audioTrack}
                <div class="step-status completed">✓ Music added</div>
            {/if}
        </div>
        <AudioUploader 
            bind:audio={audioTrack}
            bind:volume={audioVolume}
            bind:fadeIn={audioFadeIn}
            bind:fadeOut={audioFadeOut}
            maxFileSize={50}
        />
    </div>
{/if}

<!-- Step 3: Settings & Generate -->
{#if photos.length > 0 && (!isPublished || hasDraftChanges)}
    <!-- ... existing Step 3 code ... -->
{/if}
```

**Why This Works:**
- Shows audio upload BEFORE video generation
- Stays visible during entire creation process
- Proper step numbering (2.5) indicates optional intermediate step
- Status indicator shows when audio is added

---

### **Phase 2: Upload Audio to Firebase Storage**

**File:** `PhotoSlideshowCreator.svelte`

**New Function to Add (After line 619):**
```typescript
// Upload audio file to Firebase Storage
async function uploadAudioToFirebaseStorage(
    audioFile: File,
    memorialId: string
): Promise<{ downloadURL: string; storagePath: string }> {
    try {
        console.log('🎵 Uploading audio to Firebase Storage...');
        
        const timestamp = Date.now();
        const fileName = `audio-${timestamp}-${audioFile.name}`;
        const storagePath = `slideshows/${memorialId}/audio/${fileName}`;
        
        // Use client-side Firebase Storage upload
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, audioFile);
        
        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`🎵 Audio upload progress: ${progress.toFixed(1)}%`);
                },
                (error) => {
                    console.error('❌ Audio upload failed:', error);
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log('✅ Audio uploaded:', downloadURL);
                    resolve({ downloadURL, storagePath });
                }
            );
        });
    } catch (error) {
        console.error('❌ Error uploading audio:', error);
        throw error;
    }
}
```

**Update uploadToFirebase function (Line 896):**
```typescript
async function uploadToFirebase(videoBlob: Blob, photos: SlideshowPhoto[], settings: SlideshowSettings) {
    try {
        const title = `Memorial Slideshow - ${new Date().toLocaleDateString()}`;
        
        // Step 1: Upload audio if present
        let audioData = null;
        if (audioTrack?.file) {
            generationPhase = 'Uploading audio...';
            generationProgress = 85;
            
            const audioResult = await uploadAudioToFirebaseStorage(
                audioTrack.file,
                memorialId || ''
            );
            
            audioData = {
                name: audioTrack.name,
                duration: audioTrack.duration,
                url: audioResult.downloadURL,
                storagePath: audioResult.storagePath
            };
            
            console.log('✅ Audio uploaded:', audioData);
        }
        
        // Step 2: Upload video to Firebase Storage
        console.log('📤 [CLIENT] Uploading video to Firebase Storage...');
        generationPhase = 'Uploading video...';
        
        const videoResult = await uploadVideoToFirebaseStorage(
            videoBlob,
            memorialId || '',
            title,
            (progress) => {
                generationProgress = 90 + (progress * 0.05); // 90-95%
            }
        );
        
        // ... rest of existing code ...
        
        // Step 4: Include audio in metadata
        const metadata = {
            memorialId: memorialId || '',
            title,
            videoUrl: videoResult.downloadURL,
            videoStoragePath: videoResult.storagePath,
            photos: allPhotos,
            settings: settingsWithAudio,
            audio: audioData // Now includes actual Firebase Storage URL
        };
        
        // ... rest of existing code ...
    } catch (error) {
        console.error('❌ Upload failed:', error);
        throw error;
    }
}
```

---

### **Phase 3: Update SimpleSlideshowGenerator to Support Audio**

**File:** `SimpleSlideshowGenerator.ts`

**Update Interface (Line 13-18):**
```typescript
export interface SlideshowSettings {
    photoDuration: number;
    transitionType: 'fade' | 'slide' | 'none';
    videoQuality: 'low' | 'medium' | 'high';
    aspectRatio: '16:9' | '4:3' | '1:1';
    audioVolume?: number;      // NEW
    audioFadeIn?: boolean;     // NEW
    audioFadeOut?: boolean;    // NEW
}
```

**Add Audio Interface (After line 25):**
```typescript
export interface SlideshowAudio {
    file: File;
    duration: number;
    volume: number;
    fadeIn: boolean;
    fadeOut: boolean;
}
```

**Update Class Properties (Line 27-32):**
```typescript
export class SimpleSlideshowGenerator {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];
    private onProgress?: (progress: GenerationProgress) => void;
    private audioContext: AudioContext | null = null;           // NEW
    private audioBuffer: AudioBuffer | null = null;             // NEW
    private audioSource: AudioBufferSourceNode | null = null;   // NEW
    private audioDestination: MediaStreamAudioDestinationNode | null = null; // NEW
```

**Update generateVideo Method (Line 46-75):**
```typescript
async generateVideo(
    photos: SlideshowPhoto[],
    settings: SlideshowSettings,
    onProgress?: (progress: GenerationProgress) => void,
    audio?: SlideshowAudio  // NEW PARAMETER
): Promise<Blob> {
    this.onProgress = onProgress;
    
    if (photos.length === 0) {
        throw new Error('No photos provided');
    }

    console.log('🎬 Starting simplified video generation...');
    console.log('📊 Input:', { 
        photoCount: photos.length, 
        settings,
        hasAudio: !!audio 
    });

    try {
        // Setup canvas
        this.setupCanvas(settings);
        
        // Load audio if provided
        if (audio?.file) {
            await this.loadAudio(audio);
        }
        
        // Load images
        const images = await this.loadImages(photos);
        console.log(`✅ Loaded ${images.length} images`);

        // Calculate total slideshow duration
        const totalDuration = photos.reduce((sum, photo) => sum + photo.duration, 0);
        
        // Generate video with MediaRecorder (with or without audio)
        return await this.generateWithMediaRecorder(images, photos, settings, totalDuration, audio);
        
    } catch (error) {
        console.error('❌ Video generation failed:', error);
        throw error;
    }
}
```

**Add Audio Loading Method (After line 120):**
```typescript
/**
 * Load and prepare audio file
 */
private async loadAudio(audio: SlideshowAudio): Promise<void> {
    try {
        console.log('🎵 Loading audio file...');
        
        // Create audio context
        this.audioContext = new AudioContext();
        
        // Read file as ArrayBuffer
        const arrayBuffer = await audio.file.arrayBuffer();
        
        // Decode audio data
        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        console.log(`✅ Audio loaded: ${this.audioBuffer.duration.toFixed(2)}s`);
        
    } catch (error) {
        console.error('❌ Failed to load audio:', error);
        throw new Error('Failed to load audio file');
    }
}
```

**Update generateWithMediaRecorder Method (Line 125-209):**
```typescript
private async generateWithMediaRecorder(
    images: HTMLImageElement[],
    photos: SlideshowPhoto[],
    settings: SlideshowSettings,
    totalDuration: number,
    audio?: SlideshowAudio
): Promise<Blob> {
    console.log('🎥 Starting MediaRecorder generation...');

    // Draw first frame to initialize canvas
    this.drawPhoto(images[0], photos[0].caption || '');
    
    // Get canvas video stream
    const videoStream = this.canvas.captureStream(30);
    console.log('📹 Canvas stream created');

    // Prepare final stream
    let finalStream: MediaStream;
    
    if (audio && this.audioContext && this.audioBuffer) {
        console.log('🎵 Mixing audio with video...');
        
        // Create audio destination node
        this.audioDestination = this.audioContext.createMediaStreamDestination();
        
        // Create audio source
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = this.audioBuffer;
        
        // Apply volume
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = audio.volume;
        
        // Handle looping if audio is shorter than video
        if (this.audioBuffer.duration < totalDuration) {
            console.log('🔁 Audio will loop (shorter than slideshow)');
            this.audioSource.loop = true;
        }
        
        // Handle fade in
        if (audio.fadeIn) {
            console.log('🎵 Applying fade in (2s)');
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(audio.volume, this.audioContext.currentTime + 2);
        }
        
        // Handle fade out if audio is longer than video
        if (this.audioBuffer.duration > totalDuration && audio.fadeOut) {
            console.log('🎵 Will apply fade out at end');
            const fadeOutStart = totalDuration - 2; // 2 seconds before end
            gainNode.gain.setValueAtTime(audio.volume, this.audioContext.currentTime + fadeOutStart);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + totalDuration);
        }
        
        // Connect audio nodes
        this.audioSource.connect(gainNode);
        gainNode.connect(this.audioDestination);
        
        // Start audio playback
        this.audioSource.start(0);
        
        // Combine video and audio streams
        const audioTrack = this.audioDestination.stream.getAudioTracks()[0];
        const videoTrack = videoStream.getVideoTracks()[0];
        
        finalStream = new MediaStream([videoTrack, audioTrack]);
        console.log('✅ Audio and video streams combined');
        
    } else {
        // No audio, use video stream only
        finalStream = videoStream;
        console.log('📹 Using video stream only (no audio)');
    }

    // Check for video track
    const videoTrack = finalStream.getVideoTracks()[0];
    if (!videoTrack) {
        throw new Error('No video track available');
    }

    console.log('📺 Final stream ready:', {
        videoTracks: finalStream.getVideoTracks().length,
        audioTracks: finalStream.getAudioTracks().length
    });

    // Find supported codec
    const codecs = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
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
    this.mediaRecorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: 2000000, // 2 Mbps for better quality with audio
        audioBitsPerSecond: 128000   // 128 kbps for audio
    });

    // Setup event handlers
    this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            console.log(`📦 Chunk: ${event.data.size} bytes`);
            this.recordedChunks.push(event.data);
        }
    };

    // Start recording and render
    return new Promise((resolve, reject) => {
        this.mediaRecorder!.onstop = () => {
            console.log(`🛑 Recording stopped. Chunks: ${this.recordedChunks.length}`);
            
            // Stop audio source if exists
            if (this.audioSource) {
                this.audioSource.stop();
                this.audioSource.disconnect();
            }
            
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
```

**Update dispose Method (Line 316-322):**
```typescript
dispose() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
    }
    if (this.audioSource) {
        this.audioSource.stop();
        this.audioSource.disconnect();
    }
    if (this.audioContext) {
        this.audioContext.close();
    }
    this.recordedChunks = [];
}
```

---

### **Phase 4: Update generateSlideshow to Pass Audio**

**File:** `PhotoSlideshowCreator.svelte`

**Update generateSlideshow function (Line 799-891):**
```typescript
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

        console.log('🎬 Starting slideshow generation with:', { 
            photos: photos.length, 
            settings,
            hasAudio: !!audioTrack 
        });
        
        // Prepare audio parameter if audio is selected
        const audioParam = audioTrack ? {
            file: audioTrack.file!,
            duration: audioTrack.duration,
            volume: audioVolume,
            fadeIn: audioFadeIn,
            fadeOut: audioFadeOut
        } : undefined;
        
        // Generate the video WITH AUDIO
        const videoBlob = await generator.generateVideo(
            photos, 
            settings, 
            onProgress,
            audioParam  // ✅ NOW PASSING AUDIO
        );
        
        // Cleanup
        generator.dispose();
        
        generatedVideoBlob = videoBlob;
        console.log('✅ Slideshow generated successfully:', videoBlob.size, 'bytes');

        // Create preview URL and show video preview
        if (previewVideoUrl) {
            URL.revokeObjectURL(previewVideoUrl);
        }
        previewVideoUrl = URL.createObjectURL(videoBlob);
        showVideoPreview = true;
        generationPhase = 'Preview ready!';
        generationProgress = 100;

        // Auto-scroll to step 4 on mobile
        setTimeout(() => {
            if (window.innerWidth <= 768) {
                const step4Element = document.querySelector('.workflow-step:nth-of-type(4)');
                if (step4Element) {
                    step4Element.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }
            }
        }, 500);

    } catch (error) {
        console.error('❌ Error generating slideshow:', error);
        alert(`Failed to generate slideshow: ${error.message}`);
    } finally {
        isGenerating = false;
        generationProgress = 0;
        generationPhase = '';
        currentPhoto = 0;
    }
}
```

**Update generateDraftVideo function (Line 1266-1333) similarly:**
```typescript
async function generateDraftVideo() {
    if (photos.length === 0) return;

    try {
        isGenerating = true;
        generationProgress = 0;
        generationPhase = 'Generating draft video...';
        currentPhoto = 0;

        const canvas = document.createElement('canvas');
        const generator = new SimpleSlideshowGenerator(canvas);
        
        const onProgress = (progress: GenerationProgress) => {
            generationProgress = progress.progress;
            currentPhoto = progress.currentPhoto || 0;
            
            switch (progress.phase) {
                case 'loading':
                    generationPhase = `Loading images... (${progress.currentPhoto || 0}/${progress.totalPhotos})`;
                    break;
                case 'rendering':
                    generationPhase = `Rendering draft... (${progress.currentPhoto || 0}/${progress.totalPhotos})`;
                    break;
                case 'encoding':
                    generationPhase = 'Encoding draft video...';
                    break;
                default:
                    generationPhase = 'Processing draft...';
                    break;
            }
        };

        console.log('🎬 Starting draft video generation with:', { 
            photos: photos.length, 
            settings,
            hasAudio: !!audioTrack 
        });
        
        // Prepare audio parameter
        const audioParam = audioTrack ? {
            file: audioTrack.file!,
            duration: audioTrack.duration,
            volume: audioVolume,
            fadeIn: audioFadeIn,
            fadeOut: audioFadeOut
        } : undefined;
        
        // Generate the video WITH AUDIO
        const videoBlob = await generator.generateVideo(
            photos, 
            settings, 
            onProgress,
            audioParam  // ✅ NOW PASSING AUDIO
        );
        
        generator.dispose();
        
        if (videoBlob) {
            draftVideoBlob = videoBlob;
            if (draftVideoUrl) {
                URL.revokeObjectURL(draftVideoUrl);
            }
            draftVideoUrl = URL.createObjectURL(videoBlob);
            
            if (previewVideoUrl && previewVideoUrl !== (publishedSlideshow?.playbackUrl || publishedSlideshow?.firebaseStorageUrl)) {
                URL.revokeObjectURL(previewVideoUrl);
            }
            previewVideoUrl = draftVideoUrl;
            showVideoPreview = true;
            
            console.log('✅ Draft video generated successfully:', videoBlob.size, 'bytes');
        }
    } catch (error) {
        console.error('❌ Error generating draft video:', error);
        alert('Failed to generate draft video. Please try again.');
    } finally {
        isGenerating = false;
        generationProgress = 0;
        generationPhase = '';
    }
}
```

---

## 📝 Testing Checklist

After implementing all changes, test the following:

- [ ] AudioUploader appears BEFORE "Create Slideshow Video" button
- [ ] Can upload audio file (MP3, WAV, OGG)
- [ ] Audio preview/playback works in AudioUploader
- [ ] Volume slider affects playback
- [ ] Fade in/out checkboxes toggle correctly
- [ ] Generate video button works with audio
- [ ] Generated video contains audio track
- [ ] Audio loops correctly if shorter than slideshow
- [ ] Audio fades out if longer than slideshow
- [ ] Fade in effect works (first 2 seconds)
- [ ] Fade out effect works (last 2 seconds)
- [ ] Video without audio still works (backward compatibility)
- [ ] Audio is uploaded to Firebase Storage
- [ ] Audio URL is saved in slideshow metadata
- [ ] Published slideshow plays with audio on memorial page
- [ ] Draft changes preserve audio settings
- [ ] Mobile auto-scroll still works after generation

---

## 🔄 Rollback Plan

If issues occur, revert in reverse order:

1. Revert `PhotoSlideshowCreator.svelte` generateSlideshow changes
2. Revert `SimpleSlideshowGenerator.ts` audio mixing
3. Revert audio upload to Firebase Storage
4. Revert AudioUploader position change

Keep backup copies of original files before implementing.

---

## 📚 Additional Notes

### Browser Compatibility
- Web Audio API supported in all modern browsers
- MediaRecorder with audio tracks requires Chrome 49+, Firefox 25+, Safari 14.1+
- Opus codec in WebM preferred for best audio quality

### Performance Considerations
- Audio loading adds ~500ms to generation time
- Audio mixing adds minimal overhead (handled by browser)
- Large audio files (>50MB) may cause memory issues

### Future Enhancements
- Allow audio trimming to specific start/end times
- Support multiple audio tracks
- Add audio visualization during generation
- Allow audio selection from library (royalty-free music)
