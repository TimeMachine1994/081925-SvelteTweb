import { adminDb, toIso } from './_shared';

/** Stream analytics snapshots live in `streams/{streamId}/analytics`. */
const PARENT_COLLECTION = 'streams';
const COLLECTION = 'analytics';

export interface StreamAnalyticsPoint {
	timestamp: string | null;
	viewerCount: number;
	chatMessages: number;
}

function analyticsRef(streamId: string) {
	return adminDb.collection(PARENT_COLLECTION).doc(streamId).collection(COLLECTION);
}

function mapPoint(data: Record<string, any>): StreamAnalyticsPoint {
	return {
		timestamp: toIso(data.timestamp),
		viewerCount: data.viewerCount || 0,
		chatMessages: data.chatMessages || 0
	};
}

/**
 * Most recent analytics data points for a stream, oldest first.
 * `limit` bounds how many of the newest points are returned.
 */
export async function listStreamAnalyticsTimeline(
	streamId: string,
	limit: number
): Promise<StreamAnalyticsPoint[]> {
	const snap = await analyticsRef(streamId).orderBy('timestamp', 'desc').limit(limit).get();

	const timeline: StreamAnalyticsPoint[] = [];
	snap.forEach((doc) => {
		timeline.push(mapPoint(doc.data()));
	});

	timeline.reverse();
	return timeline;
}
