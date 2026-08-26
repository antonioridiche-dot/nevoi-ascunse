import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Liniște Audio recovery", () => {
  it("retains the source delivery-ready branch while preserving a neutral result", () => {
    const source = fs.readFileSync(path.join(import.meta.dirname, "LinisteOriginalRecovery.tsx"), "utf8");
    expect(source).toContain("setDeliveryReady(data.deliveryReady)");
    expect(source).toContain("Dacă există o comandă asociată");
    expect(source).toContain("răspunsul nu confirmă dacă există o comandă asociată");
  });
});
