import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { SnapshotFilters } from "../SnapshotFilters";

const meta: Meta<typeof SnapshotFilters> = {
  title: "Web/SnapshotFilters",
  component: SnapshotFilters,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects/mock-project/builds/mock-build" },
    },
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SnapshotFilters>;

export const Default: Story = {
  args: {
    statuses: [],
    browsers: [],
  },
};

export const WithActiveFilters: Story = {
  args: {
    statuses: ["needs_review", "error"],
    browsers: ["chromium"],
  },
};

export const StatusPopoverOpen: Story = {
  args: {
    statuses: [],
    browsers: [],
  },
  parameters: {
    ovr: {
      viewports: ["desktop"],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^status any$/i }));
  },
};

export const BrowserPopoverOpen: Story = {
  args: {
    statuses: [],
    browsers: [],
  },
  parameters: {
    ovr: {
      viewports: ["desktop"],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^browser any$/i }));
  },
};

export const MobileMenuOpen: Story = {
  args: {
    statuses: ["needs_review"],
    browsers: [],
  },
  parameters: {
    ovr: {
      viewports: ["mobile"],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /filters/i }));
  },
};

export const MobileFacetDialogOpen: Story = {
  args: {
    statuses: ["needs_review"],
    browsers: [],
  },
  parameters: {
    ovr: {
      viewports: ["mobile"],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /filters/i }));

    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("menuitem", { name: /^status$/i }));
    await body.findByRole("checkbox", { name: "needs review" });
  },
};
