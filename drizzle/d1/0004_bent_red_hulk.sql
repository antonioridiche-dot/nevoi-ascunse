CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spentAt` integer DEFAULT (unixepoch()) NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`description` text NOT NULL,
	`amountInCents` integer NOT NULL,
	`recurring` integer DEFAULT false NOT NULL,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
