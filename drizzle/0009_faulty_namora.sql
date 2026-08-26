CREATE INDEX `affiliate_payout_request_entries_ledger_index` ON `affiliate_payout_request_entries` (`ledgerEntryId`);--> statement-breakpoint
ALTER TABLE `affiliate_payout_request_entries` DROP INDEX `affiliate_payout_ledger_once_unique`;
