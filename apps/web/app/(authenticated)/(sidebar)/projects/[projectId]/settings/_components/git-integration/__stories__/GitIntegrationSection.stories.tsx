import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { mocks } from "@ovr/mocks";

import { GitIntegrationSection } from "../GitIntegrationSection";

const meta: Meta<typeof GitIntegrationSection> = {
  title: "Web/GitIntegrationSection",
  component: GitIntegrationSection,
  tags: ["autodocs"],
  args: {
    projectId: "00000000-0000-7000-8000-000000000000",
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects/mock-project/settings" },
    },
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof GitIntegrationSection>;

export const NotConnected: Story = {
  args: {
    integration: null,
  },
};

export const Connected: Story = {
  args: {
    integration: mocks.gitIntegration.generateGitIntegration({
      repoIdentifier: "acme/web",
    }),
  },
};

export const ChecksDisabled: Story = {
  args: {
    integration: mocks.gitIntegration.generateGitIntegration({
      repoIdentifier: "acme/web",
      statusChecksEnabled: false,
    }),
  },
};

export const OpenDisableDialog: Story = {
  args: Connected.args,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /^disable$/i }));
  },
};
