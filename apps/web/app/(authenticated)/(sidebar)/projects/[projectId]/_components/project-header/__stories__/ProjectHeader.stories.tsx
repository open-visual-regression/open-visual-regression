import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProjectHeader } from "../ProjectHeader";

const meta: Meta<typeof ProjectHeader> = {
  title: "Web/ProjectHeader",
  component: ProjectHeader,
  tags: ["autodocs"],
  args: {
    projectId: "019edfc7-e040-7492-86b2-ccfdc00cf6e1",
    role: "admin",
  },
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectHeader>;

export const LongProjectName: Story = {
  args: {
    projectName:
      "The Design System Component Library for the Marketing Website and Internal Admin Dashboard",
  },
};
