import type { Meta, StoryObj } from "@storybook/nextjs-vite";

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
