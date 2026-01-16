PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_document` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text,
	`uploaded_by_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_size` integer NOT NULL,
	`mime_type` text NOT NULL,
	`uploaded_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `case`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`uploaded_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_document`("id", "case_id", "uploaded_by_id", "file_name", "file_path", "file_size", "mime_type", "uploaded_at") SELECT "id", "case_id", "uploaded_by_id", "file_name", "file_path", "file_size", "mime_type", "uploaded_at" FROM `document`;--> statement-breakpoint
DROP TABLE `document`;--> statement-breakpoint
ALTER TABLE `__new_document` RENAME TO `document`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_message` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text,
	`recipient_id` text,
	`sender_id` text NOT NULL,
	`content` text NOT NULL,
	`attachment_document_id` text,
	`created_at` integer NOT NULL,
	`read_at` integer,
	FOREIGN KEY (`case_id`) REFERENCES `case`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`recipient_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`attachment_document_id`) REFERENCES `document`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_message`("id", "case_id", "recipient_id", "sender_id", "content", "attachment_document_id", "created_at", "read_at") SELECT "id", "case_id", "recipient_id", "sender_id", "content", "attachment_document_id", "created_at", "read_at" FROM `message`;--> statement-breakpoint
DROP TABLE `message`;--> statement-breakpoint
ALTER TABLE `__new_message` RENAME TO `message`;