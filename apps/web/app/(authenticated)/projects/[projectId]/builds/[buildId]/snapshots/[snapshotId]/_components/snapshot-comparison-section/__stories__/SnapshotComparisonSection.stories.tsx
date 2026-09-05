import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

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
      {args.diff?.baselineSnapshot ? (
        <ComparisonControls hasDiff={args.diff.diffImagePath !== null} />
      ) : null}
      <SnapshotComparisonSection {...args} />
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
