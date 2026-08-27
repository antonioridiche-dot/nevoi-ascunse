import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Weightloss e-mail honesty", () => {
  it("nu promite confirmare sau acces e-mail când expeditorul nu este verificat", () => {
    const checkout = fs.readFileSync(path.join(import.meta.dirname, "WeightlossOriginalCheckout.tsx"), "utf8");
    const thankYou = fs.readFileSync(path.join(import.meta.dirname, "WeightlossOriginalThankYou.tsx"), "utf8");
    const upsell = fs.readFileSync(path.join(import.meta.dirname, "WeightlossOriginalUpsell.tsx"), "utf8");
    const chrome = fs.readFileSync(path.join(import.meta.dirname, "WeightlossSiteChrome.tsx"), "utf8");
    expect(checkout).toContain("Nu trimitem confirmare prin e-mail până când expeditorul nu este verificat.");
    expect(thankYou).toContain("Nu oferim acces prin e-mail până când expeditorul nu este verificat.");
    expect(thankYou).not.toContain("linkul de acces din e-mailul de confirmare");
    expect(upsell).not.toContain("confirmarea comenzii din e-mail");
    expect(chrome).toContain("Păstrează pagina finală deschisă după plată");
    expect(chrome).not.toContain("Păstrează e-mailul de confirmare");
  });
});
