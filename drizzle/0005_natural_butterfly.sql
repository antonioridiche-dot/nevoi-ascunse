ALTER TABLE `orders` ADD `amountCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `currency` varchar(8) DEFAULT 'ron' NOT NULL;