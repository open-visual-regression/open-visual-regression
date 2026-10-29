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
    githubApp: { status: "not_configured" },
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

const githubApp = {
  status: "ok" as const,
  repositories: [
    mocks.githubApp.generateGithubAppRepository({ id: 8, fullName: "acme/api" }),
    mocks.githubApp.generateGithubAppRepository({ id: 7, fullName: "acme/web" }),
    mocks.githubApp.generateGithubAppRepository({ id: 9, fullName: "acme/design-system" }),
  ],
};

export const NotConnectedWithGithubApp: Story = {
  args: {
    integration: null,
    githubApp,
  },
};

export const ConnectedWithGithubApp: Story = {
  args: {
    integration: mocks.gitIntegration.generateGitIntegration({
      repoIdentifier: "acme/web",
      authType: "github_app",
      githubInstallationId: 42,
      externalRepoId: 7,
    }),
    githubApp,
  },
};

export const GithubAppRepositoriesUnavailable: Story = {
  args: {
    integration: null,
    githubApp: { status: "error", error: "github responded with 502" },
  },
};

export const OpenRepositoryPicker: Story = {
  args: NotConnectedWithGithubApp.args,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: /repository/i }));
  },
};

export const OpenDisableDialog: Story = {
  args: Connected.args,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /^disable$/i }));
  },
};
