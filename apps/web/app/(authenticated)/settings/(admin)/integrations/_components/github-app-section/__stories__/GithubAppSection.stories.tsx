import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";

import { GithubAppSection } from "../GithubAppSection";

const meta: Meta<typeof GithubAppSection> = {
  title: "Web/GithubAppSection",
  component: GithubAppSection,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof GithubAppSection>;

export const Connected: Story = {
  args: {
    status: {
      status: "ok",
      app: mocks.githubApp.generateGithubApp(),
      installations: [
        mocks.githubApp.generateGithubAppInstallation(),
        mocks.githubApp.generateGithubAppInstallation({
          id: 43,
          accountLogin: "acme-labs",
          repositorySelection: "all",
          repositoryCount: 30,
          suspended: true,
        }),
      ],
    },
  },
};

export const NotInstalled: Story = {
  args: {
    status: { status: "ok", app: mocks.githubApp.generateGithubApp(), installations: [] },
  },
};

export const MissingStatusesPermission: Story = {
  args: {
    status: {
      status: "ok",
      app: mocks.githubApp.generateGithubApp({ permissions: { metadata: "read" } }),
      installations: [mocks.githubApp.generateGithubAppInstallation()],
    },
  },
};

export const NotConfigured: Story = {
  args: { status: { status: "not_configured" } },
};

export const Unreachable: Story = {
  args: {
    status: {
      status: "error",
      error:
        "github rejected the app's credentials, check OVR_GITHUB_APP_CLIENT_ID and OVR_GITHUB_APP_PRIVATE_KEY",
    },
  },
};
