import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SnapshotLogs } from "../SnapshotLogs";

const meta: Meta<typeof SnapshotLogs> = {
  title: "Web/SnapshotLogs",
  component: SnapshotLogs,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SnapshotLogs>;

export const Default: Story = {
  args: {
    logs: [
      {
        id: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
        level: "error",
        message: "TypeError: Cannot read properties of undefined (reading 'price')",
        timestamp: "2026-06-22T00:00:00.000Z",
      },
      {
        id: "019edfc7-e040-7492-86b2-ccfdc00cf6e3",
        level: "warn",
        message: "Retrying navigation after timeout",
        timestamp: "2026-06-22T00:00:01.000Z",
      },
      {
        id: "019edfc7-e040-7492-86b2-ccfdc00cf6e4",
        level: "info",
        message: "Captured snapshot after retry",
        timestamp: "2026-06-22T00:00:02.000Z",
      },
    ],
  },
};
