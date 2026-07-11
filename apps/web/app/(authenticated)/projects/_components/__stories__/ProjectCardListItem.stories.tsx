import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

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

export const Hovered: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("link"));
  },
};

export const FocusVisible: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole("link")).toHaveFocus();
  },
};
