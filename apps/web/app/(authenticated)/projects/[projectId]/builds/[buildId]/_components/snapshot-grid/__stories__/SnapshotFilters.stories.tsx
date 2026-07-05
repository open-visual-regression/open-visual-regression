import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { SnapshotFilters } from "../SnapshotFilters";

const VIEWPORT_OPTIONS = [
  { value: "1280x800", label: "desktop" },
  { value: "375xauto", label: "mobile" },
];

const meta: Meta<typeof SnapshotFilters> = {
  title: "Web/SnapshotFilters",
  component: SnapshotFilters,
  tags: ["autodocs"],
  args: {
    viewportOptions: VIEWPORT_OPTIONS,
  },
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
    viewports: [],
  },
};

export const WithActiveFilters: Story = {
  args: {
    statuses: ["needs_review", "error"],
    browsers: ["chromium"],
    viewports: ["1280x800"],
  },
};

export const StatusPopoverOpen: Story = {
  args: {
    statuses: [],
    browsers: [],
    viewports: [],
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
    viewports: [],
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

export const ViewportPopoverOpen: Story = {
  args: {
    statuses: [],
    browsers: [],
    viewports: [],
  },
  parameters: {
    ovr: {
      viewports: ["desktop"],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^viewport any$/i }));
  },
};

export const MobileMenuOpen: Story = {
  args: {
    statuses: ["needs_review"],
    browsers: [],
    viewports: [],
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
    viewports: [],
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
