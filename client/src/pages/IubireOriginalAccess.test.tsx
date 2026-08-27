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

  it("uses the source Iubire visual tokens without substituting the unavailable cover", () => {
    const styles = fs.readFileSync(path.join(import.meta.dirname, "iubire-original.css"), "utf8");
    expect(styles).toContain("--plum:#25182c");
    expect(styles).toContain("--gold:#d6a653");
    expect(styles).toContain(".iubire-page>.iubire-hero");
    expect(styles).not.toContain("deschide-spatiu-pentru-iubire-cover_e131dc1b.png");
  });
});
