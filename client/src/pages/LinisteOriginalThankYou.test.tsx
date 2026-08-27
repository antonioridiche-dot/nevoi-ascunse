import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Thank You Liniște Audio", () => {
  it("păstrează stările sursă fără a expune URL-uri către activele complete indisponibile", () => {
    const source = fs.readFileSync(path.join(import.meta.dirname, "LinisteOriginalCheckout.tsx"), "utf8");
    expect(source).toContain("Audio-urile tale sunt gata.");
    expect(source).toContain("Livrare indisponibilă");
    expect(source).toContain("accesul funcționează doar prin linkul personal");
    expect(source).not.toContain("deliveryUrl");
    expect(source).not.toContain("-full.wav");
  });
});
