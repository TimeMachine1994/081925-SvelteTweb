CREATE TABLE `password_reset_tokens` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `prt_user_idx` ON `password_reset_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_followed_memorials` (
	`user_id` text NOT NULL,
	`memorial_id` text NOT NULL,
	`followed_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `memorial_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`display_name` text,
	`first_name` text,
	`last_name` text,
	`phone` text,
	`photo_url` text,
	`role` text DEFAULT 'owner' NOT NULL,
	`status` text,
	`email_verified` integer DEFAULT false NOT NULL,
	`funeral_home_name` text,
	`created_by_admin` integer DEFAULT false NOT NULL,
	`created_by` text,
	`last_login_at` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	`extra` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE TABLE `funeral_directors` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text DEFAULT '' NOT NULL,
	`contact_person` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`website` text,
	`license_number` text,
	`address_street` text,
	`address_city` text,
	`address_state` text,
	`address_zip` text,
	`status` text DEFAULT 'approved' NOT NULL,
	`approved_at` text,
	`extra` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `fd_email_idx` ON `funeral_directors` (`email`);--> statement-breakpoint
CREATE INDEX `fd_status_idx` ON `funeral_directors` (`status`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text NOT NULL,
	`invitee_email` text NOT NULL,
	`role_to_assign` text DEFAULT 'owner' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`invited_by_uid` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `inv_memorial_idx` ON `invitations` (`memorial_id`);--> statement-breakpoint
CREATE INDEX `inv_email_idx` ON `invitations` (`invitee_email`);--> statement-breakpoint
CREATE TABLE `livestream_configurations` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text,
	`calculator_data` text,
	`services` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `lc_memorial_idx` ON `livestream_configurations` (`memorial_id`);--> statement-breakpoint
CREATE TABLE `memorial_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text NOT NULL,
	`type` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`config` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mb_memorial_idx` ON `memorial_blocks` (`memorial_id`,`position`);--> statement-breakpoint
CREATE TABLE `memorial_embeds` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`type` text NOT NULL,
	`embed_url` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `me_memorial_idx` ON `memorial_embeds` (`memorial_id`);--> statement-breakpoint
CREATE TABLE `memorial_followers` (
	`memorial_id` text NOT NULL,
	`user_id` text NOT NULL,
	`followed_at` text NOT NULL,
	PRIMARY KEY(`memorial_id`, `user_id`)
);
--> statement-breakpoint
CREATE TABLE `memorial_payment_history` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text NOT NULL,
	`event_type` text NOT NULL,
	`amount` real,
	`stripe_id` text,
	`payload` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mph_memorial_idx` ON `memorial_payment_history` (`memorial_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `memorial_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text NOT NULL,
	`url` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mp_memorial_idx` ON `memorial_photos` (`memorial_id`,`position`);--> statement-breakpoint
CREATE TABLE `memorial_services` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text NOT NULL,
	`kind` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`location_name` text DEFAULT '' NOT NULL,
	`location_address` text DEFAULT '' NOT NULL,
	`location_is_unknown` integer DEFAULT true NOT NULL,
	`date` text,
	`time` text,
	`time_is_unknown` integer DEFAULT true NOT NULL,
	`hours` real DEFAULT 2 NOT NULL,
	`stream_id` text,
	`stream_hash` text
);
--> statement-breakpoint
CREATE INDEX `ms_memorial_idx` ON `memorial_services` (`memorial_id`,`kind`,`position`);--> statement-breakpoint
CREATE TABLE `memorials` (
	`id` text PRIMARY KEY NOT NULL,
	`loved_one_name` text NOT NULL,
	`slug` text NOT NULL,
	`full_slug` text NOT NULL,
	`custom_title` text,
	`owner_uid` text,
	`creator_email` text,
	`creator_name` text,
	`created_by_user_id` text,
	`funeral_director_uid` text,
	`director_full_name` text,
	`director_email` text,
	`funeral_home_name` text,
	`funeral_director_name` text,
	`family_contact_name` text,
	`family_contact_email` text,
	`family_contact_phone` text,
	`family_contact_preference` text,
	`additional_notes` text,
	`is_public` integer DEFAULT true NOT NULL,
	`is_complete` integer DEFAULT false NOT NULL,
	`is_legacy` integer DEFAULT false NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`custom_html` text,
	`image_url` text,
	`birth_date` text,
	`death_date` text,
	`content_blocks_version` integer DEFAULT 0 NOT NULL,
	`memorial_date` text,
	`memorial_time` text,
	`memorial_location_name` text,
	`memorial_location_address` text,
	`is_paid` integer DEFAULT false NOT NULL,
	`payment_status` text,
	`paid_at` text,
	`total_price` real,
	`manual_payment` text,
	`calculator_config` text,
	`custom_pricing` text,
	`extra` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memorials_full_slug_uq` ON `memorials` (`full_slug`);--> statement-breakpoint
CREATE INDEX `memorials_owner_idx` ON `memorials` (`owner_uid`);--> statement-breakpoint
CREATE INDEX `memorials_fd_idx` ON `memorials` (`funeral_director_uid`);--> statement-breakpoint
CREATE INDEX `memorials_public_created_idx` ON `memorials` (`is_public`,`created_at`);--> statement-breakpoint
CREATE INDEX `memorials_creator_email_idx` ON `memorials` (`creator_email`);--> statement-breakpoint
CREATE TABLE `schedule_edit_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text NOT NULL,
	`memorial_name` text DEFAULT '' NOT NULL,
	`requested_by` text NOT NULL,
	`requested_by_email` text DEFAULT '' NOT NULL,
	`request_details` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_at` text,
	`reviewed_by` text,
	`reviewed_by_email` text,
	`admin_notes` text,
	`current_config` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ser_memorial_idx` ON `schedule_edit_requests` (`memorial_id`);--> statement-breakpoint
CREATE INDEX `ser_status_idx` ON `schedule_edit_requests` (`status`);--> statement-breakpoint
CREATE TABLE `memorial_chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text NOT NULL,
	`user_id` text NOT NULL,
	`user_name` text DEFAULT '' NOT NULL,
	`user_role` text DEFAULT 'viewer' NOT NULL,
	`message` text NOT NULL,
	`is_edited` integer DEFAULT false NOT NULL,
	`edited_at` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	`reply_to` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mcm_memorial_idx` ON `memorial_chat_messages` (`memorial_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `stream_chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`stream_id` text NOT NULL,
	`user_id` text,
	`user_name` text DEFAULT '' NOT NULL,
	`user_avatar` text,
	`user_role` text,
	`is_anonymous` integer DEFAULT false NOT NULL,
	`message` text NOT NULL,
	`deleted` integer DEFAULT false NOT NULL,
	`deleted_by` text,
	`deleted_at` text,
	`flagged` integer DEFAULT false NOT NULL,
	`flag_reason` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `scm_stream_idx` ON `stream_chat_messages` (`stream_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `stream_recordings` (
	`id` text PRIMARY KEY NOT NULL,
	`stream_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`vod_playback_id` text NOT NULL,
	`duration` real,
	`is_published` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sr_stream_idx` ON `stream_recordings` (`stream_id`);--> statement-breakpoint
CREATE INDEX `sr_asset_idx` ON `stream_recordings` (`asset_id`);--> statement-breakpoint
CREATE TABLE `streams` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`description` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`visibility` text,
	`is_visible` integer DEFAULT true NOT NULL,
	`scheduled_start_time` text,
	`live_started_at` text,
	`live_ended_at` text,
	`playback_url` text,
	`embed_url` text,
	`recording_ready` integer DEFAULT false NOT NULL,
	`created_by` text DEFAULT '' NOT NULL,
	`calculator_service_type` text,
	`calculator_service_index` integer,
	`service_hash` text,
	`last_synced_at` text,
	`sync_status` text,
	`stream_key` text,
	`rtmp_url` text,
	`cloudflare_input_id` text,
	`cloudflare_stream_id` text,
	`legacy_cloudflare_input_id` text,
	`stream_credentials` text,
	`mux_live_stream_id` text,
	`mux_playback_id` text,
	`mux_rtmp_url` text,
	`mux_stream_key` text,
	`mux_asset_id` text,
	`mux_vod_playback_id` text,
	`mux_recording_ready` integer DEFAULT false NOT NULL,
	`mux_duration` real,
	`mux_reconnect_window` integer,
	`mux_streaming_status` text,
	`chat_enabled` integer DEFAULT false NOT NULL,
	`chat_locked` integer DEFAULT false NOT NULL,
	`chat_archived` integer DEFAULT false NOT NULL,
	`chat_moderation_mode` text,
	`embed_code` text,
	`embed_title` text,
	`embed_position` text,
	`embed_created_at` text,
	`embed_created_by` text,
	`analytics` text,
	`extra` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `streams_memorial_idx` ON `streams` (`memorial_id`);--> statement-breakpoint
CREATE INDEX `streams_status_idx` ON `streams` (`status`);--> statement-breakpoint
CREATE INDEX `streams_mux_live_idx` ON `streams` (`mux_live_stream_id`);--> statement-breakpoint
CREATE TABLE `booking_items` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`name` text NOT NULL,
	`package` text,
	`price` real DEFAULT 0 NOT NULL,
	`quantity` integer,
	`total` real,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `bi_booking_idx` ON `booking_items` (`booking_id`,`position`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text,
	`user_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`step` integer DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`form_data` text,
	`payment_intent_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `bookings_memorial_idx` ON `bookings` (`memorial_id`);--> statement-breakpoint
CREATE INDEX `bookings_user_idx` ON `bookings` (`user_id`);--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`name` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ii_invoice_idx` ON `invoice_items` (`invoice_id`,`position`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_email` text NOT NULL,
	`customer_name` text,
	`total` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_by` text NOT NULL,
	`memorial_id` text,
	`stripe_session_id` text,
	`payment_intent_id` text,
	`expires_at` text,
	`paid_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `invoices_email_idx` ON `invoices` (`customer_email`);--> statement-breakpoint
CREATE INDEX `invoices_memorial_idx` ON `invoices` (`memorial_id`);--> statement-breakpoint
CREATE INDEX `invoices_status_idx` ON `invoices` (`status`);--> statement-breakpoint
CREATE TABLE `slideshow_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text,
	`user_id` text,
	`data` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sd_memorial_idx` ON `slideshow_drafts` (`memorial_id`);--> statement-breakpoint
CREATE INDEX `sd_user_idx` ON `slideshow_drafts` (`user_id`);--> statement-breakpoint
CREATE TABLE `slideshow_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`slideshow_id` text NOT NULL,
	`url` text NOT NULL,
	`storage_path` text DEFAULT '' NOT NULL,
	`caption` text,
	`duration` real,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sp_slideshow_idx` ON `slideshow_photos` (`slideshow_id`,`position`);--> statement-breakpoint
CREATE TABLE `slideshows` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`storage_path` text DEFAULT '' NOT NULL,
	`playback_url` text DEFAULT '' NOT NULL,
	`thumbnail_url` text,
	`status` text DEFAULT 'processing' NOT NULL,
	`is_firebase_hosted` integer DEFAULT true NOT NULL,
	`embed_code` text,
	`settings` text,
	`audio` text,
	`created_by` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `slideshows_memorial_idx` ON `slideshows` (`memorial_id`);--> statement-breakpoint
CREATE TABLE `blog_post_tags` (
	`post_id` text NOT NULL,
	`tag` text NOT NULL,
	`kind` text DEFAULT 'tag' NOT NULL,
	PRIMARY KEY(`post_id`, `tag`, `kind`)
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`author_name` text,
	`author_email` text,
	`author_bio` text,
	`author_avatar` text,
	`featured_image` text,
	`featured_image_alt` text,
	`category` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`meta_title` text,
	`meta_description` text,
	`view_count` integer DEFAULT 0 NOT NULL,
	`published_at` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	`extra` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_slug_uq` ON `blog_posts` (`slug`);--> statement-breakpoint
CREATE INDEX `blog_status_published_idx` ON `blog_posts` (`status`,`published_at`);--> statement-breakpoint
CREATE TABLE `wiki_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`color` text DEFAULT '#888888' NOT NULL,
	`icon` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wiki_page_tags` (
	`page_id` text NOT NULL,
	`tag` text NOT NULL,
	PRIMARY KEY(`page_id`, `tag`)
);
--> statement-breakpoint
CREATE TABLE `wiki_page_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`page_id` text NOT NULL,
	`version` integer NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`edited_by` text NOT NULL,
	`edited_by_email` text DEFAULT '' NOT NULL,
	`edited_at` text NOT NULL,
	`change_description` text
);
--> statement-breakpoint
CREATE INDEX `wpv_page_idx` ON `wiki_page_versions` (`page_id`,`version`);--> statement-breakpoint
CREATE TABLE `wiki_pages` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`category` text,
	`created_by` text DEFAULT '' NOT NULL,
	`created_by_email` text DEFAULT '' NOT NULL,
	`updated_by` text DEFAULT '' NOT NULL,
	`updated_by_email` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`parent_page_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wiki_slug_uq` ON `wiki_pages` (`slug`);--> statement-breakpoint
CREATE INDEX `wiki_category_idx` ON `wiki_pages` (`category`);--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`memorial_id` text,
	`stream_id` text,
	`payload` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ae_kind_idx` ON `analytics_events` (`kind`,`created_at`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text DEFAULT 'audit_logs' NOT NULL,
	`action` text NOT NULL,
	`actor_uid` text,
	`actor_email` text,
	`actor_role` text,
	`target_type` text,
	`target_id` text,
	`memorial_id` text,
	`success` text,
	`error_message` text,
	`ip_address` text,
	`user_agent` text,
	`details` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `audit_actor_idx` ON `audit_logs` (`actor_uid`);--> statement-breakpoint
CREATE INDEX `audit_source_idx` ON `audit_logs` (`source`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_target_idx` ON `audit_logs` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `email_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`template_id` text,
	`template_name` text,
	`to_email` text NOT NULL,
	`cc` text,
	`from_email` text DEFAULT '' NOT NULL,
	`subject` text,
	`template_data` text,
	`sent_at` text NOT NULL,
	`triggered_by` text DEFAULT '' NOT NULL,
	`triggered_by_user_id` text,
	`triggered_by_admin_id` text,
	`memorial_id` text,
	`user_id` text,
	`invoice_id` text,
	`stream_id` text,
	`status` text NOT NULL,
	`error` text,
	`sendgrid_message_id` text,
	`environment` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `eal_sent_idx` ON `email_audit_logs` (`sent_at`);--> statement-breakpoint
CREATE INDEX `eal_to_idx` ON `email_audit_logs` (`to_email`);--> statement-breakpoint
CREATE INDEX `eal_memorial_idx` ON `email_audit_logs` (`memorial_id`);--> statement-breakpoint
CREATE INDEX `eal_type_idx` ON `email_audit_logs` (`type`);