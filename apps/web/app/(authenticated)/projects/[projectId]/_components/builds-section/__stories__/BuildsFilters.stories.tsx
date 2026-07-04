import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { BuildsFilters } from "../BuildsFilters";

const BRANCH_OPTIONS = ["main", "develop", "feature/onboarding"];
const AUTHOR_OPTIONS = ["Jordan Lee", "Alex Kim", "Sam Patel"];

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
    statuses: [],
    branches: [],
    authors: [],
    branchOptions: BRANCH_OPTIONS,
    authorOptions: AUTHOR_OPTIONS,
  },
};

export const WithActiveFilters: Story = {
  args: {
    statuses: ["needs_review", "error"],
    branches: ["main"],
    authors: ["Jordan Lee"],
    branchOptions: BRANCH_OPTIONS,
    authorOptions: AUTHOR_OPTIONS,
  },
};

export const StatusPopoverOpen: Story = {
  args: {
    statuses: [],
    branches: [],
    authors: [],
    branchOptions: BRANCH_OPTIONS,
    authorOptions: AUTHOR_OPTIONS,
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
    branchOptions: BRANCH_OPTIONS,
    authorOptions: AUTHOR_OPTIONS,
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
    branchOptions: BRANCH_OPTIONS,
    authorOptions: AUTHOR_OPTIONS,
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
