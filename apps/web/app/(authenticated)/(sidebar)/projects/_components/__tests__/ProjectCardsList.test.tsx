import { mockAllIsIntersecting } from "react-intersection-observer/test-utils";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { act, describe, expect, it, render, screen } from "@/test-utils";

import { ProjectCardsList } from "../ProjectCardsList";

const noop = () => {};

const renderList = (
  projects: ReturnType<typeof mocks.project.generateProject>[],
  props: Partial<React.ComponentProps<typeof ProjectCardsList>> = {},
) =>
  render(
    <ProjectCardsList
      projects={projects}
      isLoading={false}
      hasNextPage={false}
      isFetchingNextPage={false}
      onLoadMore={noop}
      {...props}
    />,
  );

describe("ProjectCardsList", () => {
  it("should render a card for each project", () => {
    const projects = [
      mocks.project.generateProject({ name: "storefront" }),
      mocks.project.generateProject({ name: "checkout" }),
    ];
    renderList(projects);

    expect(screen.getByText("storefront")).toBeVisible();
    expect(screen.getByText("checkout")).toBeVisible();
  });

  it("should link each card to its project detail page", () => {
    const project = mocks.project.generateProject();
    renderList([project]);

    expect(screen.getByRole("link")).toHaveAttribute("href", `/projects/${project.id}`);
  });

  it("should load and append more projects when the user scrolls to the bottom", () => {
    const firstPage = mocks.project.generateProject({ name: "first page project" });
    const secondPage = mocks.project.generateProject({ name: "second page project" });
    const onLoadMore = vi.fn();

    const { rerender } = renderList([firstPage], { hasNextPage: true, onLoadMore });
    expect(screen.queryByText("second page project")).toBeNull();

    act(() => mockAllIsIntersecting(true));
    expect(onLoadMore).toHaveBeenCalledOnce();

    rerender(
      <ProjectCardsList
        projects={[firstPage, secondPage]}
        isLoading={false}
        hasNextPage={false}
        isFetchingNextPage={false}
        onLoadMore={onLoadMore}
      />,
    );
    expect(screen.getByText("second page project")).toBeVisible();
  });

  it("should not load more projects while a page is already loading", () => {
    const onLoadMore = vi.fn();
    renderList([mocks.project.generateProject()], {
      hasNextPage: true,
      isFetchingNextPage: true,
      onLoadMore,
    });

    act(() => mockAllIsIntersecting(true));

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("should not load more projects once the last page has been reached", () => {
    const onLoadMore = vi.fn();
    renderList([mocks.project.generateProject()], { hasNextPage: false, onLoadMore });

    act(() => mockAllIsIntersecting(true));

    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
