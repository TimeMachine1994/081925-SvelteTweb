import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

/**
 * Get detailed stream status for debugging
 * GET /api/streams/[streamId]/status
 */
export const GET: RequestHandler = async ({ params }) => {
	const { streamId } = params;
	
	try {
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();
		
		if (!streamDoc.exists) {
			return json({ error: 'Stream not found' }, { status: 404 });
		}
		
		const streamData = streamDoc.data();
		
		// Analyze stream state
		const now = new Date();
		const scheduledTime = streamData.scheduledStartTime 
			? new Date(streamData.scheduledStartTime) 
			: null;
		
		const analysis = {
			id: streamId,
			title: streamData.title,
			status: streamData.status,
			isVisible: streamData.isVisible !== false,
			
			// Timing
			scheduledStartTime: streamData.scheduledStartTime,
			scheduledTimeReadable: scheduledTime?.toLocaleString(),
			isScheduledInFuture: scheduledTime ? scheduledTime > now : null,
			liveStartedAt: streamData.liveStartedAt,
			liveEndedAt: streamData.liveEndedAt,
			
			// Cloudflare IDs
			cloudflareInputId: streamData.streamCredentials?.cloudflareInputId || streamData.cloudflareInputId,
			cloudflareStreamId: streamData.cloudflareStreamId,
			
			// Playback URLs
			liveWatchUrl: streamData.liveWatchUrl,
			playbackUrl: streamData.playbackUrl,
			embedUrl: streamData.embedUrl,
			hlsUrl: streamData.hlsUrl,
			dashUrl: streamData.dashUrl,
			
			// Recording
			recordingReady: streamData.recordingReady,
			
			// Categorization (how MemorialStreamDisplay would categorize this)
			wouldBeShownAsLive: streamData.status === 'live' && streamData.isVisible !== false,
			wouldBeShownAsScheduled: (
				streamData.isVisible !== false &&
				(streamData.status === 'scheduled' || 
				 (streamData.status === 'ready' && scheduledTime && scheduledTime > now))
			),
			wouldBeShownAsRecorded: (
				streamData.isVisible !== false &&
				(streamData.status === 'completed' || streamData.recordingReady === true)
			),
			
			// Last update
			updatedAt: streamData.updatedAt,
			
			// Webhook readiness
			webhookReady: !!(streamData.streamCredentials?.cloudflareInputId || streamData.cloudflareInputId),
			webhookLookupId: streamData.streamCredentials?.cloudflareInputId || streamData.cloudflareInputId
		};
		
		return json({
			success: true,
			stream: analysis,
			recommendations: getRecommendations(analysis)
		});
		
	} catch (error: any) {
		console.error('❌ [STREAM STATUS] Error:', error);
		return json({
			error: 'Internal server error',
			message: error?.message
		}, { status: 500 });
	}
};

function getRecommendations(analysis: any): string[] {
	const recommendations: string[] = [];
	
	if (!analysis.webhookReady) {
		recommendations.push('⚠️ No cloudflareInputId found - webhook will not be able to find this stream');
	}
	
	if (analysis.status === 'ready' && !analysis.scheduledStartTime) {
		recommendations.push('💡 Stream is ready but not scheduled - it won\'t show as "upcoming"');
	}
	
	if (analysis.status === 'live' && !analysis.liveWatchUrl) {
		recommendations.push('⚠️ Stream is marked as live but has no liveWatchUrl - playback may fail');
	}
	
	if (analysis.isVisible === false) {
		recommendations.push('👁️ Stream is hidden (isVisible=false) - it won\'t appear on event page');
	}
	
	if (analysis.status === 'scheduled' && analysis.scheduledTimeReadable) {
		recommendations.push(`📅 Stream scheduled for: ${analysis.scheduledTimeReadable}`);
	}
	
	if (analysis.status === 'completed' && !analysis.recordingReady) {
		recommendations.push('⏳ Stream completed but recording not ready yet');
	}
	
	if (!recommendations.length) {
		if (analysis.wouldBeShownAsLive) {
			recommendations.push('✅ Stream should be showing as LIVE on event page');
		} else if (analysis.wouldBeShownAsScheduled) {
			recommendations.push('✅ Stream should be showing as SCHEDULED on event page');
		} else if (analysis.wouldBeShownAsRecorded) {
			recommendations.push('✅ Stream should be showing as RECORDED on event page');
		} else {
			recommendations.push('❓ Stream may not be visible on event page');
		}
	}
	
	return recommendations;
}
