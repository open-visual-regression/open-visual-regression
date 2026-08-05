import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { userEvent, within } from "storybook/test";

import { orpc } from "@/lib/orpc/client";

import { BuildsFilters } from "../BuildsFilters";

const PROJECT_ID = "018f0000-0000-7000-8000-000000000000";

const STATUS_OPTIONS = [
  { value: "needs_review" as const, label: "needs review" },
  { value: "unchanged" as const, label: "unchanged" },
  { value: "auto_approved" as const, label: "auto approved" },
  { value: "error" as const, label: "error" },
];

const BRANCH_OPTIONS = [
  { value: "main", label: "main" },
  { value: "develop", label: "develop" },
];

// Long branch names, with and without spaces, that should truncate rather than
// overflow the facet popover/dialog.
const LONG_BRANCH_OPTIONS = [
  { value: "main", label: "main" },
  { value: "develop", label: "develop" },
  {
    value: "feature/this-is-an-extremely-long-branch-name-that-should-still-truncate-cleanly",
    label: "feature/this-is-an-extremely-long-branch-name-that-should-still-truncate-cleanly",
  },
  {
    value: "a really long branch name with plenty of spaces that also needs to truncate",
    label: "a really long branch name with plenty of spaces that also needs to truncate",
  },
];

const seedLongBranches = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData(
    orpc.builds.listBranches.queryKey({ input: { projectId: PROJECT_ID, search: undefined } }),
    { branches: LONG_BRANCH_OPTIONS.map((option) => option.value) },
  );
  return queryClient;
};

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

export const BranchPopoverOpen: Story = {
  args: {
    statuses: [],
    branches: [],
    authors: [],
    branchOptions: LONG_BRANCH_OPTIONS,
  },
  parameters: {
    ovr: {
      viewports: ["desktop"],
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={seedLongBranches()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^branch\s+any$/i }));

    const body = within(canvasElement.ownerDocument.body);
    await body.findByRole("checkbox", {
      name: "a really long branch name with plenty of spaces that also needs to truncate",
    });
  },
};

export const MobileBranchFacetDialogOpen: Story = {
  args: {
    statuses: [],
    branches: [],
    authors: [],
    branchOptions: LONG_BRANCH_OPTIONS,
  },
  parameters: {
    ovr: {
      viewports: ["mobile", "tablet"],
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={seedLongBranches()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /filters/i }));

    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("menuitem", { name: /^branch$/i }));
    await body.findByRole("checkbox", {
      name: "a really long branch name with plenty of spaces that also needs to truncate",
    });
  },
};
