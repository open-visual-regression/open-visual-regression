import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";

import { SnapshotHistoryCard } from "../SnapshotHistoryCard";

const meta: Meta<typeof SnapshotHistoryCard> = {
  title: "Web/SnapshotHistoryCard",
  component: SnapshotHistoryCard,
  tags: ["autodocs"],
  args: {
    projectId: "project-1",
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects/project-1/builds/build-1/snapshots/snapshot-1" },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-120 p-3">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SnapshotHistoryCard>;

const entry = (overrides: Parameters<typeof mocks.build.generateSnapshotHistoryEntry>[0]) =>
  mocks.build.generateSnapshotHistoryEntry({
    id: "snapshot-1",
    buildId: "build-1",
    buildName: "Add checkout page",
    commitSha: "a1b2c3d4e5f6".padEnd(40, "0"),
    createdAt: "2026-06-22T00:00:00.000Z",
    imagePath: "new-desktop.png",
    status: "unchanged",
    ...overrides,
  });

export const Default: Story = {
  args: { entry: entry({}) },
};

export const Current: Story = {
  args: { entry: entry({ status: "needs_review", imagePath: "diff-desktop.png" }), current: true },
};

export const WithWarning: Story = {
  args: { entry: entry({ flags: ["warning"] }) },
};

export const WithoutBuildName: Story = {
  args: { entry: entry({ buildName: null }) },
};

export const NoPreview: Story = {
  args: { entry: entry({ imagePath: null, status: "error" }) },
};
