import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { mocks } from "@ovr/mocks";
import { NavigationBarMobileMenu } from "../NavigationBarMobileMenu";

const PROJECTS = [
  mocks.project.generateProject({ name: "Acme Web" }),
  mocks.project.generateProject({ name: "Acme Marketing Site" }),
  mocks.project.generateProject({ name: "Acme Admin" }),
];

const meta: Meta<typeof NavigationBarMobileMenu> = {
  title: "Web/NavigationBarMobileMenu",
  component: NavigationBarMobileMenu,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects" },
    },
    ovr: {
      viewports: ["mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof NavigationBarMobileMenu>;

export const Projects: Story = {
  args: {
    role: "user",
    projects: PROJECTS,
    projectsTotal: PROJECTS.length,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /open projects navigation/i }));
  },
};

export const WithViewAllLink: Story = {
  args: {
    role: "user",
    projects: PROJECTS,
    projectsTotal: 12,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /open projects navigation/i }));
  },
};
