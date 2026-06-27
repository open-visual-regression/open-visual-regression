import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import type { BuildSchema } from "@ovr/api/contracts/builds";
import { mocks } from "@ovr/mocks";
import { NavigationBarMobileMenu } from "../NavigationBarMobileMenu";

const PROJECTS = [
  mocks.project.generateProject({ name: "Acme Web" }),
  mocks.project.generateProject({ name: "Acme Marketing Site" }),
  mocks.project.generateProject({ name: "Acme Admin" }),
];

const buildOverrides: Partial<BuildSchema>[] = [
  {
    project: PROJECTS[0],
    name: "Add empty state to projects table",
    commitSha: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    author: "Jordan Lee",
    createdAt: "2026-06-20T12:00:00.000Z",
    processingStatus: "success",
    reviewStatus: "not_required",
  },
  {
    project: PROJECTS[1],
    name: "Update header layout",
    commitSha: "b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0",
    author: "Jordan Lee",
    createdAt: "2026-06-19T12:00:00.000Z",
    processingStatus: "success",
    reviewStatus: "needs_review",
  },
];

const BUILDS = buildOverrides.map((overrides) => mocks.build.generateBuild(overrides));

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
    builds: BUILDS,
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
    builds: BUILDS,
    projectsTotal: 12,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /open projects navigation/i }));
  },
};
