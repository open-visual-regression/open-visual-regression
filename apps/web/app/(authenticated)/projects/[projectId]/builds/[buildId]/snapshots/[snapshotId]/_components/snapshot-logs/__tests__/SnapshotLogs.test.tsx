import { describe, expect, it, render, screen } from "@/test-utils";
import { SnapshotLogs } from "../SnapshotLogs";

describe("SnapshotLogs", () => {
  it("should render nothing when there are no logs", () => {
    const { container } = render(<SnapshotLogs logs={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("should render each log line with its level and message", () => {
    render(
      <SnapshotLogs
        logs={[
          {
            id: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
            level: "error",
            message: "Timed out waiting for selector",
            timestamp: "2026-06-22T00:00:00.000Z",
          },
          {
            id: "019edfc7-e040-7492-86b2-ccfdc00cf6e3",
            level: "warn",
            message: "Retrying navigation",
            timestamp: "2026-06-22T00:00:01.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("[error] Timed out waiting for selector")).toBeVisible();
    expect(screen.getByText("[warn] Retrying navigation")).toBeVisible();
    expect(screen.getByText("logs")).toBeVisible();
    expect(screen.getByText("2 lines")).toBeVisible();
  });
});
