import { describe, expect, it } from "vitest";
import { iubireCheckoutUrl, iubireExitHandoff, iubireSalesUrl } from "./iubireFunnel";

describe("hărți Iubire directe", () => {
  it("păstrează e-mailul și oferta exit pe rutele canonice", () => {
    expect(iubireSalesUrl("ana@example.ro")).toBe("/iubire?audience=general&email=ana%40example.ro");
    expect(iubireCheckoutUrl("ana@example.ro", "exit20")).toBe("/iubire/checkout?audience=general&email=ana%40example.ro&cart=1&offer=exit20");
    expect(iubireExitHandoff("Ana@Example.ro")).toEqual({ salesUrl: "/iubire?audience=general&email=ana%40example.ro&offer=exit20", checkoutUrl: "/iubire/checkout?audience=general&email=ana%40example.ro&cart=1&offer=exit20" });
  });
});
