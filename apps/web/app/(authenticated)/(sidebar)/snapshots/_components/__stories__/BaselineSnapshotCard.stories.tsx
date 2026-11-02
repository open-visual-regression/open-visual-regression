import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";

import { BaselineSnapshotCard } from "../BaselineSnapshotCard";

const meta: Meta<typeof BaselineSnapshotCard> = {
  title: "Web/BaselineSnapshotCard",
  component: BaselineSnapshotCard,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/snapshots" },
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
type Story = StoryObj<typeof BaselineSnapshotCard>;

const PROJECT = { id: "project-1", name: "Acme Web" };

export const Default: Story = {
  args: {
    snapshot: mocks.build.generateProjectBaselineSnapshot({
      id: "snapshot-1",
      buildId: "build-1",
      project: PROJECT,
      targetName: "Primary",
      targetTitle: "Button",
      imagePath: "new-desktop.png",
    }),
  },
};

export const Flaky: Story = {
  args: {
    snapshot: mocks.build.generateProjectBaselineSnapshot({
      id: "snapshot-2",
      buildId: "build-1",
      project: PROJECT,
      targetName: "Animated",
      targetTitle: "Chart",
      imagePath: "new-desktop.png",
      flags: ["flaky"],
    }),
  },
};

export const WithWarning: Story = {
  args: {
    snapshot: mocks.build.generateProjectBaselineSnapshot({
      id: "snapshot-3",
      buildId: "build-1",
      project: PROJECT,
      targetName: "Primary",
      targetTitle: "Button",
      imagePath: "new-desktop.png",
      flags: ["warning"],
    }),
  },
};

export const NoPreview: Story = {
  args: {
    snapshot: mocks.build.generateProjectBaselineSnapshot({
      id: "snapshot-4",
      buildId: "build-1",
      project: PROJECT,
      targetName: "Footer",
      targetTitle: "Layout",
      imagePath: null,
      viewportName: "mobile",
      viewportWidth: 375,
    }),
  },
};
