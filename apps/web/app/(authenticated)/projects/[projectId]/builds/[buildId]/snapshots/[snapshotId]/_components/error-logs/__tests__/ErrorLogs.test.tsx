import { describe, expect, it, render, screen } from "@/test-utils";
import { ErrorLogs } from "../ErrorLogs";

describe("ErrorLogs", () => {
  it("should render each log line with its level and message", () => {
    render(
      <ErrorLogs
        logs={[
          { id: "1", level: "error", message: "boom", timestamp: "2026-06-20T00:00:00Z" },
          { id: "2", level: "warn", message: "careful", timestamp: "2026-06-20T00:00:01Z" },
        ]}
      />,
    );

    expect(screen.getByText("[error] boom")).toBeVisible();
    expect(screen.getByText("[warn] careful")).toBeVisible();
  });

  it("should render nothing when there are no logs", () => {
    const { container } = render(<ErrorLogs logs={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
