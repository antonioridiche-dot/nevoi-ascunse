CREATE TABLE `affiliate_login_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`purpose` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`usedAt` integer,
	`attempts` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `affiliates` ADD `payoutMethod` text;--> statement-breakpoint
ALTER TABLE `affiliates` ADD `payoutDetails` text;