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
});
