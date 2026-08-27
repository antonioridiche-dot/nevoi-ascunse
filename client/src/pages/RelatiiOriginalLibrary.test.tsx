import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Relații library recovery", () => {
  it("nu promite trimiterea unui magic link cât timp expeditorul nu este verificat", () => {
    const source = fs.readFileSync(path.join(import.meta.dirname, "RelatiiOriginalLibrary.tsx"), "utf8");
    expect(source).toContain("Nu trimitem instrucțiuni prin e-mail până când expeditorul nu este verificat.");
    expect(source).toContain("Solicită verificarea accesului");
    expect(source).not.toContain("Vei primi un link securizat");
  });
});
