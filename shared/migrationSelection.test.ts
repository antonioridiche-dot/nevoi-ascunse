import { describe, expect, it } from "vitest";
import { assertMigrationRepositoriesApproved, selectMigrationRepositories } from "./migrationSelection";

describe("migration repository selection", () => {
  it("selects only approved sources while reporting the exact rejected candidates", () => {
    expect(selectMigrationRepositories([" Tarot ", "iubire", "tarot", "tevreauinapoi", "groworpay-website", ""]))
      .toEqual({
        approved: ["tarot", "iubire"],
        rejected: [
          { repository: "tarot", reason: "duplicate" },
          { repository: "tevreauinapoi", reason: "explicitly_excluded" },
          { repository: "groworpay-website", reason: "not_approved" },
          { repository: "", reason: "empty" },
        ],
      });
  });

  it("refuses a batch when even one source is unapproved", () => {
    expect(() => assertMigrationRepositoriesApproved(["tarot", "dictionarulrelatiilor"])).toThrow("dictionarulrelatiilor: explicitly_excluded");
    expect(assertMigrationRepositoriesApproved(["tarot", "vraji-spells-store"])).toEqual(["tarot", "vraji-spells-store"]);
  });
});
