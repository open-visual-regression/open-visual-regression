import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";

import { UpdateOrganizationForm } from "../UpdateOrganizationForm";

const meta: Meta<typeof UpdateOrganizationForm> = {
  title: "Web/UpdateOrganizationForm",
  component: UpdateOrganizationForm,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
  args: {
    organization: mocks.organization.generateOrganization({ name: "Open Visual Regression" }),
  },
};

export default meta;
type Story = StoryObj<typeof UpdateOrganizationForm>;

export const Default: Story = {};
