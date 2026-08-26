CREATE TABLE `affiliate_attributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`brandId` int NOT NULL,
	`visitorTokenHash` varchar(128) NOT NULL,
	`landingPath` varchar(500) NOT NULL,
	`clickedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `affiliate_attributions_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliate_attributions_visitor_brand_unique` UNIQUE(`visitorTokenHash`,`brandId`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_hub_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`affiliateCode` varchar(64) NOT NULL,
	`status` enum('active','paused') NOT NULL DEFAULT 'active',
	`termsVersion` varchar(32) NOT NULL,
	`termsAcceptedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliate_hub_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliate_hub_accounts_email_unique` UNIQUE(`email`),
	CONSTRAINT `affiliate_hub_accounts_affiliateCode_unique` UNIQUE(`affiliateCode`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_hub_login_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`codeHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_hub_login_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_hub_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_hub_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliate_hub_sessions_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_ledger_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`brandId` int NOT NULL,
	`orderId` int,
	`orderItemId` int,
	`entryType` enum('commission','refund_reversal','chargeback_adjustment','payout_debit') NOT NULL,
	`status` enum('pending','eligible','paid','reversed','chargeback_adjustment') NOT NULL DEFAULT 'pending',
	`commissionRateBps` int NOT NULL DEFAULT 5000,
	`grossSaleAmountCents` int NOT NULL DEFAULT 0,
	`excludedTaxAmountCents` int NOT NULL DEFAULT 0,
	`excludedProcessorFeeCents` int NOT NULL DEFAULT 0,
	`commissionBaseAmountCents` int NOT NULL DEFAULT 0,
	`grossCommissionAmountCents` int NOT NULL DEFAULT 0,
	`withholdingAmountCents` int NOT NULL DEFAULT 0,
	`netCommissionAmountCents` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL DEFAULT 'ron',
	`eligibleAt` timestamp NOT NULL,
	`reversedAt` timestamp,
	`metadataJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_ledger_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliate_ledger_order_item_commission_unique` UNIQUE(`affiliateId`,`orderItemId`,`entryType`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_payout_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`legalName` varchar(255) NOT NULL,
	`beneficiaryType` enum('individual','pfa','company') NOT NULL,
	`taxResidenceCountry` varchar(2) NOT NULL,
	`legalAddress` text NOT NULL,
	`taxIdentifier` varchar(120),
	`iban` varchar(64) NOT NULL,
	`bic` varchar(32),
	`payoutCurrency` enum('ron','eur') NOT NULL DEFAULT 'ron',
	`verificationStatus` enum('submitted','reviewing','approved','rejected') NOT NULL DEFAULT 'submitted',
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliate_payout_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliate_payout_profiles_affiliateId_unique` UNIQUE(`affiliateId`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_payout_request_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payoutRequestId` int NOT NULL,
	`ledgerEntryId` int NOT NULL,
	CONSTRAINT `affiliate_payout_request_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliate_payout_request_entry_unique` UNIQUE(`payoutRequestId`,`ledgerEntryId`),
	CONSTRAINT `affiliate_payout_ledger_once_unique` UNIQUE(`ledgerEntryId`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_payout_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`payoutProfileId` int NOT NULL,
	`requestedAmountCents` int NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'ron',
	`status` enum('requested','reviewing','approved','paid','rejected','cancelled') NOT NULL DEFAULT 'requested',
	`adminNote` text,
	`payoutReference` varchar(255),
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`paidAt` timestamp,
	CONSTRAINT `affiliate_payout_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `affiliate_attributions` ADD CONSTRAINT `a_attr_aff_fk` FOREIGN KEY (`affiliateId`) REFERENCES `affiliate_hub_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_attributions` ADD CONSTRAINT `a_attr_brand_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_hub_login_codes` ADD CONSTRAINT `a_login_aff_fk` FOREIGN KEY (`affiliateId`) REFERENCES `affiliate_hub_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_hub_sessions` ADD CONSTRAINT `a_sess_aff_fk` FOREIGN KEY (`affiliateId`) REFERENCES `affiliate_hub_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_ledger_entries` ADD CONSTRAINT `a_led_aff_fk` FOREIGN KEY (`affiliateId`) REFERENCES `affiliate_hub_accounts`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_ledger_entries` ADD CONSTRAINT `a_led_brand_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_ledger_entries` ADD CONSTRAINT `a_led_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_ledger_entries` ADD CONSTRAINT `a_led_item_fk` FOREIGN KEY (`orderItemId`) REFERENCES `order_items`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_payout_profiles` ADD CONSTRAINT `a_prof_aff_fk` FOREIGN KEY (`affiliateId`) REFERENCES `affiliate_hub_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_payout_request_entries` ADD CONSTRAINT `a_req_ent_req_fk` FOREIGN KEY (`payoutRequestId`) REFERENCES `affiliate_payout_requests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_payout_request_entries` ADD CONSTRAINT `a_req_ent_led_fk` FOREIGN KEY (`ledgerEntryId`) REFERENCES `affiliate_ledger_entries`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_payout_requests` ADD CONSTRAINT `a_req_aff_fk` FOREIGN KEY (`affiliateId`) REFERENCES `affiliate_hub_accounts`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_payout_requests` ADD CONSTRAINT `a_req_prof_fk` FOREIGN KEY (`payoutProfileId`) REFERENCES `affiliate_payout_profiles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `affiliate_attributions_affiliate_brand_index` ON `affiliate_attributions` (`affiliateId`,`brandId`);--> statement-breakpoint
CREATE INDEX `affiliate_hub_login_codes_affiliate_index` ON `affiliate_hub_login_codes` (`affiliateId`);--> statement-breakpoint
CREATE INDEX `affiliate_hub_sessions_affiliate_index` ON `affiliate_hub_sessions` (`affiliateId`);--> statement-breakpoint
CREATE INDEX `affiliate_ledger_affiliate_status_index` ON `affiliate_ledger_entries` (`affiliateId`,`status`);--> statement-breakpoint
CREATE INDEX `affiliate_ledger_brand_order_index` ON `affiliate_ledger_entries` (`brandId`,`orderId`);
