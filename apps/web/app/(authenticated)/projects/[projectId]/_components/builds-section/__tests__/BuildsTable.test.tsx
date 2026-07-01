import { mockAllIsIntersecting } from "react-intersection-observer/test-utils";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { act, describe, expect, it, render, screen } from "@/test-utils";

import { BuildsTable } from "../BuildsTable";

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
    const builds = [
      mocks.build.generateBuild({ name: "fix: cart total rounding", branch: "pr/482" }),
      mocks.build.generateBuild({ name: "feat: add checkout", branch: "pr/483" }),
    ];
    renderTable(builds);

    expect(screen.getByRole("cell", { name: /fix: cart total rounding/ })).toBeVisible();
    expect(screen.getByRole("cell", { name: /feat: add checkout/ })).toBeVisible();
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

  it("should load and append more builds when the user scrolls to the bottom", () => {
    const firstPage = mocks.build.generateBuild({ name: "first page build" });
    const secondPage = mocks.build.generateBuild({ name: "second page build" });
    const onLoadMore = vi.fn();

    const { rerender } = renderTable([firstPage], { hasNextPage: true, onLoadMore });
    expect(screen.queryByRole("cell", { name: /second page build/ })).toBeNull();

    act(() => mockAllIsIntersecting(true));
    expect(onLoadMore).toHaveBeenCalledOnce();

    rerender(
      <BuildsTable
        data={[firstPage, secondPage]}
        isLoading={false}
        hasNextPage={false}
        isFetchingNextPage={false}
        onLoadMore={onLoadMore}
      />,
    );
    expect(screen.getByRole("cell", { name: /second page build/ })).toBeVisible();
  });

  it("should not load more builds while a page is already loading", () => {
    const onLoadMore = vi.fn();
    renderTable([mocks.build.generateBuild()], {
      hasNextPage: true,
      isFetchingNextPage: true,
      onLoadMore,
    });

    act(() => mockAllIsIntersecting(true));

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("should not load more builds once the last page has been reached", () => {
    const onLoadMore = vi.fn();
    renderTable([mocks.build.generateBuild()], { hasNextPage: false, onLoadMore });

    act(() => mockAllIsIntersecting(true));

    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
