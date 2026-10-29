import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { userEvent, within } from "storybook/test";

import type { SearchGitRepositoriesOutputSchema } from "@ovr/api/contracts/gitProviders";
import { mocks } from "@ovr/mocks";

import { orpc } from "@/lib/orpc/client";
import { gitRepositoriesQueryOptions } from "@/lib/orpc/git-repositories-query";

import { GitIntegrationSection } from "../GitIntegrationSection";

const accessTokenOnly = mocks.gitProvider.generateProviderSummary({
  credentialTypes: ["access_token"],
});
const withConnections = mocks.gitProvider.generateProviderSummary();

const meta: Meta<typeof GitIntegrationSection> = {
  title: "Web/GitIntegrationSection",
  component: GitIntegrationSection,
  tags: ["autodocs"],
  args: {
    projectId: "00000000-0000-7000-8000-000000000000",
    providers: [accessTokenOnly],
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

export const NotConnectedWithConnections: Story = {
  args: {
    integration: null,
    providers: [withConnections],
  },
};

export const ConnectedThroughConnection: Story = {
  args: {
    integration: mocks.gitIntegration.generateGitIntegration({
      repoIdentifier: "acme/web",
      credentialType: "connection",
      connectionId: "42",
      externalRepoId: "7",
    }),
    providers: [withConnections],
  },
};

const seededRepositories = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const { input } = gitRepositoriesQueryOptions("github", "", true);
  const repositories: SearchGitRepositoriesOutputSchema = {
    status: "ok",
    repositories: [
      mocks.gitProvider.generateRepository({ id: "8", fullName: "acme/api" }),
      mocks.gitProvider.generateRepository({ id: "9", fullName: "acme/design-system" }),
      mocks.gitProvider.generateRepository({ id: "7", fullName: "acme/web" }),
    ],
    nextCursor: null,
  };
  queryClient.setQueryData(orpc.gitProviders.searchRepositories.queryKey({ input }), repositories);
  return queryClient;
};

export const OpenRepositoryPicker: Story = {
  args: NotConnectedWithConnections.args,
  decorators: [
    (Story) => (
      <QueryClientProvider client={seededRepositories()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: /repository/i }));
  },
};
