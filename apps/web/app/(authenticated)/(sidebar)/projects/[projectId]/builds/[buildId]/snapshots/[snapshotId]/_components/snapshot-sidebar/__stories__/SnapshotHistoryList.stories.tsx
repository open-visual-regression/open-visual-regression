import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";

import { SnapshotHistoryList } from "../SnapshotHistoryList";

const meta: Meta<typeof SnapshotHistoryList> = {
  title: "Web/SnapshotHistoryList",
  component: SnapshotHistoryList,
  tags: ["autodocs"],
  args: {
    branch: "main",
    projectId: "project-1",
    snapshotId: "snapshot-2",
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects/project-1/builds/build-2/snapshots/snapshot-2" },
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
type Story = StoryObj<typeof SnapshotHistoryList>;

export const Default: Story = {
  args: {
    entries: [
      mocks.build.generateSnapshotHistoryEntry({
        id: "snapshot-3",
        buildId: "build-3",
        buildName: "Fix header spacing",
        commitSha: "c3d4e5f6a1b2".padEnd(40, "0"),
        createdAt: "2026-06-24T00:00:00.000Z",
        imagePath: "new-desktop.png",
        status: "unchanged",
      }),
      mocks.build.generateSnapshotHistoryEntry({
        id: "snapshot-2",
        buildId: "build-2",
        buildName: "Add checkout page",
        commitSha: "b2c3d4e5f6a1".padEnd(40, "0"),
        createdAt: "2026-06-23T00:00:00.000Z",
        imagePath: "diff-desktop.png",
        status: "needs_review",
        flags: ["warning"],
      }),
      mocks.build.generateSnapshotHistoryEntry({
        id: "snapshot-1",
        buildId: "build-1",
        buildName: "Update button colors",
        commitSha: "a1b2c3d4e5f6".padEnd(40, "0"),
        createdAt: "2026-06-22T00:00:00.000Z",
        imagePath: "baseline-desktop.png",
        status: "approved",
      }),
    ],
  },
};

export const Empty: Story = {
  args: { entries: [] },
};
