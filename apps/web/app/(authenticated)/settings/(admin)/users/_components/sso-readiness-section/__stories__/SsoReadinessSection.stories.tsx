import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SsoReadinessSection } from "../SsoReadinessSection";

const meta: Meta<typeof SsoReadinessSection> = {
  title: "Web/SsoReadinessSection",
  component: SsoReadinessSection,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SsoReadinessSection>;

const lastSeenAt = "2026-10-02T12:00:00.000Z";

export const Default: Story = {
  args: {
    rows: [
      {
        identity: { id: "i1", email: "ada@example.com", name: "Ada", role: "admin", lastSeenAt },
        user: { id: "u1", name: "Ada", email: "ada@example.com", role: "admin" },
        match: "confirmed",
      },
      {
        identity: { id: "i2", email: "ben@example.com", name: "Ben", role: "reviewer", lastSeenAt },
        user: { id: "u2", name: "Ben", email: "ben@example.com", role: "reviewer" },
        match: "email",
      },
      {
        identity: { id: "i3", email: "cy@example.com", name: "Cy", role: "viewer", lastSeenAt },
        user: { id: "u3", name: "Cy", email: "cy@example.com", role: "reviewer" },
        match: "confirmed",
      },
      {
        identity: { id: "i4", email: "dee@example.com", name: "Dee", role: null, lastSeenAt },
        user: { id: "u4", name: "Dee", email: "dee@example.com", role: "reviewer" },
        match: "confirmed",
      },
      {
        identity: { id: "i5", email: "eve@example.com", name: "Eve", role: "viewer", lastSeenAt },
        user: null,
        match: "none",
      },
      {
        identity: null,
        user: { id: "u6", name: "Fay", email: "fay.alias@example.com", role: "reviewer" },
        match: "none",
      },
    ],
  },
};

export const Empty: Story = {
  args: { rows: [] },
};
