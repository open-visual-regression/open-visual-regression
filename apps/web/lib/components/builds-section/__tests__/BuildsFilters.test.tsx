import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { type BuildStatus } from "@ovr/api/contracts/builds";

import { type FacetOption } from "@/lib/components/facet/FacetOptionsList";
import { orpc } from "@/lib/orpc/client";
import { describe, expect, it, render, screen } from "@/test-utils";

import { BuildsFilters } from "../BuildsFilters";

vi.mock("next/navigation");

const PROJECT_ID = "018f0000-0000-7000-8000-000000000000";

const mockPush = vi.mocked(useRouter)().push;

const STATUS_OPTIONS: FacetOption<BuildStatus>[] = [
  { value: "queued", label: "queued" },
  { value: "error", label: "error" },
];

const BRANCH_OPTIONS: FacetOption<string>[] = [
  { value: "main", label: "main" },
  { value: "develop", label: "develop" },
];

const AUTHOR_OPTIONS: FacetOption<string>[] = [
  { value: "Jordan Lee", label: "Jordan Lee" },
  { value: "Alex Kim", label: "Alex Kim" },
];

const COMMIT_SHA_OPTIONS: FacetOption<string>[] = [
  { value: "4f2a91e1234567890", label: "4f2a91e" },
  { value: "7c3b82f1234567890", label: "7c3b82f" },
];

const renderComponent = () =>
  render(
    <BuildsFilters
      projectId={PROJECT_ID}
      statuses={[]}
      branches={[]}
      authors={[]}
      commitShas={[]}
      statusOptions={STATUS_OPTIONS}
      branchOptions={BRANCH_OPTIONS}
      authorOptions={AUTHOR_OPTIONS}
      commitShaOptions={COMMIT_SHA_OPTIONS}
    />,
  );

describe("BuildsFilters", () => {
  it("should show 'any' as the value for every facet when no filter is applied", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: /^status\s+any$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^branch\s+any$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^author\s+any$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^commit\s+any$/i })).toBeVisible();
  });

  it("should navigate with the selected statuses when the status facet is applied", async ({
    user,
  }) => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /^status\s+any$/i }));
    await user.click(await screen.findByRole("checkbox", { name: "queued" }));
    await user.click(await screen.findByRole("checkbox", { name: "error" }));
    await user.click(screen.getByRole("button", { name: /^apply$/i }));

    expect(mockPush).toHaveBeenCalledWith("/?status=queued&status=error");
  });

  it("should search branches against the server when the branch facet is opened", async ({
    user,
  }) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    queryClient.setQueryData(
      orpc.builds.listBranches.queryKey({ input: { projectId: PROJECT_ID, search: undefined } }),
      { branches: ["main", "develop"] },
    );

    render(
      <BuildsFilters
        projectId={PROJECT_ID}
        statuses={[]}
        branches={[]}
        authors={[]}
        commitShas={[]}
        statusOptions={STATUS_OPTIONS}
        branchOptions={BRANCH_OPTIONS}
        authorOptions={AUTHOR_OPTIONS}
        commitShaOptions={COMMIT_SHA_OPTIONS}
      />,
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      },
    );

    await user.click(screen.getByRole("button", { name: /^branch\s+any$/i }));

    // The async facet always renders a search box, unlike the static status facet.
    expect(await screen.findByRole("textbox", { name: "search options" })).toBeVisible();
    expect(await screen.findByRole("checkbox", { name: "main" })).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "develop" })).toBeVisible();
  });

  it("should reflect the applied branch on the branch facet trigger", () => {
    render(
      <BuildsFilters
        projectId={PROJECT_ID}
        statuses={[]}
        branches={["main"]}
        authors={[]}
        commitShas={[]}
        statusOptions={STATUS_OPTIONS}
        branchOptions={BRANCH_OPTIONS}
        authorOptions={AUTHOR_OPTIONS}
        commitShaOptions={COMMIT_SHA_OPTIONS}
      />,
    );

    expect(screen.getByRole("button", { name: /^branch\s+main$/i })).toBeVisible();
  });

  it("should reflect the applied author on the author facet trigger", () => {
    render(
      <BuildsFilters
        projectId={PROJECT_ID}
        statuses={[]}
        branches={[]}
        authors={["Jordan Lee"]}
        commitShas={[]}
        statusOptions={STATUS_OPTIONS}
        branchOptions={BRANCH_OPTIONS}
        authorOptions={AUTHOR_OPTIONS}
        commitShaOptions={COMMIT_SHA_OPTIONS}
      />,
    );

    expect(screen.getByRole("button", { name: /^author\s+Jordan Lee$/i })).toBeVisible();
  });

  it("should reflect the applied commit on the commit facet trigger", () => {
    render(
      <BuildsFilters
        projectId={PROJECT_ID}
        statuses={[]}
        branches={[]}
        authors={[]}
        commitShas={["4f2a91e1234567890"]}
        statusOptions={STATUS_OPTIONS}
        branchOptions={BRANCH_OPTIONS}
        authorOptions={AUTHOR_OPTIONS}
        commitShaOptions={COMMIT_SHA_OPTIONS}
      />,
    );

    expect(screen.getByRole("button", { name: /^commit\s+4f2a91e$/i })).toBeVisible();
  });

  it("should mark the mobile filter menu button as active when a filter is applied", () => {
    render(
      <BuildsFilters
        projectId={PROJECT_ID}
        statuses={["queued"]}
        branches={[]}
        authors={[]}
        commitShas={[]}
        statusOptions={STATUS_OPTIONS}
        branchOptions={BRANCH_OPTIONS}
        authorOptions={AUTHOR_OPTIONS}
        commitShaOptions={COMMIT_SHA_OPTIONS}
      />,
    );

    expect(screen.getByRole("button", { name: "filters (active)" })).toBeVisible();
  });

  it("should not mark the mobile filter menu button as active when no filter is applied", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: "filters" })).toBeVisible();
  });

  it("should not render a facet that has one or zero options", () => {
    render(
      <BuildsFilters
        projectId={PROJECT_ID}
        statuses={[]}
        branches={[]}
        authors={[]}
        commitShas={[]}
        statusOptions={[{ value: "queued", label: "queued" }]}
        branchOptions={BRANCH_OPTIONS}
        authorOptions={[]}
        commitShaOptions={[]}
      />,
    );

    expect(screen.queryByRole("button", { name: /^status/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^author/i })).toBeNull();
    expect(screen.getByRole("button", { name: /^branch\s+any$/i })).toBeVisible();
  });

  it("should render nothing when no facet has more than one option", () => {
    render(
      <BuildsFilters
        projectId={PROJECT_ID}
        statuses={[]}
        branches={[]}
        authors={[]}
        commitShas={[]}
        statusOptions={[{ value: "queued", label: "queued" }]}
        branchOptions={[]}
        authorOptions={[]}
        commitShaOptions={[]}
      />,
    );

    expect(screen.queryByRole("button")).toBeNull();
  });
});
