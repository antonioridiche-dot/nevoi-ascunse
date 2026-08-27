import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("recuperare Familie protejată", () => {
  it("nu promite trimiterea unui link când expeditorul nu este verificat", () => {
    const service = fs.readFileSync(path.join(import.meta.dirname, "familyAccess.ts"), "utf8");
    const page = fs.readFileSync(path.join(import.meta.dirname, "../../client/src/pages/FamilyOriginalDashboard.tsx"), "utf8");
    expect(service).toContain("Nu trimitem linkuri prin e-mail până când expeditorul nu este verificat.");
    expect(service).not.toContain("vei primi un link securizat");
    expect(page).toContain("ÎNREGISTREAZĂ SOLICITAREA");
    expect(page).not.toContain("TRIMITE LINKUL");
  });
});
