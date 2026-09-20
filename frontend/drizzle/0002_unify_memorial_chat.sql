-- Consolidates the two chat systems into one per-memorial thread.
--
-- The `memorial_chat_messages` / `stream_chat_messages` tables created in
-- 0000_init.sql were schema scaffolding only — no repo in the app ever wrote
-- to them (chat has always lived in Firestore up to this point), so it's
-- safe to drop and recreate them here. Real production chat history lives in
-- Firestore (`streams/{id}/chat_messages`) and is migrated separately via
-- `scripts/migrate-chat-to-turso.mjs`, run by hand against the target Turso
-- database (not part of this migration).

DROP TABLE IF EXISTS `memorial_chat_messages`;
--> statement-breakpoint
DROP TABLE IF EXISTS `stream_chat_messages`;
--> statement-breakpoint
CREATE TABLE `memorial_chat_settings` (
	`memorial_id` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`locked` integer DEFAULT false NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memorial_chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text NOT NULL,
	`author_type` text NOT NULL,
	`user_id` text,
	`user_name` text NOT NULL,
	`user_role` text,
	`guest_session_id` text,
	`message` text NOT NULL,
	`is_edited` integer DEFAULT false NOT NULL,
	`edited_at` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	`deleted_by` text,
	`flagged` integer DEFAULT false NOT NULL,
	`flag_reason` text,
	`reply_to` text,
	`source_stream_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mcm_memorial_created_idx` ON `memorial_chat_messages` (`memorial_id`,`created_at`);
--> statement-breakpoint
ALTER TABLE `streams` DROP COLUMN `chat_enabled`;
--> statement-breakpoint
ALTER TABLE `streams` DROP COLUMN `chat_locked`;
--> statement-breakpoint
ALTER TABLE `streams` DROP COLUMN `chat_archived`;
--> statement-breakpoint
ALTER TABLE `streams` DROP COLUMN `chat_moderation_mode`;
