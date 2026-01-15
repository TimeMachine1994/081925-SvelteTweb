CREATE TABLE `case` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`lawyer_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lawyer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `document` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`uploaded_by_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_size` integer NOT NULL,
	`mime_type` text NOT NULL,
	`uploaded_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `case`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `invoice` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'unpaid' NOT NULL,
	`due_date` integer NOT NULL,
	`paid_amount` integer DEFAULT 0 NOT NULL,
	`stripe_payment_intent_id` text,
	`created_at` integer NOT NULL,
	`paid_at` integer,
	FOREIGN KEY (`case_id`) REFERENCES `case`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `message` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`content` text NOT NULL,
	`attachment_document_id` text,
	`created_at` integer NOT NULL,
	`read_at` integer,
	FOREIGN KEY (`case_id`) REFERENCES `case`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`attachment_document_id`) REFERENCES `document`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'client' NOT NULL,
	`email` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`phone_number` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);