import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("contractul de înscriere afiliat", () => {
  it("acceptă public numai e-mailul și acordul, fără nume obligatoriu", () => {
    const router = fs.readFileSync(path.join(import.meta.dirname, "routers.ts"), "utf8");
    const service = fs.readFileSync(path.join(import.meta.dirname, "commerce", "affiliateHubService.ts"), "utf8");
    expect(router).toContain('register: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), acceptedTerms: z.literal(true) }))');
    expect(router).not.toContain('register: publicProcedure.input(z.object({ displayName:');
    expect(service).toContain('registerAffiliate(input: { email: string; acceptedTerms: boolean })');
  });
});
