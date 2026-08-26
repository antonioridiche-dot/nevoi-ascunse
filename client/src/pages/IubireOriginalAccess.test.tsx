import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Iubire protected library", () => {
  it("keeps the source placeholder context and does not fabricate downloadable assets", () => {
    const source = fs.readFileSync(path.join(import.meta.dirname, "IubireOriginalAccess.tsx"), "utf8");
    expect(source).toContain("Structura resurselor este pregătită pentru materialele reale.");
    expect(source).toContain("Placeholder PDF · disponibil după încărcarea materialului final.");
  });

  it("retains the source-only editorial sections without adding unavailable media", () => {
    const source = fs.readFileSync(path.join(import.meta.dirname, "IubireOriginalFunnel.tsx"), "utf8");
    expect(source).toContain("BONUSURI PRACTICE");
    expect(source).toContain("Repere pentru zilele în care emoțiile devin zgomotoase.");
    expect(source).toContain("Va atrage programul o persoană anume?");
    expect(source).not.toContain("deschide-spatiu-pentru-iubire-cover_e131dc1b.png");
  });
});
