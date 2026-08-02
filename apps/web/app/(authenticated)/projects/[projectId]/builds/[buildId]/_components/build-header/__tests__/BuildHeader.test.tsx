import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { describe, expect, it, render, screen } from "@/test-utils";

import { BuildHeader, type BuildHeaderProps } from "../BuildHeader";

vi.mock("next/navigation");

const renderComponent = ({
  build = mocks.build.generateBuild(),
  storybookHref = null,
  snapshotCounts = {
    unchanged: 3,
    auto_approved: 0,
    approved: 0,
    needs_review: 2,
    rejected: 0,
    error: 1,
    canceled: 0,
    queued: 4,
    processing: 0,
  },
}: Partial<BuildHeaderProps> = {}) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <BuildHeader build={build} snapshotCounts={snapshotCounts} storybookHref={storybookHref} />
    </QueryClientProvider>,
  );
};

describe("BuildHeader", () => {
  it("should render the SegmentedProgress segments with the correct counts", () => {
    renderComponent({ build: mocks.build.generateBuild({ status: "needs_review" }) });

    expect(screen.getByText("10 snapshots")).toBeVisible();
    expect(screen.getByRole("listitem", { name: "3 unchanged" })).toBeVisible();
    expect(screen.getByRole("listitem", { name: "2 needs review" })).toBeVisible();
    expect(screen.getByRole("listitem", { name: "1 error" })).toBeVisible();
    expect(screen.getByRole("listitem", { name: "4 queued" })).toBeVisible();
  });

  it("should show the error alert when the build has an error message", () => {
    renderComponent({
      build: mocks.build.generateBuild({
        status: "error",
        errorMessage: "Build failed: unable to connect to the test runner.",
      }),
      snapshotCounts: {
        unchanged: 0,
        auto_approved: 0,
        approved: 0,
        needs_review: 0,
        rejected: 0,
        error: 0,
        canceled: 0,
        queued: 0,
        processing: 0,
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Build failed: unable to connect to the test runner.",
    );
  });

  it("should not show the error alert when the build has no error message", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "needs_review", errorMessage: null }),
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should show who canceled the build", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "canceled", canceledBy: "Jordan Lee" }),
    });

    expect(screen.getByText(/canceled by Jordan Lee/i)).toBeVisible();
  });

  it("should render the view storybook link when a storybook build exists", () => {
    renderComponent({ storybookHref: "/api/storybook/mock-build/index.html" });

    expect(screen.getByRole("link", { name: /view storybook/i })).toBeVisible();
  });

  it("should not render the view storybook link when there is no storybook build", () => {
    renderComponent({ storybookHref: null });

    expect(screen.queryByRole("link", { name: /view storybook/i })).not.toBeInTheDocument();
  });
});
