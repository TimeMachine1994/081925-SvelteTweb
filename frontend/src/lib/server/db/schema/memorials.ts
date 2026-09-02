import {
	sqliteTable,
	text,
	integer,
	real,
	primaryKey,
	index,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';
import { bool, extra, json, timestamps } from './_helpers';
import type { CalculatorConfig, ManualPaymentInfo } from '$lib/types/memorial';
import type { CustomPricing } from '$lib/config/pricing';
import type { BlockConfig, BlockType } from '$lib/types/memorial-blocks';

export const memorials = sqliteTable(
	'memorials',
	{
		id: text('id').primaryKey(),
		lovedOneName: text('loved_one_name').notNull(),
		slug: text('slug').notNull(),
		fullSlug: text('full_slug').notNull(),
		customTitle: text('custom_title'),

		// Ownership / access
		ownerUid: text('owner_uid'),
		creatorEmail: text('creator_email'),
		creatorName: text('creator_name'),
		createdByUserId: text('created_by_user_id'),
		funeralDirectorUid: text('funeral_director_uid'),
		directorFullName: text('director_full_name'),
		directorEmail: text('director_email'),
		funeralHomeName: text('funeral_home_name'),
		funeralDirectorName: text('funeral_director_name'),

		// Family contact
		familyContactName: text('family_contact_name'),
		familyContactEmail: text('family_contact_email'),
		familyContactPhone: text('family_contact_phone'),
		familyContactPreference: text('family_contact_preference'),
		additionalNotes: text('additional_notes'),

		// Content
		isPublic: bool('is_public').notNull().default(true),
		isComplete: bool('is_complete').notNull().default(false),
		isLegacy: bool('is_legacy').notNull().default(false),
		content: text('content').notNull().default(''),
		customHtml: text('custom_html'),
		imageUrl: text('image_url'),
		birthDate: text('birth_date'),
		deathDate: text('death_date'),
		contentBlocksVersion: integer('content_blocks_version').notNull().default(0),

		// Legacy flat service fields (deprecated, preserved for old docs)
		memorialDate: text('memorial_date'),
		memorialTime: text('memorial_time'),
		memorialLocationName: text('memorial_location_name'),
		memorialLocationAddress: text('memorial_location_address'),

		// Payment
		isPaid: bool('is_paid').notNull().default(false),
		paymentStatus: text('payment_status'),
		paidAt: text('paid_at'),
		totalPrice: real('total_price'),
		manualPayment: json<ManualPaymentInfo>('manual_payment'),
		calculatorConfig: json<CalculatorConfig>('calculator_config'),
		customPricing: json<CustomPricing>('custom_pricing'),

		extra,
		...timestamps
	},
	(t) => [
		uniqueIndex('memorials_full_slug_uq').on(t.fullSlug),
		index('memorials_owner_idx').on(t.ownerUid),
		index('memorials_fd_idx').on(t.funeralDirectorUid),
		index('memorials_public_created_idx').on(t.isPublic, t.createdAt),
		index('memorials_creator_email_idx').on(t.creatorEmail)
	]
);

// Replaces memorial.services.main (kind='main', position=0) and
// memorial.services.additional[] (kind='location'|'day', ordered by position).
export const memorialServices = sqliteTable(
	'memorial_services',
	{
		id: text('id').primaryKey(),
		memorialId: text('memorial_id').notNull(),
		kind: text('kind').notNull(), // 'main' | 'location' | 'day'
		position: integer('position').notNull().default(0),
		locationName: text('location_name').notNull().default(''),
		locationAddress: text('location_address').notNull().default(''),
		locationIsUnknown: bool('location_is_unknown').notNull().default(true),
		date: text('date'),
		time: text('time'),
		timeIsUnknown: bool('time_is_unknown').notNull().default(true),
		hours: real('hours').notNull().default(2),
		streamId: text('stream_id'),
		streamHash: text('stream_hash')
	},
	(t) => [index('ms_memorial_idx').on(t.memorialId, t.kind, t.position)]
);

export const memorialPhotos = sqliteTable(
	'memorial_photos',
	{
		id: text('id').primaryKey(),
		memorialId: text('memorial_id').notNull(),
		url: text('url').notNull(),
		position: integer('position').notNull().default(0),
		createdAt: text('created_at').notNull()
	},
	(t) => [index('mp_memorial_idx').on(t.memorialId, t.position)]
);

export const memorialEmbeds = sqliteTable(
	'memorial_embeds',
	{
		id: text('id').primaryKey(),
		memorialId: text('memorial_id').notNull(),
		title: text('title').notNull().default(''),
		type: text('type').notNull(), // 'youtube' | 'vimeo'
		embedUrl: text('embed_url').notNull(),
		...timestamps
	},
	(t) => [index('me_memorial_idx').on(t.memorialId)]
);

// Replaces memorial.contentBlocks[]. `config` stays JSON because it is
// polymorphic per block type and only ever read/written as a whole.
export const memorialBlocks = sqliteTable(
	'memorial_blocks',
	{
		id: text('id').primaryKey(),
		memorialId: text('memorial_id').notNull(),
		type: text('type').notNull().$type<BlockType>(),
		position: integer('position').notNull().default(0),
		enabled: bool('enabled').notNull().default(true),
		config: json<BlockConfig>('config').notNull(),
		...timestamps
	},
	(t) => [index('mb_memorial_idx').on(t.memorialId, t.position)]
);

// Replaces memorial.followers[] + followers subcollection. followerCount = COUNT(*).
export const memorialFollowers = sqliteTable(
	'memorial_followers',
	{
		memorialId: text('memorial_id').notNull(),
		userId: text('user_id').notNull(),
		followedAt: text('followed_at').notNull()
	},
	(t) => [primaryKey({ columns: [t.memorialId, t.userId] })]
);

// Replaces memorial.paymentHistory[] (arrayUnion in the Stripe webhook).
export const memorialPaymentHistory = sqliteTable(
	'memorial_payment_history',
	{
		id: text('id').primaryKey(),
		memorialId: text('memorial_id').notNull(),
		eventType: text('event_type').notNull(),
		amount: real('amount'),
		stripeId: text('stripe_id'),
		payload: json<Record<string, unknown>>('payload'),
		createdAt: text('created_at').notNull()
	},
	(t) => [index('mph_memorial_idx').on(t.memorialId, t.createdAt)]
);

export const invitations = sqliteTable(
	'invitations',
	{
		id: text('id').primaryKey(),
		memorialId: text('memorial_id').notNull(),
		inviteeEmail: text('invitee_email').notNull(),
		roleToAssign: text('role_to_assign').notNull().default('owner'),
		status: text('status').notNull().default('pending'),
		invitedByUid: text('invited_by_uid').notNull(),
		...timestamps
	},
	(t) => [index('inv_memorial_idx').on(t.memorialId), index('inv_email_idx').on(t.inviteeEmail)]
);

export const scheduleEditRequests = sqliteTable(
	'schedule_edit_requests',
	{
		id: text('id').primaryKey(),
		memorialId: text('memorial_id').notNull(),
		memorialName: text('memorial_name').notNull().default(''),
		requestedBy: text('requested_by').notNull(),
		requestedByEmail: text('requested_by_email').notNull().default(''),
		requestDetails: text('request_details').notNull().default(''),
		status: text('status').notNull().default('pending'),
		reviewedAt: text('reviewed_at'),
		reviewedBy: text('reviewed_by'),
		reviewedByEmail: text('reviewed_by_email'),
		adminNotes: text('admin_notes'),
		currentConfig: json<Record<string, unknown>>('current_config'),
		createdAt: text('created_at').notNull()
	},
	(t) => [index('ser_memorial_idx').on(t.memorialId), index('ser_status_idx').on(t.status)]
);

export const livestreamConfigurations = sqliteTable(
	'livestream_configurations',
	{
		id: text('id').primaryKey(),
		memorialId: text('memorial_id'),
		calculatorData: json<Record<string, unknown>>('calculator_data'),
		services: json<unknown>('services'),
		...timestamps
	},
	(t) => [index('lc_memorial_idx').on(t.memorialId)]
);
