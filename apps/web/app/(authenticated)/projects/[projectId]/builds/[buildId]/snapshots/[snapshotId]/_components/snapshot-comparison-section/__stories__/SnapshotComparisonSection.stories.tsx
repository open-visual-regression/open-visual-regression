import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

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
};

export default meta;
type Story = StoryObj<typeof SnapshotComparisonSection>;

const newSnapshot = {
  id: "01970000-0000-7000-8000-000000000001",
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 720,
  targetName: "Primary",
  targetTitle: "Button",
  imagePath: "new-desktop.png",
  status: "pass" as const,
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
      processingStatus: "diffed",
      reviewStatus: "not_required",
      diffImagePath: null,
      pixelDiffCount: 0,
      diffPercent: 0,
      baselineSnapshot: { imagePath: "baseline-desktop.png" },
    },
  },
};

export const NewWithBaselineAndDiff: Story = {
  args: {
    snapshot: newSnapshot,
    diff: {
      id: "01970000-0000-7000-8000-000000000003",
      processingStatus: "diffed",
      reviewStatus: "needs_review",
      diffImagePath: "diff-desktop.png",
      pixelDiffCount: 120,
      diffPercent: 0.4,
      baselineSnapshot: { imagePath: "baseline-desktop.png" },
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
