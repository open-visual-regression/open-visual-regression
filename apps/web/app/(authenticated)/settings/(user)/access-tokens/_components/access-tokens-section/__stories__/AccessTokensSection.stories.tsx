import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";

import { AccessTokensSection } from "../AccessTokensSection";

const meta: Meta<typeof AccessTokensSection> = {
  title: "Web/AccessTokensSection",
  component: AccessTokensSection,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof AccessTokensSection>;

export const Empty: Story = {
  args: {
    accessTokens: [],
  },
};

export const WithAccessTokens: Story = {
  args: {
    accessTokens: [
      mocks.accessToken.generateAccessToken({
        name: "cursor",
        createdAt: new Date("2026-05-01T09:00:00.000Z"),
        lastRequest: new Date("2026-08-01T14:30:00.000Z"),
      }),
      mocks.accessToken.generateAccessToken({
        name: "claude",
        createdAt: new Date("2026-06-15T16:45:00.000Z"),
        lastRequest: null,
      }),
    ],
  },
};
