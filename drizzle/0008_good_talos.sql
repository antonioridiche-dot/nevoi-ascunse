ALTER TABLE `checkout_sessions` ADD `affiliateAttributionId` int;--> statement-breakpoint
ALTER TABLE `checkout_sessions` ADD COLUMN `affiliateAttributionId` int NULL;--> statement-breakpoint
ALTER TABLE `checkout_sessions` ADD CONSTRAINT `chk_attr_fk` FOREIGN KEY (`affiliateAttributionId`) REFERENCES `affiliate_attributions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `checkout_sessions_affiliate_attribution_index` ON `checkout_sessions` (`affiliateAttributionId`);
