import { describe, expect, it } from "vitest";
import { brandCatalog } from "./brandRegistry";
import { approvedSourceRepositories, explicitlyExcludedRepositories, isApprovedMigrationRepository } from "./migrationAllowlist";

describe("migration allowlist", () => {
  it("allows every public catalog source and only those sources", () => {
    expect(approvedSourceRepositories).toContain("weight-los-manifest");
    expect(brandCatalog.every((brand) => isApprovedMigrationRepository(brand.sourceRepo))).toBe(true);
    expect(isApprovedMigrationRepository("tarot")).toBe(true);
    expect(isApprovedMigrationRepository("survival")).toBe(true);
    expect(isApprovedMigrationRepository("weight-los-manifest")).toBe(true);
  });

  it("blocks excluded projects and the archived duplicate of Relații", () => {
    for (const repository of explicitlyExcludedRepositories) {
      expect(isApprovedMigrationRepository(repository)).toBe(false);
    }
  });

  it("does not let an unapproved repository enter the migration policy", () => {
    expect(isApprovedMigrationRepository("unapproved-example")).toBe(false);
  });
});
