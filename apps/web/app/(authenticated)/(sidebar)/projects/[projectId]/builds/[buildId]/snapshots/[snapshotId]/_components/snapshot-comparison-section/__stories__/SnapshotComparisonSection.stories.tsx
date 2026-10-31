import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { ComparisonModeProvider } from "../comparison-view/comparison-mode";
import { ComparisonControls } from "../comparison-view/ComparisonControls";
import { SnapshotComparisonSection } from "../SnapshotComparisonSection";

const meta: Meta<typeof SnapshotComparisonSection> = {
  title: "Web/SnapshotComparisonSection",
  component: SnapshotComparisonSection,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
  render: (args) => (
    <ComparisonModeProvider>
      <div className="flex flex-col lg:h-[720px]">
        {args.baseline ? <ComparisonControls /> : null}
        <SnapshotComparisonSection {...args} />
      </div>
    </ComparisonModeProvider>
  ),
};

export default meta;
type Story = StoryObj<typeof SnapshotComparisonSection>;

const newSnapshot = {
  id: "01970000-0000-7000-8000-000000000001",
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 720,
  viewportName: "desktop",
  targetId: "button--primary",
  targetName: "Primary",
  targetTitle: "Button",
  imagePath: "new-desktop.png",
  status: "unchanged" as const,
  errorMessage: null,
  hasUncaughtPageError: false,
  isFlaky: false,
  flags: [],
  isRebuildable: false,
  isReviewable: true,
  errorLogs: [],
  queuedMs: null,
  processingMs: null,
};

const mobileSnapshot = {
  ...newSnapshot,
  viewportWidth: 375,
  viewportHeight: 812,
  viewportName: "mobile",
  imagePath: "new-mobile.png",
};

const desktopBaseline = {
  imagePath: "baseline-desktop.png",
  commitSha: "abc1234567890",
  commitUrl: "https://github.com/acme/web/commit/abc1234567890",
};

const mobileBaseline = { ...desktopBaseline, imagePath: "baseline-mobile.png" };

export const NewOnly: Story = {
  args: {
    snapshot: newSnapshot,
    diff: null,
    baseline: null,
  },
};

export const SkippedWithBaseline: Story = {
  args: {
    snapshot: { ...newSnapshot, status: "skipped", imagePath: null },
    diff: null,
    baseline: desktopBaseline,
  },
};

export const NewWithBaseline: Story = {
  args: {
    snapshot: newSnapshot,
    diff: {
      id: "01970000-0000-7000-8000-000000000002",
      processingStatus: "success",
      reviewStatus: "not_required",
      diffImagePath: null,
      pixelDiffCount: 0,
      diffPercent: 0,
      baselineSnapshot: desktopBaseline,
    },
    baseline: desktopBaseline,
  },
};

export const NewWithBaselineAndDiff: Story = {
  args: {
    snapshot: newSnapshot,
    diff: {
      id: "01970000-0000-7000-8000-000000000003",
      processingStatus: "success",
      reviewStatus: "needs_review",
      diffImagePath: "diff-desktop.png",
      pixelDiffCount: 120,
      diffPercent: 0.4,
      baselineSnapshot: desktopBaseline,
    },
    baseline: desktopBaseline,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const diffImage = canvas.getByRole("img", {
      name: "diff overlay of snapshot of Button Primary",
    });

    await userEvent.click(canvas.getByRole("switch"));
    await expect(diffImage).toHaveStyle({ opacity: "0" });

    await userEvent.click(canvas.getByRole("switch"));
    await expect(diffImage).toHaveStyle({ opacity: "1" });
  },
};

export const SliderView: Story = {
  args: {
    snapshot: newSnapshot,
    diff: {
      id: "01970000-0000-7000-8000-000000000004",
      processingStatus: "success",
      reviewStatus: "needs_review",
      diffImagePath: "diff-desktop.png",
      pixelDiffCount: 120,
      diffPercent: 0.4,
      baselineSnapshot: desktopBaseline,
    },
    baseline: desktopBaseline,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Switching to slider view drops the diff toggle and shows a draggable handle.
    await userEvent.click(canvas.getByRole("tab", { name: "slider" }));

    const handle = canvas.getByRole("slider");
    await expect(handle).toBeVisible();
    await expect(canvas.queryByRole("switch")).not.toBeInTheDocument();

    // The handle is keyboard operable.
    const startPosition = Number(handle.getAttribute("aria-valuenow"));
    handle.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(Number(handle.getAttribute("aria-valuenow"))).toBeLessThan(startPosition);

    // Switching back restores the split view and its diff toggle.
    await userEvent.click(canvas.getByRole("tab", { name: "split" }));
    await expect(canvas.getByRole("switch")).toBeVisible();
  },
};

export const MobileWithBaselineAndDiff: Story = {
  args: {
    snapshot: mobileSnapshot,
    diff: {
      id: "01970000-0000-7000-8000-000000000005",
      processingStatus: "success",
      reviewStatus: "needs_review",
      diffImagePath: "diff-mobile.png",
      pixelDiffCount: 60_272,
      diffPercent: 11.5,
      baselineSnapshot: mobileBaseline,
    },
    baseline: mobileBaseline,
  },
};

export const DifferentSizes: Story = {
  parameters: { ovr: { viewports: ["desktop"] } },
  args: {
    snapshot: newSnapshot,
    diff: {
      id: "01970000-0000-7000-8000-000000000006",
      processingStatus: "success",
      reviewStatus: "needs_review",
      diffImagePath: null,
      pixelDiffCount: 0,
      diffPercent: 0,
      baselineSnapshot: mobileBaseline,
    },
    baseline: mobileBaseline,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const widthRatio = (baselineImage: HTMLElement, newImage: HTMLElement) =>
      baselineImage.getBoundingClientRect().width / newImage.getBoundingClientRect().width;

    const splitBaselineImage = await canvas.findByRole("img", {
      name: "baseline snapshot of Button Primary",
    });
    const splitNewImage = await canvas.findByRole("img", { name: "snapshot of Button Primary" });
    await waitFor(() =>
      expect(widthRatio(splitBaselineImage, splitNewImage)).toBeCloseTo(375 / 1280, 2),
    );

    await userEvent.click(canvas.getByRole("tab", { name: "slider" }));

    const sliderBaselineImage = await canvas.findByRole("img", {
      name: "baseline snapshot of Button Primary",
    });
    const sliderNewImage = await canvas.findByRole("img", { name: "snapshot of Button Primary" });
    await waitFor(() =>
      expect(widthRatio(sliderBaselineImage, sliderNewImage)).toBeCloseTo(375 / 1280, 2),
    );
    await expect(sliderBaselineImage.getBoundingClientRect().left).toBe(
      sliderNewImage.getBoundingClientRect().left,
    );
    await expect(sliderBaselineImage.getBoundingClientRect().top).toBe(
      sliderNewImage.getBoundingClientRect().top,
    );
  },
};
