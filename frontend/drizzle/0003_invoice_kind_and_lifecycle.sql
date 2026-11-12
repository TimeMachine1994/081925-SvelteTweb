ALTER TABLE `invoices` ADD `kind` text DEFAULT 'additional' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `note` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `cancelled_at` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `cancelled_by` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `last_sent_at` text;