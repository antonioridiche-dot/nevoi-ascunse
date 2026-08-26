import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Vrăji thank-you magic access", () => {
  it("retains the source one-time magic-link explanation", () => {
    const source = fs.readFileSync(path.join(import.meta.dirname, "VrajiOriginalThankYou.tsx"), "utf8");
    expect(source).toContain("Linkurile sunt de unică folosință și expiră repede.");
    expect(source).toContain("Cere link magic");
  });
});
