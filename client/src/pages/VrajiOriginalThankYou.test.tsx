import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Vrăji thank-you magic access", () => {
  it("retains the source one-time magic-link explanation", () => {
    const source = fs.readFileSync(path.join(import.meta.dirname, "VrajiOriginalThankYou.tsx"), "utf8");
    expect(source).toContain("Linkurile sunt de unică folosință și expiră repede.");
    expect(source).toContain("Cere link magic");
    expect(source).toContain("nu sunt trimise automat prin e-mail cât timp expeditorul nu este verificat");
    expect(source).not.toContain("vei primi automat confirmarea");
    const library = fs.readFileSync(path.join(import.meta.dirname, "VrajiOriginalLibrary.tsx"), "utf8");
    expect(library).toContain("E-mailul tranzacțional nu este disponibil până când domeniul expeditor nu este verificat.");
    expect(library).not.toContain("Emailul tranzacțional va fi activat");
  });
});
