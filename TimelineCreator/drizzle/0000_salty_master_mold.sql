CREATE TABLE `cached_events` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`event_data` text,
	`cached_at` integer NOT NULL,
	`etag` text,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `print_layout` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`layout_data` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `project` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`data_source_url` text,
	`data_source_type` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`color_theme` text DEFAULT 'default',
	`default_zoom_level` text DEFAULT 'month',
	`label_config` text,
	`master_timeline_height` integer DEFAULT 120,
	`zoom_timeline_height` integer DEFAULT 400,
	`timeline_style` text DEFAULT 'line',
	`calendar_granularity` text DEFAULT 'month',
	`color_mode` text DEFAULT 'binary',
	`event_color` text DEFAULT '#3B82F6',
	`show_legend` integer DEFAULT true,
	`date_range_start` integer,
	`date_range_end` integer,
	`column_mapping` text,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`age` integer,
	`username` text NOT NULL,
	`password_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);