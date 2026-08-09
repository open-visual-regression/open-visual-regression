import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";

import { NavigationBarContent } from "../NavigationBarContent";

const PROJECTS = [
  mocks.project.generateProject({ name: "Acme Web" }),
  mocks.project.generateProject({ name: "Acme Marketing Site" }),
  mocks.project.generateProject({ name: "Acme Admin" }),
];

const BUILDS = [
  mocks.build.generateBuild({ project: PROJECTS[0], name: "Add empty state to projects table" }),
];

const meta: Meta<typeof NavigationBarContent> = {
  title: "Web/NavigationBar",
  component: NavigationBarContent,
  tags: ["autodocs"],
  args: {
    role: "admin",
    projects: PROJECTS,
    projectsTotal: PROJECTS.length,
    builds: BUILDS,
    segments: [{ label: "projects", href: "/projects" }, { label: "Acme Web" }],
    userName: "Jordan Lee",
  },
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects/acme-web" },
    },
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof NavigationBarContent>;

export const Default: Story = {};
