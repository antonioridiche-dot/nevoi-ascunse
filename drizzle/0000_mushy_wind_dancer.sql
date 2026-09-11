CREATE TABLE `ab_tests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`targetId` text,
	`variants` text NOT NULL,
	`winner` text,
	`status` text DEFAULT 'running' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`completedAt` integer
);
--> statement-breakpoint
CREATE TABLE `affiliate_referrals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`affiliateId` integer NOT NULL,
	`contactId` integer,
	`ipAddress` text,
	`landingPage` text,
	`converted` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `affiliates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`referralCode` text NOT NULL,
	`passwordHash` text NOT NULL,
	`commissionPercent` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`totalEarned` integer DEFAULT 0 NOT NULL,
	`totalPaid` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `affiliates_email_unique` ON `affiliates` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `affiliates_referralCode_unique` ON `affiliates` (`referralCode`);--> statement-breakpoint
CREATE TABLE `commissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`affiliateId` integer NOT NULL,
	`orderId` integer,
	`amountInCents` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payableAt` integer,
	`paidAt` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`firstName` text,
	`gender` text NOT NULL,
	`tag` text,
	`status` text DEFAULT 'lead' NOT NULL,
	`procentSanse` integer,
	`leadScore` integer DEFAULT 0 NOT NULL,
	`pipelineStage` text DEFAULT 'quiz_completed' NOT NULL,
	`affiliateId` integer,
	`stripeCustomerId` text,
	`emailSubscribed` integer DEFAULT true NOT NULL,
	`currentSequenceStep` integer,
	`sequenceStartedAt` integer,
	`nextEmailAt` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contacts_email_unique` ON `contacts` (`email`);--> statement-breakpoint
CREATE TABLE `email_sends` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contactId` integer NOT NULL,
	`emailStepId` integer NOT NULL,
	`resendMessageId` text,
	`status` text DEFAULT 'sent' NOT NULL,
	`sentAt` integer DEFAULT (unixepoch()) NOT NULL,
	`openedAt` integer,
	`clickedAt` integer
);
--> statement-breakpoint
CREATE TABLE `email_sequences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`gender` text NOT NULL,
	`type` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `email_steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sequenceId` integer NOT NULL,
	`position` integer NOT NULL,
	`subject` text NOT NULL,
	`previewText` text,
	`body` text NOT NULL,
	`delaySeconds` integer NOT NULL,
	`abTestId` integer,
	`abVariant` text,
	`active` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `funnel_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contactId` integer,
	`sessionId` text,
	`event` text NOT NULL,
	`metadata` text,
	`gender` text,
	`abVariant` text,
	`abTestId` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contactId` integer NOT NULL,
	`productId` integer,
	`amountInCents` integer NOT NULL,
	`currency` text DEFAULT 'RON' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`stripePaymentIntentId` text,
	`stripeSessionId` text,
	`affiliateId` integer,
	`isUpsell` integer DEFAULT false NOT NULL,
	`refundedAt` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`affiliateId` integer NOT NULL,
	`amountInCents` integer NOT NULL,
	`paymentMethod` text,
	`paymentReference` text,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`priceInCents` integer NOT NULL,
	`stripePriceId` text,
	`stripeProductId` text,
	`type` text NOT NULL,
	`gender` text,
	`fileKey` text,
	`isSubscription` integer DEFAULT false NOT NULL,
	`upsellPosition` integer DEFAULT 0 NOT NULL,
	`commissionPercent` integer DEFAULT 50 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `quiz_responses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contactId` integer NOT NULL,
	`answers` text NOT NULL,
	`incercariReparare` text,
	`infidelitate` text,
	`durataRelatie` text,
	`timpDespartire` text,
	`initiatorDespartire` text,
	`comunicare` text,
	`sentimente` text,
	`scorFinal` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`lastSignedIn` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);