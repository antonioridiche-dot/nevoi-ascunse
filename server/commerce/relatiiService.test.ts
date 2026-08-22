import { describe, expect, it } from "vitest";
import { RELATII_PRODUCTS } from "./relatiiService";

describe("Relații embedded checkout configuration", () => {
  it("keeps the two source products bound to their intended audience", () => {
    expect(RELATII_PRODUCTS["dictionarul-femeilor"].audience).toBe("barbati");
    expect(RELATII_PRODUCTS["dictionarul-barbatilor"].audience).toBe("femei");
  });
});
