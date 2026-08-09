import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";

import { NavigationBarContent } from "../NavigationBarContent";

const PROJECTS = [
  mocks.project.generateProject({
    name: "Acme Web",
    description: "visual regression coverage for the marketing site rebuild.",
    creator: {
      id: "b53f5b3e-9b1d-4b8a-8b3e-000000000001",
      name: "Jordan Lee",
      email: "jordan@acme.test",
    },
    createdAt: "2026-05-01T09:00:00.000Z",
  }),
  mocks.project.generateProject({
    name: "Acme Marketing Site",
    description: "visual regression coverage for the marketing site.",
    creator: {
      id: "b53f5b3e-9b1d-4b8a-8b3e-000000000002",
      name: "Jordan Lee",
      email: "jordan@acme.test",
    },
    createdAt: "2026-04-15T09:00:00.000Z",
  }),
  mocks.project.generateProject({
    name: "Acme Admin",
    description: "visual regression coverage for the internal admin dashboard.",
    creator: {
      id: "b53f5b3e-9b1d-4b8a-8b3e-000000000003",
      name: "Jordan Lee",
      email: "jordan@acme.test",
    },
    createdAt: "2026-03-20T09:00:00.000Z",
  }),
];

const BUILDS = [
  mocks.build.generateBuild({
    project: PROJECTS[0],
    branch: "main",
    name: "Add empty state to projects table",
    status: "unchanged",
  }),
];

const meta: Meta<typeof NavigationBarContent> = {
  title: "Web/NavigationBarContent",
  component: NavigationBarContent,
  tags: ["autodocs"],
  args: {
    role: "admin",
    projects: PROJECTS,
    projectsTotal: PROJECTS.length,
    builds: BUILDS,
    segments: [
      { label: "projects", href: "/projects" },
      { label: "Marketing Website Redesign and Component Library Overhaul" },
    ],
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
