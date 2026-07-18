import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";

import { DeleteProjectSection } from "../DeleteProjectSection";

const meta: Meta<typeof DeleteProjectSection> = {
  title: "Web/DeleteProjectSection",
  component: DeleteProjectSection,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects/mock-project/settings" },
    },
    ovr: {
      viewports: ["desktop", "mobile"],
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
  args: {
    project: mocks.project.generateProject({ name: "checkout-flow" }),
  },
};

export default meta;
type Story = StoryObj<typeof DeleteProjectSection>;

export const Default: Story = {};
