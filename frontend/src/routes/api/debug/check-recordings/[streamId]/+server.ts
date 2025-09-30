import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase-admin';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

/**
 * Debug endpoint to check for recordings using Cloudflare API
 * GET /api/debug/check-recordings/[streamId]
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { streamId } = params;
		
		console.log('🔍 [DEBUG] Checking recordings for stream:', streamId);
		
		// Get stream from database
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();
		
		if (!streamDoc.exists) {
			return json({ error: 'Stream not found' }, { status: 404 });
		}
		
		const streamData = streamDoc.data()!;
		const cloudflareId = streamData.cloudflareId;
		
		if (!cloudflareId) {
			return json({ error: 'No Cloudflare ID found for stream' }, { status: 400 });
		}
		
		console.log('📡 [DEBUG] Checking Cloudflare for recordings:', cloudflareId);
		
		// Check Cloudflare API for videos/recordings
		const cloudflareResponse = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`,
			{
				headers: {
					'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
					'Content-Type': 'application/json'
				}
			}
		);
		
		if (!cloudflareResponse.ok) {
			const error = await cloudflareResponse.text();
			console.error('❌ [DEBUG] Cloudflare API error:', error);
			return json({ error: 'Cloudflare API error', details: error }, { status: 500 });
		}
		
		const cloudflareData = await cloudflareResponse.json();
		console.log('✅ [DEBUG] Cloudflare response:', cloudflareData);
		
		// Filter videos that might be related to our stream
		const relatedVideos = cloudflareData.result?.filter((video: any) => {
			// Check if video is related to our live input
			return video.liveInput === cloudflareId || 
				   video.uid === cloudflareId ||
				   video.meta?.name?.includes(streamData.title);
		}) || [];
		
		// Also check live inputs specifically
		const liveInputResponse = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${cloudflareId}`,
			{
				headers: {
					'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
					'Content-Type': 'application/json'
				}
			}
		);
		
		let liveInputData = null;
		if (liveInputResponse.ok) {
			liveInputData = await liveInputResponse.json();
			console.log('📡 [DEBUG] Live input data:', liveInputData);
		}
		
		// Check for recordings associated with this live input
		const recordingsResponse = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream?search=${cloudflareId}`,
			{
				headers: {
					'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
					'Content-Type': 'application/json'
				}
			}
		);
		
		let recordingsData = null;
		if (recordingsResponse.ok) {
			recordingsData = await recordingsResponse.json();
			console.log('📹 [DEBUG] Recordings search result:', recordingsData);
		}
		
		return json({
			success: true,
			streamId,
			streamData: {
				id: streamId,
				title: streamData.title,
				status: streamData.status,
				cloudflareId: cloudflareId,
				recordingSessions: streamData.recordingSessions || []
			},
			cloudflare: {
				allVideos: cloudflareData.result?.length || 0,
				relatedVideos: relatedVideos.length,
				relatedVideoDetails: relatedVideos,
				liveInput: liveInputData?.result || null,
				recordings: recordingsData?.result || []
			}
		});
		
	} catch (error) {
		console.error('❌ [DEBUG] Error checking recordings:', error);
		return json({ 
			error: 'Internal server error', 
			details: error instanceof Error ? error.message : 'Unknown error' 
		}, { status: 500 });
	}
};
