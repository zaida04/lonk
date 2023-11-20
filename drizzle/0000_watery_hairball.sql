CREATE TABLE `links` (
	`id` text PRIMARY KEY NOT NULL,
	`short_link` text NOT NULL,
	`destination_link` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `links_short_link_unique` ON `links` (`short_link`);