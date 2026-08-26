import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Tarot journey direct routing", () => {
  it("does not retain legacy offer links in post-purchase transitions", () => {
    const source = fs.readFileSync(path.join(import.meta.dirname, "TarotJourney.tsx"), "utf8");
    expect(source).not.toContain("/oferte/tarot");
    expect(source).toContain('next: "/tarot/multumesc"');
    expect(source).toContain('href="/tarot/dashboard"');
  });
});
