import { afterEach, beforeEach, vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { describe, expect, it, render, screen } from "@/test-utils";

import { BuildsTable } from "../BuildsTable";

let triggerIntersection: (() => void) | null = null;

class MockIntersectionObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}

  observe(element: Element) {
    triggerIntersection = () =>
      this.callback(
        [{ isIntersecting: true, target: element } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
  }

  unobserve() {}

  disconnect() {
    triggerIntersection = null;
  }
}

beforeEach(() => {
  triggerIntersection = null;
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const noop = () => {};

const renderTable = (
  data: ReturnType<typeof mocks.build.generateBuild>[],
  props: Partial<React.ComponentProps<typeof BuildsTable>> = {},
) =>
  render(
    <BuildsTable
      data={data}
      isLoading={false}
      hasNextPage={false}
      isFetchingNextPage={false}
      onLoadMore={noop}
      {...props}
    />,
  );

describe("BuildsTable", () => {
  it("should render a row for each build", () => {
    const build = mocks.build.generateBuild({
      name: "fix: cart total rounding",
      branch: "pr/482",
    });
    renderTable([build]);

    expect(screen.getByRole("cell", { name: /fix: cart total rounding/ })).toBeVisible();
    expect(screen.getByRole("cell", { name: "pr/482" })).toBeVisible();
  });

  it("should show the short commit sha when the build has no name", () => {
    const build = mocks.build.generateBuild({ name: null, commitSha: "4f2a91e1234567890" });
    renderTable([build]);

    expect(screen.getByRole("cell", { name: /4f2a91e/ })).toBeVisible();
  });

  it("should show a passed build's status as 'passed'", () => {
    const build = mocks.build.generateBuild({ status: "passed" });
    renderTable([build]);

    expect(screen.getByRole("cell", { name: "passed" })).toBeVisible();
  });

  it("should show a needs_review build's status as 'needs review'", () => {
    const build = mocks.build.generateBuild({ status: "needs_review" });
    renderTable([build]);

    expect(screen.getByRole("cell", { name: "needs review" })).toBeVisible();
  });

  it("should show an error build's status as 'error'", () => {
    const build = mocks.build.generateBuild({ status: "error" });
    renderTable([build]);

    expect(screen.getByRole("cell", { name: "error" })).toBeVisible();
  });

  it("should show a queued build's status as 'queued'", () => {
    const build = mocks.build.generateBuild({ status: "queued" });
    renderTable([build]);

    expect(screen.getByRole("cell", { name: "queued" })).toBeVisible();
  });

  it("should show a relative time for a build created recently", () => {
    const build = mocks.build.generateBuild({
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    });
    renderTable([build]);

    expect(screen.getByRole("cell", { name: "5 minutes ago" })).toBeVisible();
  });

  it("should link each row to its build detail page", () => {
    const build = mocks.build.generateBuild({ commitSha: "4f2a91e1234567890" });
    renderTable([build]);

    expect(screen.getByRole("link", { name: "view build 4f2a91e" })).toHaveAttribute(
      "href",
      `/projects/${build.project.id}/builds/${build.id}`,
    );
  });

  it("should show a no-results message when a search matches no builds", () => {
    renderTable([], { search: "missing" });

    expect(screen.getByRole("cell", { name: 'no builds found matching "missing"' })).toBeVisible();
  });

  it("should load more builds when scrolled to the bottom", () => {
    const onLoadMore = vi.fn();
    renderTable([mocks.build.generateBuild()], { hasNextPage: true, onLoadMore });

    expect(onLoadMore).not.toHaveBeenCalled();

    triggerIntersection?.();

    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it("should not load more builds while a page is already loading", () => {
    const onLoadMore = vi.fn();
    renderTable([mocks.build.generateBuild()], {
      hasNextPage: true,
      isFetchingNextPage: true,
      onLoadMore,
    });

    triggerIntersection?.();

    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
