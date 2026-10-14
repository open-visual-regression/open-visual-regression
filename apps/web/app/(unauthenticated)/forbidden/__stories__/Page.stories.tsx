import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import UnauthenticatedLayout from "../../layout";
import ForbiddenPage from "../page";

const meta: Meta<typeof ForbiddenPage> = {
  title: "Web/ForbiddenPage",
  component: ForbiddenPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
  decorators: [
    (Story) => (
      <UnauthenticatedLayout>
        <Story />
      </UnauthenticatedLayout>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ForbiddenPage>;

export const Default: Story = {};
