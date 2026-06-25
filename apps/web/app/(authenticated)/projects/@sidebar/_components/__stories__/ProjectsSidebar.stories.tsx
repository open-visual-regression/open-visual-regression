import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { BuildSchema } from "@ovr/api/contracts/builds";
import { mocks } from "@ovr/mocks";
import { ProjectsSidebar } from "../ProjectsSidebar";

const PROJECTS = [
  mocks.project.generateProject({ name: "Acme Web" }),
  mocks.project.generateProject({ name: "Acme Marketing Site" }),
  mocks.project.generateProject({ name: "Acme Admin" }),
];

const BUILD_STATUSES = [
  "passed",
  "needs_review",
  "rejected",
  "error",
  "queued",
  "processing",
] as const;

const buildOverrides: Partial<BuildSchema>[] = Array.from({ length: 20 }, (_, index) => ({
  project: { id: PROJECTS[0]!.id, name: PROJECTS[0]!.name },
  name: `Build ${index + 1}: Update header layout`,
  commitSha: `${index.toString(16).padStart(2, "0")}b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0`,
  author: "Jordan Lee",
  createdAt: `2026-06-${String((index % 28) + 1).padStart(2, "0")}T12:00:00.000Z`,
  status: BUILD_STATUSES[index % BUILD_STATUSES.length],
}));

const BUILDS = buildOverrides.map((overrides) => mocks.build.generateBuild(overrides));

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
    builds: BUILDS,
  },
};

export const NoRecentBuilds: Story = {
  args: {
    projects: PROJECTS,
    total: PROJECTS.length,
    builds: [],
  },
};
