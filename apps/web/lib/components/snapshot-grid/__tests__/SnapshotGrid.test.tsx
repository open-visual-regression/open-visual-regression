import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotGrid } from "../SnapshotGrid";

type Item = { id: string; name: string };

const renderGrid = (items: Item[]) =>
  render(
    <SnapshotGrid
      items={items}
      getKey={(item) => item.id}
      renderItem={(item) => <a href={`/items/${item.id}`}>{item.name}</a>}
      emptyMessage="no snapshots found"
    />,
  );

describe("SnapshotGrid", () => {
  it("should render every item", () => {
    renderGrid([
      { id: "1", name: "home-page" },
      { id: "2", name: "checkout-page" },
    ]);

    expect(screen.getByRole("link", { name: "home-page" })).toHaveAttribute("href", "/items/1");
    expect(screen.getByRole("link", { name: "checkout-page" })).toHaveAttribute("href", "/items/2");
  });

  it("should show the empty message when there are no items", () => {
    renderGrid([]);

    expect(screen.getByText("no snapshots found")).toBeVisible();
  });
});
