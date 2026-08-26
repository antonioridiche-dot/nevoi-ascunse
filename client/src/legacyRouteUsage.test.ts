import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function collectSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(file);
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx") ? [file] : [];
  });
}

describe("direct offer route convention", () => {
  it("keeps the legacy offer prefix only in the dedicated compatibility router", () => {
    const sourceRoot = path.join(import.meta.dirname);
    const offendingFiles = collectSourceFiles(sourceRoot)
      .filter((file) => path.basename(file) !== "App.tsx")
      .filter((file) => fs.readFileSync(file, "utf8").includes("/oferte/"));
    expect(offendingFiles).toEqual([]);
  });
});
