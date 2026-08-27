import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { calculateCalendarZodiac, calendarLifePathNumber, calendarPathFocus } from "./calendarSource";

describe("Calendarul norocului source contract", () => {
  it("calculează zodia la pragurile sursă", () => {
    expect(calculateCalendarZodiac(3, 20)?.name).toBe("Pești");
    expect(calculateCalendarZodiac(3, 21)?.name).toBe("Berbec");
    expect(calculateCalendarZodiac(12, 22)?.name).toBe("Capricorn");
  });

  it("păstrează reducerea sursă a numărului personal și interpretarea", () => {
    expect(calendarLifePathNumber(1, 1, 2000)).toBe(4);
    expect(calendarPathFocus(22)).toBe("viziune practică");
  });

  it("păstrează identificatorul anonim în trackingul și checkoutul Calendar", () => {
    const source = fs.readFileSync(path.join(import.meta.dirname, "../pages/CalendarLuckyPreview.tsx"), "utf8");
    expect(source).toContain("calendarVisitorId");
    expect(source).toContain("visitorId });");
    expect(source).toContain("oneClickConsent: false, visitorId");
  });

  it("păstrează tranziția sursă de la formular la încărcare și rezultat personal", () => {
    const source = fs.readFileSync(path.join(import.meta.dirname, "../pages/CalendarLuckyPreview.tsx"), "utf8");
    const result = fs.readFileSync(path.join(import.meta.dirname, "../pages/CalendarLuckyResult.tsx"), "utf8");
    expect(source).toContain("setStage(\"loading\")");
    expect(source).toContain("window.setTimeout(() => setStage(\"calendar\"), 1900)");
    expect(result).toContain("harta ta are 3 repere pentru tine");
    expect(result).toContain("RESTUL CALENDARULUI — SIGILAT");
    expect(result).toContain("Material pentru divertisment și reflecție personală");
  });
});
