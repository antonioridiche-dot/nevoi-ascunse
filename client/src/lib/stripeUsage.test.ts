import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const checkoutPages = [
  "FamilyOriginalHome.tsx",
  "RelatiiOriginalProduct.tsx",
  "TarotOriginalCheckout.tsx",
  "VrajiOriginalHome.tsx",
  "WeightlossOriginalCheckout.tsx",
  "WeightlossOriginalUpsell.tsx",
  "CalendarLuckyPreview.tsx",
  "ArmoniiOriginalHome.tsx",
  "IubireOriginalFunnel.tsx",
  "LinisteOriginalCheckout.tsx",
  "ArmoniiOriginalConfirmation.tsx",
];

describe("Stripe.js shared adapter", () => {
  it("keeps active checkout modules on the shared Stripe.js promise", () => {
    for (const file of checkoutPages) {
      const source = fs.readFileSync(path.join(import.meta.dirname, "..", "pages", file), "utf8");
      expect(source).toContain('from "@/lib/stripe"');
      expect(source).not.toContain("loadStripe(");
    }
  });
});
