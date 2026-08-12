import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { BuildSchema } from "@ovr/api/contracts/builds";
import { mocks } from "@ovr/mocks";

import { BuildsList } from "../BuildsList";

const PROJECT = { id: "018f0000-0000-7000-8000-000000000000", name: "Acme Web" };

const BUILD_STATUSES = [
  "unchanged",
  "auto_approved",
  "needs_review",
  "rejected",
  "error",
  "queued",
  "processing",
  "canceled",
] as const;

const buildOverrides: Partial<BuildSchema>[] = Array.from({ length: 24 }, (_, index) => ({
  project: PROJECT,
  name: `Build ${index + 1}: Update header layout with a much longer commit message that should truncate cleanly`,
  branch: `feature/this-is-a-really-long-branch-name-that-needs-to-truncate-${index}`,
  author: "Jordan Lee",
  createdAt: `2026-06-${String((index % 28) + 1).padStart(2, "0")}T12:00:00.000Z`,
  status: BUILD_STATUSES[index % BUILD_STATUSES.length],
}));

const BUILDS = buildOverrides.map((overrides) => mocks.build.generateBuild(overrides));

const meta: Meta<typeof BuildsList> = {
  title: "Web/BuildsList",
  component: BuildsList,
  tags: ["autodocs"],
  args: {
    isLoading: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    onLoadMore: () => {},
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: `/projects/${PROJECT.id}` },
    },
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
  decorators: [
    (Story) => (
      <div className="flex h-[600px] max-w-2xl flex-col py-3 px-5 md:py-4 md:px-6 lg:py-6 lg:px-10">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BuildsList>;

export const Default: Story = {
  args: {
    data: BUILDS,
  },
};
