import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { bool, extra, json, timestamps } from './_helpers';
import type { StreamAnalytics, StreamCredentials } from '$lib/types/stream';

export const streams = sqliteTable(
	'streams',
	{
		id: text('id').primaryKey(),
		memorialId: text('memorial_id').notNull(),
		title: text('title').notNull().default(''),
		description: text('description'),
		status: text('status').notNull().default('scheduled'),
		visibility: text('visibility'),
		isVisible: bool('is_visible').notNull().default(true),
		scheduledStartTime: text('scheduled_start_time'),
		liveStartedAt: text('live_started_at'),
		liveEndedAt: text('live_ended_at'),
		playbackUrl: text('playback_url'),
		embedUrl: text('embed_url'),
		recordingReady: bool('recording_ready').notNull().default(false),
		createdBy: text('created_by').notNull().default(''),

		// Calculator sync
		calculatorServiceType: text('calculator_service_type'),
		calculatorServiceIndex: integer('calculator_service_index'),
		serviceHash: text('service_hash'),
		lastSyncedAt: text('last_synced_at'),
		syncStatus: text('sync_status'),

		// Legacy Cloudflare fields
		streamKey: text('stream_key'),
		rtmpUrl: text('rtmp_url'),
		cloudflareInputId: text('cloudflare_input_id'),
		cloudflareStreamId: text('cloudflare_stream_id'),
		legacyCloudflareInputId: text('legacy_cloudflare_input_id'),
		streamCredentials: json<StreamCredentials>('stream_credentials'),

		// Mux (flattened from stream.mux)
		muxLiveStreamId: text('mux_live_stream_id'),
		muxPlaybackId: text('mux_playback_id'),
		muxRtmpUrl: text('mux_rtmp_url'),
		muxStreamKey: text('mux_stream_key'),
		muxAssetId: text('mux_asset_id'),
		muxVodPlaybackId: text('mux_vod_playback_id'),
		muxRecordingReady: bool('mux_recording_ready').notNull().default(false),
		muxDuration: real('mux_duration'),
		muxReconnectWindow: integer('mux_reconnect_window'),
		muxStreamingStatus: text('mux_streaming_status'),

		// Note: chat is no longer per-stream — see schema/chat.ts
		// (memorial_chat_settings / memorial_chat_messages).

		// Optional external embed (flattened from stream.embed)
		embedCode: text('embed_code'),
		embedTitle: text('embed_title'),
		embedPosition: text('embed_position'),
		embedCreatedAt: text('embed_created_at'),
		embedCreatedBy: text('embed_created_by'),

		analytics: json<StreamAnalytics>('analytics'),
		extra,
		...timestamps
	},
	(t) => [
		index('streams_memorial_idx').on(t.memorialId),
		index('streams_status_idx').on(t.status),
		index('streams_mux_live_idx').on(t.muxLiveStreamId)
	]
);

// Replaces stream.mux.recordings[] and stream.mux.publishedRecordings[].
export const streamRecordings = sqliteTable(
	'stream_recordings',
	{
		id: text('id').primaryKey(),
		streamId: text('stream_id').notNull(),
		assetId: text('asset_id').notNull(),
		vodPlaybackId: text('vod_playback_id').notNull(),
		duration: real('duration'),
		isPublished: bool('is_published').notNull().default(false),
		createdAt: text('created_at').notNull()
	},
	(t) => [index('sr_stream_idx').on(t.streamId), index('sr_asset_idx').on(t.assetId)]
);

// Chat tables live in ./chat.ts (memorialChatSettings / memorialChatMessages) —
// chat is unified at the memorial level, not per-stream. See that file for the
// tables that replaced `stream_chat_messages` and the old `memorial_chat_messages`
// definitions that used to live here.
