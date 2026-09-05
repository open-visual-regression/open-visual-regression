import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { ScrollContainer } from "@/lib/providers/ScrollContainer";

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
  // Stands in for the snapshot page shell: a scroll region of a fixed height
  // that the comparison has to fit into.
  render: (args) => (
    <ComparisonModeProvider>
      <ScrollContainer
        data-testid="scroll-region"
        className="flex h-[600px] flex-col gap-6 overflow-y-auto p-4"
      >
        {args.diff?.baselineSnapshot ? (
          <ComparisonControls hasDiff={args.diff.diffImagePath !== null} />
        ) : null}
        <SnapshotComparisonSection {...args} />
      </ScrollContainer>
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
  errorLogs: [],
};

const mobileSnapshot = {
  ...newSnapshot,
  viewportWidth: 375,
  viewportHeight: 812,
  viewportName: "mobile",
  imagePath: "new-mobile.png",
};

export const NewOnly: Story = {
  args: {
    snapshot: newSnapshot,
    diff: null,
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
      baselineSnapshot: {
        imagePath: "baseline-desktop.png",
        commitSha: "abc1234567890",
        commitUrl: "https://github.com/acme/web/commit/abc1234567890",
      },
    },
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
      baselineSnapshot: {
        imagePath: "baseline-desktop.png",
        commitSha: "abc1234567890",
        commitUrl: "https://github.com/acme/web/commit/abc1234567890",
      },
    },
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
      baselineSnapshot: {
        imagePath: "baseline-desktop.png",
        commitSha: "abc1234567890",
        commitUrl: "https://github.com/acme/web/commit/abc1234567890",
      },
    },
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

// A mobile snapshot is far taller than it is wide, so rendering it at the width
// of its pane would run it several screens down the page.
export const TallSnapshots: Story = {
  args: {
    snapshot: mobileSnapshot,
    diff: {
      id: "01970000-0000-7000-8000-000000000005",
      processingStatus: "success",
      reviewStatus: "needs_review",
      diffImagePath: "diff-mobile.png",
      pixelDiffCount: 60_272,
      diffPercent: 11.5,
      baselineSnapshot: {
        imagePath: "baseline-mobile.png",
        commitSha: "abc1234567890",
        commitUrl: "https://github.com/acme/web/commit/abc1234567890",
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Snapshots are only fitted from `lg` up, where there is width to trade.
    if (window.innerWidth < 1024) {
      return;
    }

    const canvas = within(canvasElement);
    const scrollRegion = canvas.getByTestId("scroll-region");

    // Both snapshots fit in what is left of the scroll region, at the same
    // scale, rather than running off the bottom of it.
    const baseline = await canvas.findByRole("img", {
      name: "baseline snapshot of Button Primary",
    });
    await waitFor(() => {
      const image = baseline.getBoundingClientRect();
      expect(image.height).toBeGreaterThan(0);
      expect(image.bottom).toBeLessThanOrEqual(scrollRegion.getBoundingClientRect().bottom);
    });

    const newSnapshotImage = await canvas.findByRole("img", {
      name: "snapshot of Button Primary",
    });
    expect(newSnapshotImage.getBoundingClientRect().width).toBeCloseTo(
      baseline.getBoundingClientRect().width,
      0,
    );

    // The slider view fits the same way.
    await userEvent.click(canvas.getByRole("tab", { name: "slider" }));

    const sliderBaseline = await canvas.findByRole("img", {
      name: "baseline snapshot of Button Primary",
    });
    await waitFor(() => {
      const image = sliderBaseline.getBoundingClientRect();
      expect(image.height).toBeGreaterThan(0);
      expect(image.bottom).toBeLessThanOrEqual(scrollRegion.getBoundingClientRect().bottom);
    });
  },
};
