import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { BuildsFilters } from "../BuildsFilters";

const VIEWPORT_OPTIONS = [
  { viewportWidth: 1280, viewportHeight: 800 },
  { viewportWidth: 768, viewportHeight: 1024 },
  { viewportWidth: 375, viewportHeight: 812 },
];

const meta: Meta<typeof BuildsFilters> = {
  title: "Web/BuildsFilters",
  component: BuildsFilters,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects/mock-project" },
    },
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof BuildsFilters>;

export const Default: Story = {
  args: {
    status: [],
    browser: [],
    viewport: [],
    viewportOptions: VIEWPORT_OPTIONS,
  },
};

export const WithActiveFilters: Story = {
  args: {
    status: ["needs_review", "error"],
    browser: ["chromium"],
    viewport: ["375x812"],
    viewportOptions: VIEWPORT_OPTIONS,
  },
};

export const StatusPopoverOpen: Story = {
  args: {
    status: [],
    browser: [],
    viewport: [],
    viewportOptions: VIEWPORT_OPTIONS,
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

export const MobileMenuOpen: Story = {
  args: {
    status: ["needs_review"],
    browser: [],
    viewport: [],
    viewportOptions: VIEWPORT_OPTIONS,
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
    status: ["needs_review"],
    browser: [],
    viewport: [],
    viewportOptions: VIEWPORT_OPTIONS,
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
