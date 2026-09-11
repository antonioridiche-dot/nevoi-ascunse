ALTER TABLE `affiliates` ADD `stripeConnectAccountId` text;--> statement-breakpoint
ALTER TABLE `affiliates` ADD `connectStatus` text DEFAULT 'none' NOT NULL;