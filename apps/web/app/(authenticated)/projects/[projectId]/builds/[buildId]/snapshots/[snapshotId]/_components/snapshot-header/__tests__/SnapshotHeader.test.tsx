import { vi } from "vitest";
import type { DiffSchema } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { mocks } from "@ovr/mocks";
import { describe, expect, it, render, screen } from "@/test-utils";
import { SnapshotHeader } from "../SnapshotHeader";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const snapshot: SnapshotSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  targetName: "Kitchen Sink",
  targetTitle: "UI/Button",
  imagePath: "new.png",
  status: "needs_review",
  errorLogs: [],
};

const diff: DiffSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e3",
  processingStatus: "diffed",
  reviewStatus: "needs_review",
  diffImagePath: "diff.png",
  pixelDiffCount: 10,
  diffPercent: 1,
  baselineSnapshot: { imagePath: "baseline.png" },
};

describe("SnapshotHeader", () => {
  it("should show the approve and reject actions when the diff needs review", () => {
    const build = mocks.build.generateBuild();
    render(<SnapshotHeader snapshot={snapshot} build={build} diff={diff} />);

    expect(screen.getByRole("button", { name: /^approve$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^reject$/i })).toBeVisible();
  });

  it.each([
    ["there is no diff", null],
    ["the diff does not require review", { ...diff, reviewStatus: "not_required" as const }],
  ])("should hide the approve and reject actions when %s", (_description, diffInput) => {
    const build = mocks.build.generateBuild();
    render(<SnapshotHeader snapshot={snapshot} build={build} diff={diffInput} />);

    expect(screen.queryByRole("button", { name: /^approve$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^reject$/i })).not.toBeInTheDocument();
  });

  it("should hide the approve and reject actions when the snapshot failed to render, even if the diff needs review", () => {
    const build = mocks.build.generateBuild();
    render(
      <SnapshotHeader snapshot={{ ...snapshot, status: "error" }} build={build} diff={diff} />,
    );

    expect(screen.queryByRole("button", { name: /^approve$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^reject$/i })).not.toBeInTheDocument();
  });

  it("should show the snapshot status badge", () => {
    const build = mocks.build.generateBuild();
    render(
      <SnapshotHeader
        snapshot={{ ...snapshot, status: "needs_review" }}
        build={build}
        diff={diff}
      />,
    );

    expect(screen.getByText("needs review")).toBeVisible();
  });

  it("should show the error alert when the snapshot failed to capture", () => {
    const build = mocks.build.generateBuild();
    render(
      <SnapshotHeader snapshot={{ ...snapshot, status: "error" }} build={build} diff={null} />,
    );

    expect(screen.getByText("Error")).toBeVisible();
    expect(screen.getByText("This snapshot failed to capture.")).toBeVisible();
  });

  it("should not show the error alert when the snapshot did not fail to capture", () => {
    const build = mocks.build.generateBuild();
    render(
      <SnapshotHeader snapshot={{ ...snapshot, status: "passed" }} build={build} diff={null} />,
    );

    expect(screen.queryByText("Error")).not.toBeInTheDocument();
  });
});
