import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { CardContent, CardHeader } from "@ovr/ui/components/card";
import { FolderIcon, Icon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { CardLink } from "../CardLink";

const meta: Meta<typeof CardLink> = {
  title: "Web/CardLink",
  component: CardLink,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CardLink>;

export const Default: Story = {
  render: () => (
    <div className="w-72 p-6">
      <CardLink href="#">
        <CardHeader>
          <Typography variant="h3" className="flex flex-row gap-3 items-center">
            <Icon icon={FolderIcon} />
            storefront
          </Typography>
        </CardHeader>
        <CardContent>
          <Typography variant="body-muted">a card rendered as a link</Typography>
        </CardContent>
      </CardLink>
    </div>
  ),
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
