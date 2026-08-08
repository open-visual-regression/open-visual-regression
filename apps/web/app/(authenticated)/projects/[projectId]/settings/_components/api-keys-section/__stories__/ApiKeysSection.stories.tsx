import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";

import { ApiKeysSection } from "../ApiKeysSection";

const meta: Meta<typeof ApiKeysSection> = {
  title: "Web/ApiKeysSection",
  component: ApiKeysSection,
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
type Story = StoryObj<typeof ApiKeysSection>;

export const Empty: Story = {
  args: {
    apiKeys: [],
  },
};

export const WithApiKeys: Story = {
  args: {
    apiKeys: [
      mocks.apiKey.generateApiKey({ name: "ci", lastRequest: new Date() }),
      mocks.apiKey.generateApiKey({ name: "local dev", lastRequest: null }),
    ],
  },
};
