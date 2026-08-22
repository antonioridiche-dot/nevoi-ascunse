import { describe, expect, it } from "vitest";
import { extractCookieValue } from "./tarotAccess";

describe("Tarot private access cookie", () => {
  it("extracts and decodes only the requested session cookie", () => {
    expect(extractCookieValue("theme=dark; mara_tarot_access=secret%2Dtoken; other=value", "mara_tarot_access")).toBe("secret-token");
  });

  it("does not create access when the session cookie is absent", () => {
    expect(extractCookieValue("theme=dark", "mara_tarot_access")).toBeUndefined();
  });
});
