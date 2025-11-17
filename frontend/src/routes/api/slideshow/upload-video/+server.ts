import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from '$env/static/private';

// Configure this route to use Edge runtime for large file uploads
export const config = {
	runtime: 'edge',
	regions: ['iad1'] // Use region close to your users
};

/**
 * Upload slideshow video to Cloudflare Stream (server-side to avoid CORS)
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('☁️ [UPLOAD VIDEO API] Request received');
	
	// Authentication check
	if (!locals.user) {
		console.log('🔒 [UPLOAD VIDEO API] Unauthorized request');
		return error(401, 'Unauthorized');
	}

	// Configuration check
	if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
		console.error('❌ [UPLOAD VIDEO API] Cloudflare credentials not configured');
		return error(500, 'Cloudflare Stream not configured');
	}

	try {
		const formData = await request.formData();
		
		// Extract and validate form data
		const videoBlob = formData.get('video');
		const title = (formData.get('title') as string) || 'Memorial Slideshow';
		const memorialId = formData.get('memorialId') as string;

		// Type guard for video file
		if (!videoBlob || !(videoBlob instanceof File)) {
			return error(400, 'No video file provided');
		}

		console.log('☁️ [UPLOAD VIDEO API] Uploading to Cloudflare Stream:', {
			videoSize: videoBlob.size,
			title,
			memorialId
		});

		// Create FormData for Cloudflare
		const cloudflareFormData = new FormData();
		cloudflareFormData.append('file', videoBlob);
		
		// Add metadata
		const metadata = {
			name: title,
			meta: {
				type: 'memorial-slideshow',
				memorialId: memorialId || '',
				uploadedBy: locals.user.uid,
				created: new Date().toISOString()
			}
		};
		cloudflareFormData.append('meta', JSON.stringify(metadata));

		// Upload to Cloudflare Stream
		const response = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`,
			{
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
				},
				body: cloudflareFormData
			}
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ [UPLOAD VIDEO API] Cloudflare upload failed:', response.status, errorText);
			return error(500, `Cloudflare upload failed: ${response.status} ${response.statusText}`);
		}

		const result = await response.json() as {
			success: boolean;
			result?: any;
			errors?: Array<{ message: string }>;
		};

		if (!result.success || !result.result) {
			console.error('❌ [UPLOAD VIDEO API] Cloudflare API error:', result.errors);
			return error(500, `Cloudflare API error: ${result.errors?.[0]?.message || 'Unknown error'}`);
		}

		console.log('✅ [UPLOAD VIDEO API] Cloudflare upload successful:', result.result.uid);

		return json({
			success: true,
			cloudflareResult: result.result
		});

	} catch (err) {
		console.error('❌ [UPLOAD VIDEO API] Error:', err);
		
		// Re-throw SvelteKit errors
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		
		const message = err instanceof Error ? err.message : 'Unknown error';
		return error(500, `Failed to upload video: ${message}`);
	}
};
