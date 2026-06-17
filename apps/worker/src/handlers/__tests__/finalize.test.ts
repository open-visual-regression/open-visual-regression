import { describe, expect, test, vi } from "vitest";

const finalizeBuild = vi.fn();

vi.mock("@ovr/services/builds", () => ({ finalizeBuild }));

const { finalizeHandler } = await import("../finalize");

describe("finalizeHandler", () => {
  test("calls finalizeBuild with the job's buildId", async () => {
    await finalizeHandler({ data: { buildId: "build-1" } } as never);

    expect(finalizeBuild).toHaveBeenCalledWith("build-1");
  });
});
