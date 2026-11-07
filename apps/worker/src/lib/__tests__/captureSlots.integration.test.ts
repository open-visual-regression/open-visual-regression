import { describe, expect, test } from "../../__tests__/fixtures";
import { createCaptureSlots } from "../captureSlots";

describe("createCaptureSlots", () => {
  test("should report a group as busy while it runs and free once it finishes", async ({
    metrics,
  }) => {
    const slots = createCaptureSlots(3);
    slots.observe();
    let finish = (): void => undefined;
    const running = slots.track(() => new Promise<void>((resolve) => (finish = resolve)))();

    const during = await metrics.scrape();
    finish();
    await running;
    const after = await metrics.scrape();

    expect(during).toContain("ovr_capture_slots 3");
    expect(during).toContain("ovr_capture_slots_busy 1");
    expect(after).toContain("ovr_capture_slots_busy 0");
  });

  test("should free the slot when a group fails", async ({ metrics }) => {
    const slots = createCaptureSlots(2);
    slots.observe();

    await expect(slots.track(() => Promise.reject(new Error("capture failed")))()).rejects.toThrow(
      "capture failed",
    );

    expect(await metrics.scrape()).toContain("ovr_capture_slots_busy 0");
  });
});
