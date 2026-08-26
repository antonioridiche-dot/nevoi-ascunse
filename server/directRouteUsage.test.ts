import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function collectSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(file);
    return entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts") ? [file] : [];
  });
}

describe("server direct route convention", () => {
  it("does not emit legacy offer paths from Stripe callbacks or access links", () => {
    const serverRoot = path.join(import.meta.dirname);
    const offendingFiles = collectSourceFiles(serverRoot)
      .filter((file) => fs.readFileSync(file, "utf8").includes("/oferte/"));
    expect(offendingFiles).toEqual([]);
  });
});
