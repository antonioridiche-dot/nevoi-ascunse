CREATE TABLE `access_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`brandId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`deviceHash` varchar(128),
	`expiresAt` timestamp NOT NULL,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `access_sessions_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_clicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`trackingSessionId` int,
	`landingPath` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`orderItemId` int NOT NULL,
	`commissionRateBps` int NOT NULL,
	`commissionAmountCents` int NOT NULL,
	`status` enum('pending','approved','paid','void') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`paidAt` timestamp,
	CONSTRAINT `affiliate_commissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliate_commissions_item_unique` UNIQUE(`affiliateId`,`orderItemId`)
);
--> statement-breakpoint
CREATE TABLE `affiliates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`userId` int,
	`email` varchar(320) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`affiliateCode` varchar(64) NOT NULL,
	`status` enum('pending','active','paused') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliates_brand_code_unique` UNIQUE(`brandId`,`affiliateCode`)
);
--> statement-breakpoint
CREATE TABLE `brand_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`contactId` int NOT NULL,
	`marketingConsent` int NOT NULL DEFAULT 0,
	`transactionalConsentAt` timestamp,
	`marketingConsentAt` timestamp,
	`metadataJson` text,
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_contacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `brand_contacts_unique` UNIQUE(`brandId`,`contactId`)
);
--> statement-breakpoint
CREATE TABLE `brands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(80) NOT NULL,
	`displayName` varchar(180) NOT NULL,
	`routeBase` varchar(255) NOT NULL,
	`category` varchar(80) NOT NULL,
	`senderName` varchar(160),
	`senderEmail` varchar(320),
	`replyToEmail` varchar(320),
	`notificationRecipientsJson` text,
	`themeJson` text,
	`status` enum('draft','migrating','active','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brands_id` PRIMARY KEY(`id`),
	CONSTRAINT `brands_key_unique` UNIQUE(`key`),
	CONSTRAINT `brands_routeBase_unique` UNIQUE(`routeBase`)
);
--> statement-breakpoint
CREATE TABLE `checkout_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`productId` int NOT NULL,
	`offerStepId` int,
	`contactId` int,
	`trackingSessionId` int,
	`checkoutToken` varchar(96) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`checkoutState` enum('started','payment_pending','completed','abandoned','expired') NOT NULL DEFAULT 'started',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checkout_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `checkout_sessions_checkoutToken_unique` UNIQUE(`checkoutToken`),
	CONSTRAINT `checkout_sessions_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);
--> statement-breakpoint
CREATE TABLE `contact_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandContactId` int NOT NULL,
	`tagId` int NOT NULL,
	`source` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `contact_tags_unique` UNIQUE(`brandContactId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`firstName` varchar(160),
	`lastName` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `contacts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `email_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`contactId` int NOT NULL,
	`orderId` int,
	`templateKey` varchar(160) NOT NULL,
	`category` enum('transactional','lifecycle','marketing','operational') NOT NULL,
	`resendEmailId` varchar(255),
	`senderEmail` varchar(320) NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_messages_resendEmailId_unique` UNIQUE(`resendEmailId`)
);
--> statement-breakpoint
CREATE TABLE `email_provider_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`emailMessageId` int,
	`providerEventId` varchar(255) NOT NULL,
	`providerMessageId` varchar(255),
	`eventType` varchar(120) NOT NULL,
	`occurredAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_provider_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_provider_events_providerEventId_unique` UNIQUE(`providerEventId`)
);
--> statement-breakpoint
CREATE TABLE `entitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`brandId` int NOT NULL,
	`productId` int NOT NULL,
	`orderItemId` int NOT NULL,
	`status` enum('active','revoked','expired') NOT NULL DEFAULT 'active',
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `entitlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `entitlements_contact_product_unique` UNIQUE(`contactId`,`productId`)
);
--> statement-breakpoint
CREATE TABLE `funnel_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`contactId` int,
	`orderId` int,
	`trackingSessionId` int,
	`eventType` varchar(120) NOT NULL,
	`metadataJson` text,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `funnel_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offer_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`productId` int NOT NULL,
	`stepKey` varchar(120) NOT NULL,
	`stage` enum('fe','oto','downsell','bump','confirmation') NOT NULL,
	`routeSuffix` varchar(255) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`stripePriceId` varchar(255),
	`metadataJson` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offer_steps_id` PRIMARY KEY(`id`),
	CONSTRAINT `offer_steps_brand_key_unique` UNIQUE(`brandId`,`stepKey`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`offerStepId` int,
	`stripePriceId` varchar(255),
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `order_items_order_product_unique` UNIQUE(`orderId`,`productId`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`contactId` int NOT NULL,
	`checkoutSessionId` int,
	`stripeCustomerId` varchar(255),
	`stripePaymentIntentId` varchar(255) NOT NULL,
	`fulfillmentStatus` enum('pending','fulfilled','revoked','refunded') NOT NULL DEFAULT 'pending',
	`fulfilledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);
--> statement-breakpoint
CREATE TABLE `product_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`label` varchar(255) NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`mimeType` varchar(160),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`productKey` varchar(120) NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`description` text,
	`stripeProductId` varchar(255),
	`stripePriceId` varchar(255),
	`accessMode` enum('library','download','service','mixed') NOT NULL DEFAULT 'library',
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_brand_key_unique` UNIQUE(`brandId`,`productKey`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`key` varchar(120) NOT NULL,
	`label` varchar(180) NOT NULL,
	`kind` enum('system','marketing','lifecycle','manual') NOT NULL DEFAULT 'system',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_brand_key_unique` UNIQUE(`brandId`,`key`)
);
--> statement-breakpoint
CREATE TABLE `tracking_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`sessionToken` varchar(96) NOT NULL,
	`contactId` int,
	`affiliateCode` varchar(64),
	`landingPath` varchar(500),
	`attributionJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tracking_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `tracking_sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `webhook_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('stripe','resend') NOT NULL,
	`providerEventId` varchar(255) NOT NULL,
	`eventType` varchar(160) NOT NULL,
	`processingStatus` enum('received','processed','failed') NOT NULL DEFAULT 'received',
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhook_deliveries_provider_event_unique` UNIQUE(`provider`,`providerEventId`)
);
--> statement-breakpoint
ALTER TABLE `access_sessions` ADD CONSTRAINT `access_sessions_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `access_sessions` ADD CONSTRAINT `access_sessions_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_clicks` ADD CONSTRAINT `affiliate_clicks_affiliateId_affiliates_id_fk` FOREIGN KEY (`affiliateId`) REFERENCES `affiliates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_clicks` ADD CONSTRAINT `affiliate_clicks_trackingSessionId_tracking_sessions_id_fk` FOREIGN KEY (`trackingSessionId`) REFERENCES `tracking_sessions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_commissions` ADD CONSTRAINT `affiliate_commissions_affiliateId_affiliates_id_fk` FOREIGN KEY (`affiliateId`) REFERENCES `affiliates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_commissions` ADD CONSTRAINT `affiliate_commissions_orderItemId_order_items_id_fk` FOREIGN KEY (`orderItemId`) REFERENCES `order_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliates` ADD CONSTRAINT `affiliates_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliates` ADD CONSTRAINT `affiliates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `brand_contacts` ADD CONSTRAINT `brand_contacts_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `brand_contacts` ADD CONSTRAINT `brand_contacts_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checkout_sessions` ADD CONSTRAINT `checkout_sessions_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checkout_sessions` ADD CONSTRAINT `checkout_sessions_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checkout_sessions` ADD CONSTRAINT `checkout_sessions_offerStepId_offer_steps_id_fk` FOREIGN KEY (`offerStepId`) REFERENCES `offer_steps`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checkout_sessions` ADD CONSTRAINT `checkout_sessions_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checkout_sessions` ADD CONSTRAINT `checkout_sessions_trackingSessionId_tracking_sessions_id_fk` FOREIGN KEY (`trackingSessionId`) REFERENCES `tracking_sessions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contact_tags` ADD CONSTRAINT `contact_tags_brandContactId_brand_contacts_id_fk` FOREIGN KEY (`brandContactId`) REFERENCES `brand_contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contact_tags` ADD CONSTRAINT `contact_tags_tagId_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_messages` ADD CONSTRAINT `email_messages_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_messages` ADD CONSTRAINT `email_messages_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_messages` ADD CONSTRAINT `email_messages_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_provider_events` ADD CONSTRAINT `email_provider_events_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_provider_events` ADD CONSTRAINT `email_provider_events_emailMessageId_email_messages_id_fk` FOREIGN KEY (`emailMessageId`) REFERENCES `email_messages`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entitlements` ADD CONSTRAINT `entitlements_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entitlements` ADD CONSTRAINT `entitlements_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entitlements` ADD CONSTRAINT `entitlements_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entitlements` ADD CONSTRAINT `entitlements_orderItemId_order_items_id_fk` FOREIGN KEY (`orderItemId`) REFERENCES `order_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `funnel_events` ADD CONSTRAINT `funnel_events_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `funnel_events` ADD CONSTRAINT `funnel_events_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `funnel_events` ADD CONSTRAINT `funnel_events_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `funnel_events` ADD CONSTRAINT `funnel_events_trackingSessionId_tracking_sessions_id_fk` FOREIGN KEY (`trackingSessionId`) REFERENCES `tracking_sessions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offer_steps` ADD CONSTRAINT `offer_steps_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offer_steps` ADD CONSTRAINT `offer_steps_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_offerStepId_offer_steps_id_fk` FOREIGN KEY (`offerStepId`) REFERENCES `offer_steps`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_checkoutSessionId_checkout_sessions_id_fk` FOREIGN KEY (`checkoutSessionId`) REFERENCES `checkout_sessions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_assets` ADD CONSTRAINT `product_assets_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `tags_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tracking_sessions` ADD CONSTRAINT `tracking_sessions_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tracking_sessions` ADD CONSTRAINT `tracking_sessions_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `access_sessions_contact_brand_index` ON `access_sessions` (`contactId`,`brandId`);--> statement-breakpoint
CREATE INDEX `affiliates_brand_email_index` ON `affiliates` (`brandId`,`email`);--> statement-breakpoint
CREATE INDEX `brand_contacts_brand_index` ON `brand_contacts` (`brandId`);--> statement-breakpoint
CREATE INDEX `checkout_sessions_brand_state_index` ON `checkout_sessions` (`brandId`,`checkoutState`);--> statement-breakpoint
CREATE INDEX `checkout_sessions_contact_index` ON `checkout_sessions` (`contactId`);--> statement-breakpoint
CREATE INDEX `email_messages_brand_contact_index` ON `email_messages` (`brandId`,`contactId`);--> statement-breakpoint
CREATE INDEX `email_provider_events_brand_type_index` ON `email_provider_events` (`brandId`,`eventType`);--> statement-breakpoint
CREATE INDEX `entitlements_brand_contact_index` ON `entitlements` (`brandId`,`contactId`);--> statement-breakpoint
CREATE INDEX `funnel_events_brand_type_index` ON `funnel_events` (`brandId`,`eventType`);--> statement-breakpoint
CREATE INDEX `funnel_events_contact_index` ON `funnel_events` (`contactId`);--> statement-breakpoint
CREATE INDEX `offer_steps_product_index` ON `offer_steps` (`productId`);--> statement-breakpoint
CREATE INDEX `orders_brand_contact_index` ON `orders` (`brandId`,`contactId`);--> statement-breakpoint
CREATE INDEX `products_brand_index` ON `products` (`brandId`);--> statement-breakpoint
CREATE INDEX `tracking_sessions_brand_index` ON `tracking_sessions` (`brandId`);--> statement-breakpoint
CREATE INDEX `tracking_sessions_contact_index` ON `tracking_sessions` (`contactId`);