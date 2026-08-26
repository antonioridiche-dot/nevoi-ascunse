import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getBrandCatalog: vi.fn(),
}));

vi.mock("./db", () => ({
  getBrandCatalog: mocks.getBrandCatalog,
}));

import { appRouter } from "./routers";

describe("catalog.listBrands", () => {
  beforeEach(() => {
    mocks.getBrandCatalog.mockReset();
  });

  it("returns the configured brands without requiring authentication", async () => {
    mocks.getBrandCatalog.mockResolvedValue([
      {
        key: "tarot",
        displayName: "Tarot",
        routeBase: "/tarot",
        category: "Ritualuri",
        senderName: null,
        senderEmail: null,
        status: "migrating",
      },
    ]);

    const caller = appRouter.createCaller({
      user: null,
      req: {} as never,
      res: {} as never,
    });

    await expect(caller.catalog.listBrands()).resolves.toEqual([
      expect.objectContaining({ key: "tarot", routeBase: "/tarot", status: "migrating" }),
    ]);
  });
});
