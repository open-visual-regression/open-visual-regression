import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";

import { ProjectCardListItem } from "../ProjectCardListItem";

const meta: Meta<typeof ProjectCardListItem> = {
  title: "Web/ProjectCardListItem",
  component: ProjectCardListItem,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects" },
    },
    ovr: {
      viewports: ["desktop", "mobile"],
    },
  },
  decorators: [
    (Story) => (
      <ul className="w-80 p-6">
        <Story />
      </ul>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProjectCardListItem>;

export const Default: Story = {
  args: {
    project: mocks.project.generateProject({
      name: "storefront",
      description: "the main customer-facing storefront",
      gitMainBranch: "main",
    }),
  },
};

export const NoDescription: Story = {
  args: {
    project: mocks.project.generateProject({
      name: "internal-tools",
      description: null,
      gitMainBranch: "develop",
    }),
  },
};
