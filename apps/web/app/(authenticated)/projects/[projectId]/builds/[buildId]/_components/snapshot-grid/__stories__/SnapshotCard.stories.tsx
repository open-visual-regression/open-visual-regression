import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { mocks } from "@ovr/mocks";

import { SnapshotCard } from "../SnapshotCard";

const meta: Meta<typeof SnapshotCard> = {
  title: "Web/SnapshotCard",
  component: SnapshotCard,
  tags: ["autodocs"],
  args: {
    projectId: "project-1",
    buildId: "build-1",
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects/project-1/builds/build-1" },
    },
    ovr: {
      viewports: ["desktop", "mobile"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-64 p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SnapshotCard>;

export const Default: Story = {
  args: {
    snapshot: mocks.build.generateBuildSnapshot({
      id: "snapshot-1",
      targetName: "Primary",
      targetTitle: "Button",
      imagePath: "new-desktop.png",
      status: "unchanged",
      browser: "chromium",
      viewportWidth: 1280,
      viewportName: "desktop",
    }),
  },
};

export const NeedsReview: Story = {
  args: {
    snapshot: mocks.build.generateBuildSnapshot({
      id: "snapshot-2",
      targetName: "Hero",
      targetTitle: "Banner",
      imagePath: "diff-desktop.png",
      status: "needs_review",
      browser: "firefox",
      viewportWidth: 375,
      viewportName: "mobile",
    }),
  },
};

export const NoPreview: Story = {
  args: {
    snapshot: mocks.build.generateBuildSnapshot({
      id: "snapshot-3",
      targetName: "Footer",
      targetTitle: "Layout",
      imagePath: "",
      status: "queued",
    }),
  },
};

export const Hovered: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("link"));
  },
};

export const FocusVisible: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole("link")).toHaveFocus();
  },
};
