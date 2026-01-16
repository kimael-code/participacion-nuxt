ALTER TABLE `csv_listings` ADD `listing_type` text DEFAULT 'participation' NOT NULL;--> statement-breakpoint
ALTER TABLE `csv_listings` ADD `sequence_number` integer DEFAULT 1 NOT NULL;