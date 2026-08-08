import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";

import { UpdateProjectForm } from "../UpdateProjectForm";

const meta: Meta<typeof UpdateProjectForm> = {
  title: "Web/UpdateProjectForm",
  component: UpdateProjectForm,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
  args: {
    project: mocks.project.generateProject({ name: "checkout-flow" }),
  },
};

export default meta;
type Story = StoryObj<typeof UpdateProjectForm>;

export const Default: Story = {};
