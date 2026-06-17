import { describe, expect, test, vi } from "vitest";

const dbClient = { builds: { updateStatus: vi.fn() } };
const extractBuild = vi.fn();

vi.mock("@ovr/db/client", () => ({ dbClient }));
vi.mock("@ovr/services/extract", () => ({ extractBuild }));

const { extractHandler, handleExtractFailed } = await import("../extract");

describe("extractHandler", () => {
  test("calls extractBuild with the job's buildId", async () => {
    await extractHandler({ data: { buildId: "build-1", artifactPath: "p" } } as never);

    expect(extractBuild).toHaveBeenCalledWith("build-1");
  });
});

describe("handleExtractFailed", () => {
  test("marks the build as errored", async () => {
    await handleExtractFailed({ data: { buildId: "build-1", artifactPath: "p" } } as never);

    expect(dbClient.builds.updateStatus).toHaveBeenCalledWith("build-1", "error");
  });
});
