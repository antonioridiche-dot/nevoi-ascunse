import { describe, expect, it } from "vitest";
import { linisteLifecycleEvents } from "./linisteTracking";

describe("Liniște Audio lifecycle tracking", () => {
  it("acceptă numai evenimentul sursă de finalizare a quizului", () => {
    expect(linisteLifecycleEvents).toEqual(["quiz_completed"]);
  });
});
