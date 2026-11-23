import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SnapshotPreferencesProvider } from "@/lib/providers/SnapshotPreferencesProvider";
import { describe, expect, it, render, screen, within } from "@/test-utils";

import { ComparisonModeProvider } from "../comparison-mode";
import { ComparisonControls } from "../ComparisonControls";
import { ComparisonView, type ComparisonViewProps } from "../ComparisonView";

const props: ComparisonViewProps = {
  baseline: {
    imagePath: "baseline.png",
    alt: "baseline snapshot",
    commitSha: null,
    commitUrl: null,
  },
  newSnapshot: { imagePath: "new.png", alt: "new snapshot" },
  diffImages: { baseline: "diff-baseline.png", newSnapshot: "diff.png" },
};

const renderComparison = (
  overrides: Partial<typeof props> = {},
  { showDiff = true, hasDiff = true } = {},
) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SnapshotPreferencesProvider
        initialPreferences={{ sidebarOpen: false, sidebarTab: "reviews", showDiff }}
      >
        <ComparisonModeProvider>
          <ComparisonControls hasDiff={hasDiff} />
          <ComparisonView {...props} {...overrides} />
        </ComparisonModeProvider>
      </SnapshotPreferencesProvider>
    </QueryClientProvider>,
  );

describe("ComparisonView", () => {
  it("should default to split view with both snapshots and the diff toggle visible", () => {
    renderComparison();

    expect(screen.getByRole("tab", { name: "split" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("img", { name: "baseline snapshot" })).toBeVisible();
    expect(screen.getByRole("img", { name: "new snapshot" })).toBeVisible();
    expect(screen.getByRole("switch")).toBeVisible();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("should switch to a unified slider that keeps the diff toggle and both overlays", async ({
    user,
  }) => {
    renderComparison();

    await user.click(screen.getByRole("tab", { name: "slider" }));

    expect(screen.getByRole("slider")).toBeVisible();
    expect(screen.getByRole("img", { name: "baseline snapshot" })).toBeVisible();
    expect(screen.getByRole("img", { name: "new snapshot" })).toBeVisible();
    expect(screen.getByRole("img", { name: "diff overlay of baseline snapshot" })).toBeVisible();
    expect(screen.getByRole("img", { name: "diff overlay of new snapshot" })).toBeVisible();
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("should hide both overlays when the diff is turned off", async ({ user }) => {
    renderComparison();

    await user.click(screen.getByRole("switch"));

    expect(screen.getByRole("img", { name: "diff overlay of baseline snapshot" })).toHaveClass(
      "invisible",
    );
    expect(screen.getByRole("img", { name: "diff overlay of new snapshot" })).toHaveClass(
      "invisible",
    );
    expect(screen.queryByText("removed")).not.toBeInTheDocument();
  });

  it("should not show the diff toggle when there is no diff image", () => {
    renderComparison({ diffImages: { baseline: null, newSnapshot: null } }, { hasDiff: false });

    expect(screen.getByRole("tab", { name: "split" })).toBeVisible();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("should still offer the slider view when there is a baseline but no diff image", async ({
    user,
  }) => {
    renderComparison({ diffImages: { baseline: null, newSnapshot: null } }, { hasDiff: false });

    await user.click(screen.getByRole("tab", { name: "slider" }));

    expect(screen.getByRole("slider")).toBeVisible();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("should open the zoom dialog on the snapshot that was clicked", async ({ user }) => {
    renderComparison();

    await user.click(screen.getByRole("button", { name: "zoom baseline" }));

    expect(screen.getByRole("dialog", { name: "baseline" })).toBeVisible();
  });

  it("should keep the diff hidden when it was turned off", () => {
    renderComparison({}, { showDiff: false });

    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("should open the new snapshot with the diff shown or hidden to match the split view", async ({
    user,
  }) => {
    renderComparison();

    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("button", { name: "zoom new" }));

    const dialog = screen.getByRole("dialog", { name: "new" });
    expect(within(dialog).getByRole("switch")).not.toBeChecked();
  });

  it("should keep the page's diff toggle in sync with the zoom dialog", async ({ user }) => {
    renderComparison();

    await user.click(screen.getByRole("button", { name: "zoom new" }));
    await user.click(within(screen.getByRole("dialog", { name: "new" })).getByRole("switch"));
    await user.click(screen.getByRole("button", { name: "close" }));

    expect(screen.getByRole("switch")).not.toBeChecked();
  });
});
