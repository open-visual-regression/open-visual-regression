import { mockAllIsIntersecting } from "react-intersection-observer/test-utils";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { act, describe, expect, it, render, screen } from "@/test-utils";

import { BuildsList } from "../BuildsList";

const noop = () => {};

const renderList = (
  data: ReturnType<typeof mocks.build.generateBuild>[],
  props: Partial<React.ComponentProps<typeof BuildsList>> = {},
) =>
  render(
    <BuildsList
      data={data}
      isLoading={false}
      hasNextPage={false}
      isFetchingNextPage={false}
      onLoadMore={noop}
      {...props}
    />,
  );

describe("BuildsList", () => {
  it("should render a row for each build", () => {
    const builds = [
      mocks.build.generateBuild({ name: "fix: cart total rounding", branch: "pr/482" }),
      mocks.build.generateBuild({ name: "feat: add checkout", branch: "pr/483" }),
    ];
    renderList(builds);

    expect(screen.getByText("fix: cart total rounding")).toBeVisible();
    expect(screen.getByText("feat: add checkout")).toBeVisible();
  });

  it("should render the build's status, branch, and author", () => {
    const build = mocks.build.generateBuild({
      status: "needs_review",
      branch: "pr/482",
      author: "Jordan Lee",
    });
    renderList([build]);

    expect(screen.getByText("needs review")).toBeVisible();
    expect(screen.getByText("pr/482")).toBeVisible();
    expect(screen.getByText("Jordan Lee")).toBeVisible();
  });

  it("should link each row to its build detail page", () => {
    const build = mocks.build.generateBuild({ commitSha: "4f2a91e1234567890" });
    renderList([build]);

    expect(screen.getByRole("link", { name: /4f2a91e/ })).toHaveAttribute(
      "href",
      `/projects/${build.project.id}/builds/${build.id}`,
    );
  });

  it("should render exactly one accessible link per build row", () => {
    const builds = [
      mocks.build.generateBuild({ commitSha: "1111111abcdef" }),
      mocks.build.generateBuild({ commitSha: "2222222abcdef" }),
      mocks.build.generateBuild({ commitSha: "3333333abcdef" }),
    ];
    renderList(builds);

    expect(screen.getAllByRole("link")).toHaveLength(builds.length);
    for (const build of builds) {
      expect(
        screen.getByRole("link", { name: new RegExp(build.commitSha.slice(0, 7)) }),
      ).toHaveAttribute("href", `/projects/${build.project.id}/builds/${build.id}`);
    }
  });

  it("should show a no-results message when a search matches no builds", () => {
    renderList([], { search: "missing" });

    expect(screen.getByText('no builds found matching "missing"')).toBeVisible();
  });

  it("should load and append more builds when the user scrolls to the bottom", () => {
    const firstPage = mocks.build.generateBuild({ name: "first page build" });
    const secondPage = mocks.build.generateBuild({ name: "second page build" });
    const onLoadMore = vi.fn();

    const { rerender } = renderList([firstPage], { hasNextPage: true, onLoadMore });
    expect(screen.queryByText("second page build")).toBeNull();

    act(() => mockAllIsIntersecting(true));
    expect(onLoadMore).toHaveBeenCalledOnce();

    rerender(
      <BuildsList
        data={[firstPage, secondPage]}
        isLoading={false}
        hasNextPage={false}
        isFetchingNextPage={false}
        onLoadMore={onLoadMore}
      />,
    );
    expect(screen.getByText("second page build")).toBeVisible();
  });

  it("should not load more builds while a page is already loading", () => {
    const onLoadMore = vi.fn();
    renderList([mocks.build.generateBuild()], {
      hasNextPage: true,
      isFetchingNextPage: true,
      onLoadMore,
    });

    act(() => mockAllIsIntersecting(true));

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("should not load more builds once the last page has been reached", () => {
    const onLoadMore = vi.fn();
    renderList([mocks.build.generateBuild()], { hasNextPage: false, onLoadMore });

    act(() => mockAllIsIntersecting(true));

    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
