import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const project = sqliteTable('project', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	title: text('title').notNull(),
	dataSourceUrl: text('data_source_url'),
	dataSourceType: text('data_source_type'), // 'google_sheets' | 'local_csv'
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const projectSettings = sqliteTable('project_settings', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => project.id, { onDelete: 'cascade' }),
	colorTheme: text('color_theme').default('default'),
	defaultZoomLevel: text('default_zoom_level').default('month'), // 'year' | 'month' | 'day' | 'hour'
	labelConfig: text('label_config'), // JSON
	masterTimelineHeight: integer('master_timeline_height').default(120),
	zoomTimelineHeight: integer('zoom_timeline_height').default(400),
	// New timeline style fields
	timelineStyle: text('timeline_style').default('line'), // 'line' | 'calendar'
	calendarGranularity: text('calendar_granularity').default('month'), // 'year' | 'month' | 'week'
	colorMode: text('color_mode').default('binary'), // 'binary' | 'intensity'
	eventColor: text('event_color').default('#3B82F6'), // hex color for calendar
	showLegend: integer('show_legend', { mode: 'boolean' }).default(true),
	dateRangeStart: integer('date_range_start', { mode: 'timestamp' }), // optional filter
	dateRangeEnd: integer('date_range_end', { mode: 'timestamp' }), // optional filter
	columnMapping: text('column_mapping'), // JSON: { date: 0, title: 1, description: 2, ... }
	categoryConfig: text('category_config') // JSON: [{ name, color, textColor, keywords[] }]
});

export const cachedEvents = sqliteTable('cached_events', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => project.id, { onDelete: 'cascade' }),
	eventData: text('event_data'), // JSON blob of parsed CSV
	cachedAt: integer('cached_at', { mode: 'timestamp' }).notNull(),
	etag: text('etag')
});

export const printLayout = sqliteTable('print_layout', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => project.id, { onDelete: 'cascade' }),
	layoutData: text('layout_data'), // JSON: positions, sizes, adjustments
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Project = typeof project.$inferSelect;
export type ProjectSettings = typeof projectSettings.$inferSelect;
export type CachedEvents = typeof cachedEvents.$inferSelect;
export type PrintLayout = typeof printLayout.$inferSelect;
