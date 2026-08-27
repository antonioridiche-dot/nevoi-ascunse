import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Quiz Familie protejată", () => {
  it("păstrează copy-ul și opțiunile sursei, cu ruta directă unificată", () => {
    const page = fs.readFileSync(path.join(import.meta.dirname, "FamilyOriginalQuiz.tsx"), "utf8");
    expect(page).toContain("Construiește-ți planul de pregătire.");
    expect(page).toContain("Familia și locuința");
    expect(page).toContain("Călătorii și deplasări");
    expect(page).toContain("Continuitatea muncii");
    expect(page).toContain("/familieprotejata?email=");
    expect(page).toContain("Nu îți cerem parolă și nu pierdem e-mailul pe parcurs.");
  });
});
