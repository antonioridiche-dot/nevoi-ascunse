import { describe, expect, it } from "vitest";
import { familyPrice } from "./familyConfig";
import { nextFamilyState } from "./familyService";

describe("Familie protejată funnel", () => {
  it("păstrează prețul promo și oferta de ieșire ale produsului inițial", () => {
    expect(familyPrice("last-mile-72-hour-readiness-plan", "ron", "promo67")).toBe(6700);
    expect(familyPrice("last-mile-72-hour-readiness-plan", "ron", "exit20")).toBe(4700);
    expect(familyPrice("last-mile-72-hour-readiness-plan", "eur", "promo67")).toBe(1300);
  });

  it("păstrează ramificarea originală oto1 → ds1 → ds2", () => {
    expect(nextFamilyState("oto1", true)).toBe("thank_you");
    expect(nextFamilyState("oto1", false)).toBe("ds1");
    expect(nextFamilyState("ds1", true)).toBe("thank_you");
    expect(nextFamilyState("ds1", false)).toBe("ds2");
    expect(nextFamilyState("ds2", false)).toBe("thank_you");
  });
});
