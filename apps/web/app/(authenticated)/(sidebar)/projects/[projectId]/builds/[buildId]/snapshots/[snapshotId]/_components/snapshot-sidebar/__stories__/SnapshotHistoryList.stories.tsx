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
    snapshotId: "snapshot-4",
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects/project-1/builds/build-4/snapshots/snapshot-4" },
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

const entry = (
  index: number,
  overrides: Parameters<typeof mocks.build.generateSnapshotHistoryEntry>[0],
) =>
  mocks.build.generateSnapshotHistoryEntry({
    id: `snapshot-${index}`,
    buildId: `build-${index}`,
    commitSha: `${index}a1b2c3d4e5f`.padEnd(40, "0"),
    createdAt: `2026-06-${String(20 + index).padStart(2, "0")}T00:00:00.000Z`,
    imagePath: "new-desktop.png",
    status: "unchanged",
    ...overrides,
  });

export const Default: Story = {
  args: {
    entries: [
      entry(5, { buildName: "Fix header spacing" }),
      entry(4, {
        buildName: "Add checkout page",
        imagePath: "diff-desktop.png",
        status: "needs_review",
      }),
      entry(3, { buildName: "Add analytics script", status: "auto_approved", flags: ["warning"] }),
      entry(2, { buildName: null, imagePath: "baseline-desktop.png", status: "approved" }),
      entry(1, { buildName: "Update button colors", imagePath: null, status: "error" }),
    ],
  },
};

export const Empty: Story = {
  args: { entries: [] },
};
