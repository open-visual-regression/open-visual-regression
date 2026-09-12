import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { screen, userEvent, within } from "storybook/test";

import { Icon, PlusIcon } from "@ovr/ui/components/icon";

import { CreateAccessTokenModal } from "../CreateAccessTokenModal";
import { CreateAccessTokenModalButton } from "../CreateAccessTokenModalButton";

const meta: Meta<typeof CreateAccessTokenModal> = {
  title: "Web/CreateAccessTokenModal",
  component: CreateAccessTokenModal,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop"],
    },
  },
  args: {
    trigger: (
      <CreateAccessTokenModalButton>
        <Icon icon={PlusIcon} />
        new access token
      </CreateAccessTokenModalButton>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof CreateAccessTokenModal>;

export const Form: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /new access token/i }));
  },
};

export const Reveal: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /new access token/i }));
    await userEvent.type(screen.getByLabelText(/name/i), "cursor");
    await userEvent.click(screen.getByRole("button", { name: /^create$/i }));
    await screen.findByRole("heading", { name: /access token created/i });
  },
};
