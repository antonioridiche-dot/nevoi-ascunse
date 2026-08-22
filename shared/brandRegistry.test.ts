import { describe, expect, it } from "vitest";
import { brandCatalog, brandCategories, findBrandByRoute } from "./brandRegistry";

describe("brand registry", () => {
  it("keeps unique keys and route bases for every brand", () => {
    const keys = brandCatalog.map((brand) => brand.key);
    const routes = brandCatalog.map((brand) => brand.routeBase);

    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("keeps every brand inside the declared catalog categories", () => {
    const categories = new Set(brandCategories);

    brandCatalog.forEach((brand) => {
      expect(categories.has(brand.category)).toBe(true);
      expect(brand.routeBase).toMatch(/^\/oferte\/[a-z0-9-]+$/);
    });
  });

  it("finds the confirmed Familie protejată route", () => {
    expect(findBrandByRoute("/oferte/familieprotejata")?.sourceRepo).toBe("survival");
  });

  it("routes Vrăji to the active source-fidelity page", () => {
    const vraji = brandCatalog.find((brand) => brand.key === "vraji");

    expect(vraji?.routeBase).toBe("/oferte/vraji");
    expect(vraji?.displayName).toBe("Vrăji");
    // Legacy public path must remain unresolved after the source-fidelity correction.
    expect(findBrandByRoute("/oferte/vrajii")).toBeUndefined();
  });
});
