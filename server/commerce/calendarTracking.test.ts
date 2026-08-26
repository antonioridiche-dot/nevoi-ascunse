import { calendarLifecycleEvents } from "./calendarTracking";
import { describe, expect, it } from "vitest";

describe("Calendarul norocului lifecycle source contract", () => {
  it("păstrează toate evenimentele lifecycle definite de repository-ul sursă", () => {
    expect(calendarLifecycleEvents).toEqual([
      "landing_viewed", "method_viewed", "birth_form_started", "birth_form_completed",
      "preview_generated", "marketing_opted_in", "package_viewed", "package_selected",
      "cart_started", "checkout_created", "payment_form_loaded", "payment_submit_attempted",
      "payment_failed", "purchase_completed", "next_step_seen", "next_step_accepted",
      "next_step_skipped", "thank_you_viewed",
    ]);
  });
});
