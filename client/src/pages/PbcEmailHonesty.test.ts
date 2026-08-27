import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("transparență PBC privind e-mailul", () => {
  it("nu promite livrarea instrucțiunilor de acces prin e-mail", () => {
    const page = fs.readFileSync(path.join(import.meta.dirname, "PbcOriginalPages.tsx"), "utf8");
    expect(page).toContain("Instrucțiunile nu sunt trimise automat prin e-mail cât timp expeditorul nu este verificat.");
    expect(page).toContain("Acces digital verificat după confirmarea plății");
    expect(page).not.toContain("Ghid de acces digital trimis după confirmarea plății");
    const checkout = fs.readFileSync(path.join(import.meta.dirname, "PbcOriginalCheckout.tsx"), "utf8");
    expect(checkout).toContain("Instrucțiunile nu sunt trimise automat prin e-mail cât timp expeditorul nu este verificat.");
    expect(checkout).toContain("Instrucțiunile și linkurile nu sunt trimise automat prin e-mail cât timp expeditorul nu este verificat.");
    expect(checkout).not.toContain("Vei primi confirmarea și instrucțiunile de acces");
  });
});
