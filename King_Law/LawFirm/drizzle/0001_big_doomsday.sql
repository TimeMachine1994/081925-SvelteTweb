ALTER TABLE `document` ADD `direction` text DEFAULT 'outgoing' NOT NULL;--> statement-breakpoint
ALTER TABLE `document` ADD `message_id` text REFERENCES message(id);--> statement-breakpoint
ALTER TABLE `document` ADD `viewed_at` integer;--> statement-breakpoint
ALTER TABLE `document` ADD `shared_via` text DEFAULT 'upload' NOT NULL;