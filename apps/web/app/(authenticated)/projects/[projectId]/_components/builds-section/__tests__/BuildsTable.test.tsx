import { mockAllIsIntersecting } from "react-intersection-observer/test-utils";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { act, describe, expect, it, render, screen, within } from "@/test-utils";

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

  it("should expose exactly one accessible link per build row", () => {
    const builds = [
      mocks.build.generateBuild({ commitSha: "1111111abcdef" }),
      mocks.build.generateBuild({ commitSha: "2222222abcdef" }),
      mocks.build.generateBuild({ commitSha: "3333333abcdef" }),
    ];
    renderTable(builds);

    for (const build of builds) {
      expect(
        screen.getByRole("link", { name: `view build ${build.commitSha.slice(0, 7)}` }),
      ).toHaveAttribute("href", `/projects/${build.project.id}/builds/${build.id}`);
    }
    expect(screen.getAllByRole("link")).toHaveLength(builds.length);
  });

  it("should link every cell in a row to that row's build, not another row's", () => {
    const first = mocks.build.generateBuild({ branch: "main" });
    const second = mocks.build.generateBuild({ branch: "pr/482" });
    renderTable([first, second]);

    const firstRow = screen.getByRole("row", { name: /main/ });
    const firstRowLinks = within(firstRow).getAllByRole("link", { hidden: true });

    expect(firstRowLinks.length).toBeGreaterThan(1);
    for (const link of firstRowLinks) {
      expect(link).toHaveAttribute("href", `/projects/${first.project.id}/builds/${first.id}`);
    }
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
