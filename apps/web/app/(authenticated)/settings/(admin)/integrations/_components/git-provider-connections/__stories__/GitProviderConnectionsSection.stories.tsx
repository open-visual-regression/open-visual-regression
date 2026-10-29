import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";

import { GitProviderConnectionsSection } from "../GitProviderConnectionsSection";

const meta: Meta<typeof GitProviderConnectionsSection> = {
  title: "Web/GitProviderConnectionsSection",
  component: GitProviderConnectionsSection,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof GitProviderConnectionsSection>;

const connected = mocks.gitProvider.generateProviderConnections();

export const Connected: Story = {
  args: {
    connections: {
      ...connected,
      status: {
        ...(connected.status as Extract<typeof connected.status, { status: "ok" }>),
        connections: [
          mocks.gitProvider.generateConnection(),
          mocks.gitProvider.generateConnection({
            id: "43",
            name: "acme-labs",
            repositoryCount: null,
            warnings: ["suspended"],
          }),
        ],
      },
    },
  },
};

export const NotConnected: Story = {
  args: {
    connections: {
      ...connected,
      status: {
        ...(connected.status as Extract<typeof connected.status, { status: "ok" }>),
        connections: [],
      },
    },
  },
};

export const WithWarning: Story = {
  args: {
    connections: {
      ...connected,
      status: {
        ...(connected.status as Extract<typeof connected.status, { status: "ok" }>),
        description: "owned by acme · commit statuses: no access",
        warnings: [
          "the app can't write commit statuses. grant \"commit statuses: read & write\" in the app's settings.",
        ],
      },
    },
  },
};

export const NotConfigured: Story = {
  args: {
    connections: mocks.gitProvider.generateProviderConnections({
      status: { status: "not_configured" },
    }),
  },
};

export const Unreachable: Story = {
  args: {
    connections: mocks.gitProvider.generateProviderConnections({
      status: {
        status: "error",
        error:
          "github rejected the app's credentials, check OVR_GITHUB_APP_CLIENT_ID and OVR_GITHUB_APP_PRIVATE_KEY",
      },
    }),
  },
};
