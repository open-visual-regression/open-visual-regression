import { vi } from "vitest";

import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";

import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotLayout } from "../SnapshotLayout";

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

const renderComponent = () =>
  render(
    <SnapshotLayout
      snapshot={snapshot}
      diff={null}
      projectId="019edfc7-e040-7492-86b2-ccfdc00cf6e1"
      buildId="019edfc7-e040-7492-86b2-ccfdc00cf6e0"
      prevSnapshotId={null}
      nextSnapshotId={null}
      position={null}
      total={null}
      sidebar={<div>sidebar contents</div>}
    >
      <div>snapshot contents</div>
    </SnapshotLayout>,
  );

describe("SnapshotLayout", () => {
  it("should hide the sidebar until the toggle is clicked", () => {
    renderComponent();

    expect(screen.queryByText("sidebar contents")).not.toBeInTheDocument();
  });

  it("should open the sidebar when the expand toggle is clicked", async ({ user }) => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /expand sidebar/i }));

    expect(screen.getByText("sidebar contents")).toBeVisible();
  });

  it("should close the sidebar when the collapse toggle is clicked", async ({ user }) => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /expand sidebar/i }));
    await user.click(screen.getByRole("button", { name: /collapse sidebar/i }));

    expect(screen.queryByText("sidebar contents")).not.toBeInTheDocument();
  });
});
