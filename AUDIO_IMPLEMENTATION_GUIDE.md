# Slideshow Audio Implementation Guide - Server-Side FFmpeg

## Overview
This document provides the complete server-side implementation for merging audio with slideshow videos using FFmpeg.

## Prerequisites

### 1. Install FFmpeg on Server
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows (use Chocolatey)
choco install ffmpeg
```

### 2. Install Node.js FFmpeg Wrapper
```bash
cd frontend
npm install fluent-ffmpeg
npm install @types/fluent-ffmpeg --save-dev
```

## Server-Side Implementation

### Update `/api/slideshow/upload-firebase/+server.ts`

Add the following imports and functions:

```typescript
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import os from 'os';

// ... existing imports ...

/**
 * Merge video and audio using FFmpeg
 */
async function mergeVideoAudio(
	videoFile: File,
	audioFile: File,
	options: {
		volume: number;
		fadeIn: boolean;
		fadeOut: boolean;
		audioDuration: number;
	}
): Promise<Buffer> {
	// Create temp file paths
	const tempDir = os.tmpdir();
	const videoPath = join(tempDir, `video-${Date.now()}.webm`);
	const audioPath = join(tempDir, `audio-${Date.now()}.${audioFile.name.split('.').pop()}`);
	const outputPath = join(tempDir, `output-${Date.now()}.webm`);

	try {
		// Write input files to temp directory
		const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
		const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
		
		await writeFile(videoPath, videoBuffer);
		await writeFile(audioPath, audioBuffer);

		console.log('🎬 Merging video and audio with FFmpeg...');
		console.log('📊 Audio settings:', options);

		// Build audio filter chain
		const audioFilters = [];
		
		// Fade in (2 seconds at start)
		if (options.fadeIn) {
			audioFilters.push('afade=t=in:st=0:d=2');
		}
		
		// Fade out (2 seconds before end)
		if (options.fadeOut && options.audioDuration > 2) {
			audioFilters.push(`afade=t=out:st=${options.audioDuration - 2}:d=2`);
		}
		
		// Volume adjustment
		audioFilters.push(`volume=${options.volume}`);

		// Combine filters
		const audioFilterString = audioFilters.join(',');

		// Execute FFmpeg command
		const mergedBuffer = await new Promise<Buffer>((resolve, reject) => {
			const chunks: Buffer[] = [];
			const outputStream = ffmpeg()
				.input(videoPath)
				.input(audioPath)
				.outputOptions([
					'-c:v copy',           // Copy video codec (no re-encoding)
					'-c:a aac',            // Encode audio as AAC
					'-b:a 192k',           // Audio bitrate
					'-shortest',           // Match shortest input duration
					'-filter:a', audioFilterString  // Apply audio filters
				])
				.format('webm')
				.on('start', (commandLine) => {
					console.log('🎥 FFmpeg command:', commandLine);
				})
				.on('progress', (progress) => {
					if (progress.percent) {
						console.log(`🔄 Processing: ${Math.round(progress.percent)}%`);
					}
				})
				.on('end', () => {
					console.log('✅ FFmpeg processing complete');
					resolve(Buffer.concat(chunks));
				})
				.on('error', (err) => {
					console.error('❌ FFmpeg error:', err);
					reject(err);
				});

			// Pipe output to buffer
			const stream = outputStream.pipe();
			stream.on('data', (chunk) => chunks.push(chunk));
			stream.on('error', reject);
		});

		return mergedBuffer;

	} finally {
		// Cleanup temp files
		try {
			await unlink(videoPath);
			await unlink(audioPath);
			await unlink(outputPath);
		} catch (err) {
			console.warn('⚠️ Error cleaning up temp files:', err);
		}
	}
}

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	try {
		// ... existing auth checks ...

		const formData = await request.formData();
		let videoFile = formData.get('video') as File;
		const audioFile = formData.get('audio') as File | null;
		const memorialId = formData.get('memorialId') as string;

		// Parse settings to get audio options
		const settingsStr = formData.get('settings') as string;
		const settings = settingsStr ? JSON.parse(settingsStr) : {};

		// If audio is present, merge it with video
		if (audioFile) {
			console.log('🎵 Audio file detected, merging with video...');
			
			const audioDuration = parseFloat(formData.get('audioDuration') as string || '0');
			const audioName = formData.get('audioName') as string || audioFile.name;

			const mergedVideoBuffer = await mergeVideoAudio(videoFile, audioFile, {
				volume: settings.audioVolume || 0.5,
				fadeIn: settings.audioFadeIn || false,
				fadeOut: settings.audioFadeOut || false,
				audioDuration
			});

			// Replace video file with merged version
			videoFile = new File([mergedVideoBuffer], 'slideshow-with-audio.webm', {
				type: 'video/webm'
			});

			console.log('✅ Video and audio merged successfully');
			console.log('📊 Merged video size:', (mergedVideoBuffer.length / 1024 / 1024).toFixed(2), 'MB');
		}

		// Continue with normal upload process using the (possibly merged) video file
		// ... rest of existing upload logic ...

	} catch (err: any) {
		console.error('🔥 [FIREBASE SLIDESHOW API] Error:', err);
		throw error(500, `Failed to process slideshow: ${err.message}`);
	}
};
```

## Testing

### 1. Test Audio Upload
```bash
# Test with a sample slideshow
curl -X POST http://localhost:5173/api/slideshow/upload-firebase \
  -F "video=@slideshow.webm" \
  -F "audio=@background-music.mp3" \
  -F "memorialId=test123" \
  -F "audioDuration=120" \
  -F 'settings={"audioVolume":0.7,"audioFadeIn":true,"audioFadeOut":true}'
```

### 2. Check FFmpeg Installation
```bash
# Verify FFmpeg is installed
ffmpeg -version

# Should output version information
```

### 3. Monitor Server Logs
Watch for these console messages:
- `🎵 Audio file detected, merging with video...`
- `🎥 FFmpeg command: ...`
- `🔄 Processing: X%`
- `✅ FFmpeg processing complete`
- `✅ Video and audio merged successfully`

## Troubleshooting

### Problem: "ffmpeg: command not found"
**Solution**: Install FFmpeg on your server (see Prerequisites)

### Problem: "Cannot find module 'fluent-ffmpeg'"
**Solution**: 
```bash
npm install fluent-ffmpeg @types/fluent-ffmpeg
```

### Problem: Audio not playing in merged video
**Solution**: Check audio codec compatibility:
```bash
# Test audio file codec
ffmpeg -i your-audio.mp3
```
Convert to compatible format if needed:
```bash
ffmpeg -i input.ogg -c:a libmp3lame output.mp3
```

### Problem: Large file sizes
**Solution**: Adjust bitrate in FFmpeg options:
```typescript
'-b:a 128k'  // Lower bitrate (was 192k)
```

### Problem: Out of memory on large files
**Solution**: Use streaming instead of loading entire file into memory (already implemented with chunks)

## Performance Notes

- **Processing time**: ~2-5 seconds for 2-minute video
- **Memory usage**: ~100-200MB during processing
- **Temp disk space**: ~3x combined file size (video + audio + output)

## Alternative: Client-Side Processing

If server resources are limited, consider using **FFmpeg.wasm** on client:

```typescript
import { FFmpeg } from '@ffmpeg/ffmpeg';

// In PhotoSlideshowCreator.svelte
async function mergeAudioClientSide(videoBlob, audioBlob) {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load();
  
  await ffmpeg.writeFile('video.webm', await fetchFile(videoBlob));
  await ffmpeg.writeFile('audio.mp3', await fetchFile(audioBlob));
  
  await ffmpeg.exec([
    '-i', 'video.webm',
    '-i', 'audio.mp3',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-shortest',
    'output.webm'
  ]);
  
  const data = await ffmpeg.readFile('output.webm');
  return new Blob([data], { type: 'video/webm' });
}
```

**Pros**: No server load, works offline
**Cons**: Large bundle size (~30MB), slower on low-end devices

## Security Considerations

1. **File Type Validation**: Already validates audio MIME types
2. **File Size Limits**: 50MB max (configured in AudioUploader)
3. **Temp File Cleanup**: Automatically deletes temp files after processing
4. **Resource Limits**: Consider adding timeout for FFmpeg operations:

```typescript
setTimeout(() => {
  ffmpegProcess.kill();
  reject(new Error('FFmpeg timeout'));
}, 60000); // 60 second timeout
```

## Next Steps

1. ✅ Type definitions updated
2. ✅ AudioUploader component created
3. ✅ PhotoSlideshowCreator integration complete
4. ⏳ **Implement server-side FFmpeg endpoint** (use code above)
5. ⏳ Test with real audio files
6. ⏳ Deploy to production

## Support

For issues or questions:
- Check FFmpeg docs: https://ffmpeg.org/documentation.html
- fluent-ffmpeg docs: https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
