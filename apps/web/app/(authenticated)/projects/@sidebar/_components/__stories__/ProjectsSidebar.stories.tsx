import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";
import { ProjectsSidebar } from "../ProjectsSidebar";

const PROJECTS = [
  mocks.project.generateProject({ name: "Acme Web" }),
  mocks.project.generateProject({ name: "Acme Marketing Site" }),
  mocks.project.generateProject({ name: "Acme Admin" }),
];

const meta: Meta<typeof ProjectsSidebar> = {
  title: "Web/ProjectsSidebar",
  component: ProjectsSidebar,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: `/projects/${PROJECTS[0]!.id}` },
    },
    ovr: {
      viewports: ["desktop"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectsSidebar>;

export const Default: Story = {
  args: {
    projects: PROJECTS,
    total: PROJECTS.length,
  },
};

export const WithViewAllLink: Story = {
  args: {
    projects: PROJECTS,
    total: 12,
  },
};
