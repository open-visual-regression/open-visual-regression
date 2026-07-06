import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { BuildsFilters } from "../BuildsFilters";

const PROJECT_ID = "018f0000-0000-7000-8000-000000000000";

const STATUS_OPTIONS = [
  { value: "needs_review" as const, label: "needs review" },
  { value: "passed" as const, label: "passed" },
  { value: "error" as const, label: "error" },
];

const BRANCH_OPTIONS = [
  { value: "main", label: "main" },
  { value: "develop", label: "develop" },
];

const AUTHOR_OPTIONS = [
  { value: "Jordan Lee", label: "Jordan Lee" },
  { value: "Alex Kim", label: "Alex Kim" },
];

const meta: Meta<typeof BuildsFilters> = {
  title: "Web/BuildsFilters",
  component: BuildsFilters,
  tags: ["autodocs"],
  args: {
    projectId: PROJECT_ID,
    statusOptions: STATUS_OPTIONS,
    branchOptions: BRANCH_OPTIONS,
    authorOptions: AUTHOR_OPTIONS,
  },
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
    statuses: [],
    branches: [],
    authors: [],
  },
};

export const WithActiveFilters: Story = {
  args: {
    statuses: ["needs_review", "error"],
    branches: ["main"],
    authors: ["Jordan Lee"],
  },
};

export const StatusPopoverOpen: Story = {
  args: {
    statuses: [],
    branches: [],
    authors: [],
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
    statuses: ["needs_review"],
    branches: [],
    authors: [],
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
    branches: [],
    authors: [],
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
