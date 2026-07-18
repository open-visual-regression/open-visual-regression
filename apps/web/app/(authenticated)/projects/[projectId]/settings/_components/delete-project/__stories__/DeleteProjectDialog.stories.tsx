import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { screen, userEvent, within } from "storybook/test";

import { mocks } from "@ovr/mocks";

import { DeleteProjectDialog } from "../DeleteProjectDialog";

const meta: Meta<typeof DeleteProjectDialog> = {
  title: "Web/DeleteProjectDialog",
  component: DeleteProjectDialog,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects/mock-project/settings" },
    },
    ovr: {
      viewports: ["desktop"],
    },
  },
  args: {
    project: mocks.project.generateProject({ name: "checkout-flow" }),
  },
};

export default meta;
type Story = StoryObj<typeof DeleteProjectDialog>;

export const Open: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /^delete project$/i }));
  },
};

export const NameEntered: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /^delete project$/i }));
    await userEvent.type(
      await screen.findByLabelText(/type checkout-flow to confirm/i),
      "checkout-flow",
    );
  },
};
