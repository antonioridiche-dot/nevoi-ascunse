CREATE TABLE `coaching_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`contactId` int NOT NULL,
	`context` text NOT NULL,
	`status` enum('pending','reviewing','accepted','declined') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coaching_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `coaching_applications` ADD CONSTRAINT `coaching_applications_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coaching_applications` ADD CONSTRAINT `coaching_applications_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `coaching_applications_brand_status_index` ON `coaching_applications` (`brandId`,`status`);--> statement-breakpoint
CREATE INDEX `coaching_applications_contact_index` ON `coaching_applications` (`contactId`);