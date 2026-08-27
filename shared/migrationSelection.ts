import { explicitlyExcludedRepositories, isApprovedMigrationRepository } from "./migrationAllowlist";

export type MigrationRepositoryRejectionReason = "empty" | "duplicate" | "explicitly_excluded" | "not_approved";

export type MigrationRepositorySelection = {
  approved: string[];
  rejected: Array<{ repository: string; reason: MigrationRepositoryRejectionReason }>;
};

/**
 * Selects only repository slugs that may enter a migration batch. This is an
 * importer-facing guard: a catalog record alone cannot make a source eligible.
 */
export function selectMigrationRepositories(candidates: readonly string[]): MigrationRepositorySelection {
  const approved: string[] = [];
  const rejected: MigrationRepositorySelection["rejected"] = [];

  for (const candidate of candidates) {
    const repository = candidate.trim().toLowerCase();
    if (!repository) {
      rejected.push({ repository, reason: "empty" });
    } else if (approved.includes(repository)) {
      rejected.push({ repository, reason: "duplicate" });
    } else if (explicitlyExcludedRepositories.includes(repository as (typeof explicitlyExcludedRepositories)[number])) {
      rejected.push({ repository, reason: "explicitly_excluded" });
    } else if (!isApprovedMigrationRepository(repository)) {
      rejected.push({ repository, reason: "not_approved" });
    } else {
      approved.push(repository);
    }
  }

  return { approved, rejected };
}

export function assertMigrationRepositoriesApproved(candidates: readonly string[]) {
  const selection = selectMigrationRepositories(candidates);
  if (selection.rejected.length) {
    const details = selection.rejected.map(({ repository, reason }) => `${repository || "(gol)"}: ${reason}`).join(", ");
    throw new Error(`Batchul de migrare conține repository-uri neeligibile: ${details}`);
  }
  return selection.approved;
}
