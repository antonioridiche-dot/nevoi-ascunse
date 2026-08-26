import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Weightloss site chrome routing", () => {
  it("uses direct Weightloss routes and retains no legacy offer prefix", () => {
    const source = fs.readFileSync(path.join(import.meta.dirname, "WeightlossSiteChrome.tsx"), "utf8");
    expect(source).not.toContain("/oferte/weightloss");
    expect(source).toContain('href="/weightloss/comanda?produs=bucatarie"');
    expect(source).toContain('href="/weightloss/afiliati"');
  });
});
