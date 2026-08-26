import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Iubire protected library", () => {
  it("keeps the source placeholder context and does not fabricate downloadable assets", () => {
    const source = fs.readFileSync(path.join(import.meta.dirname, "IubireOriginalAccess.tsx"), "utf8");
    expect(source).toContain("Structura resurselor este pregătită pentru materialele reale.");
    expect(source).toContain("Placeholder PDF · disponibil după încărcarea materialului final.");
  });
});
