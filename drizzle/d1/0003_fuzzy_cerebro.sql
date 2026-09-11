CREATE TABLE `affiliate_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tokenHash` text NOT NULL,
	`affiliateId` integer NOT NULL,
	`expiresAt` integer NOT NULL,
	`lastUsedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`userAgent` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `affiliate_sessions_tokenHash_unique` ON `affiliate_sessions` (`tokenHash`);