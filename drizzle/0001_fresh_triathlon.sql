CREATE TABLE `intake_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`productId` int,
	`contactId` int NOT NULL,
	`trackingSessionId` int,
	`submissionKey` varchar(120) NOT NULL,
	`payloadJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `intake_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `intake_submissions` ADD CONSTRAINT `intake_submissions_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `intake_submissions` ADD CONSTRAINT `intake_submissions_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `intake_submissions` ADD CONSTRAINT `intake_submissions_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `intake_submissions` ADD CONSTRAINT `intake_submissions_trackingSessionId_tracking_sessions_id_fk` FOREIGN KEY (`trackingSessionId`) REFERENCES `tracking_sessions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `intake_submissions_brand_contact_index` ON `intake_submissions` (`brandId`,`contactId`);--> statement-breakpoint
CREATE INDEX `intake_submissions_product_index` ON `intake_submissions` (`productId`);