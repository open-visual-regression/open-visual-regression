import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SnapshotPreferencesProvider } from "@/lib/providers/SnapshotPreferencesProvider";
import { describe, expect, it, render, screen } from "@/test-utils";

import { ComparisonModeProvider } from "../../snapshot-comparison-section/comparison-view/comparison-mode";
import { SnapshotZoomDialog, type SnapshotZoomDialogProps } from "../SnapshotZoomDialog";
import { SnapshotZoomTrigger } from "../SnapshotZoomTrigger";

const props: Omit<SnapshotZoomDialogProps, "children"> = {
  baseline: {
    imagePath: "baseline.png",
    alt: "baseline snapshot",
    commitSha: "abc1234567890",
    commitUrl: null,
  },
  newSnapshot: { imagePath: "new.png", alt: "new snapshot" },
  diffImagePath: "diff.png",
};

const renderDialog = (overrides: Partial<typeof props> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SnapshotPreferencesProvider
        initialPreferences={{ sidebarOpen: false, sidebarTab: "reviews", showDiff: true }}
      >
        <ComparisonModeProvider>
          <SnapshotZoomDialog {...props} {...overrides}>
            <SnapshotZoomTrigger view="baseline" />
            <SnapshotZoomTrigger view="new" />
          </SnapshotZoomDialog>
        </ComparisonModeProvider>
      </SnapshotPreferencesProvider>
    </QueryClientProvider>,
  );

describe("SnapshotZoomDialog", () => {
  it("should open the baseline with zoom controls when the baseline is clicked", async ({
    user,
  }) => {
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Zoom baseline" }));

    expect(screen.getByRole("dialog", { name: "Baseline" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Baseline" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByText("abc1234")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Fit" })).toBeVisible();
  });

  it("should open the new snapshot with its diff when the new snapshot is clicked", async ({
    user,
  }) => {
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Zoom new" }));

    expect(screen.getByRole("dialog", { name: "New" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "New" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("should switch between the baseline and the new snapshot", async ({ user }) => {
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Zoom new" }));
    await user.click(screen.getByRole("tab", { name: "Baseline" }));

    expect(screen.getByRole("dialog", { name: "Baseline" })).toBeVisible();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-disabled", "true");

    await user.click(screen.getByRole("tab", { name: "New" }));

    expect(screen.getByRole("dialog", { name: "New" })).toBeVisible();
    expect(screen.getByRole("switch")).not.toHaveAttribute("aria-disabled", "true");
  });

  it("should only show the new snapshot when there is no baseline", async ({ user }) => {
    renderDialog({ baseline: null, diffImagePath: null });

    await user.click(screen.getByRole("button", { name: "Zoom new" }));

    expect(screen.getByRole("dialog", { name: "New" })).toBeVisible();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "baseline snapshot" })).not.toBeInTheDocument();
  });

  it("should close the dialog from the toolbar", async ({ user }) => {
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Zoom baseline" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog", { name: "Baseline" })).not.toBeInTheDocument();
  });
});
