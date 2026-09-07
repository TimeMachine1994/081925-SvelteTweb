import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { bool, json, timestamps } from './_helpers';
import type { SlideshowAudio, SlideshowSettings } from '$lib/types/slideshow';

export const slideshows = sqliteTable(
	'slideshows',
	{
		id: text('id').primaryKey(),
		memorialId: text('memorial_id').notNull(),
		title: text('title').notNull().default(''),
		storagePath: text('storage_path').notNull().default(''),
		playbackUrl: text('playback_url').notNull().default(''),
		thumbnailUrl: text('thumbnail_url'),
		status: text('status').notNull().default('processing'),
		isFirebaseHosted: bool('is_firebase_hosted').notNull().default(true),
		embedCode: text('embed_code'),
		settings: json<SlideshowSettings>('settings'),
		audio: json<SlideshowAudio>('audio'),
		createdBy: text('created_by').notNull().default(''),
		...timestamps
	},
	(t) => [index('slideshows_memorial_idx').on(t.memorialId)]
);

export const slideshowPhotos = sqliteTable(
	'slideshow_photos',
	{
		id: text('id').primaryKey(),
		slideshowId: text('slideshow_id').notNull(),
		url: text('url').notNull(),
		storagePath: text('storage_path').notNull().default(''),
		caption: text('caption'),
		duration: real('duration'),
		position: integer('position').notNull().default(0)
	},
	(t) => [index('sp_slideshow_idx').on(t.slideshowId, t.position)]
);

export const slideshowDrafts = sqliteTable(
	'slideshow_drafts',
	{
		id: text('id').primaryKey(),
		memorialId: text('memorial_id'),
		userId: text('user_id'),
		data: json<Record<string, unknown>>('data'),
		...timestamps
	},
	(t) => [index('sd_memorial_idx').on(t.memorialId), index('sd_user_idx').on(t.userId)]
);
