import { describe, expect, it } from "vitest";
import { ENV } from "../_core/env";

describe("Resend server configuration", () => {
  it("exposes the preconfigured Resend API key to server-side mail delivery", () => {
    expect(ENV.resendApiKey.trim().length).toBeGreaterThan(0);
  });
});
