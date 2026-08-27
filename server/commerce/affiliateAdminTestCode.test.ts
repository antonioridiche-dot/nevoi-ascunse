import { describe, expect, it } from "vitest";
import { isAffiliateAdminTestCodeValid } from "./affiliateHubService";

describe("codul temporar admin afiliere", () => {
  it("acceptă codul doar pentru e-mailul admin configurat", () => {
    expect(isAffiliateAdminTestCodeValid({ email: "antonio.ridiche@gmail.com", code: "123456" })).toBe(true);
    expect(isAffiliateAdminTestCodeValid({ email: "alt@example.com", code: "123456" })).toBe(false);
    expect(isAffiliateAdminTestCodeValid({ email: "antonio.ridiche@gmail.com", code: "000000" })).toBe(false);
  });
});
