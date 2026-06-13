import { FolderIcon } from "@ovr/ui/components/icon";
import { describe, expect, it, render, screen } from "@/test-utils";
import { SidebarItem } from "../SidebarItem";

describe("SidebarItem", () => {
  it("should apply active styling to the active item", () => {
    render(
      <>
        <SidebarItem href="/a" icon={FolderIcon} label="Item 1" active />
        <SidebarItem href="/b" icon={FolderIcon} label="Item 2" />
      </>,
    );

    expect(screen.getByRole("link", { name: "Item 1" })).toHaveClass("border-l-ovr-accent");
    expect(screen.getByRole("link", { name: "Item 2" })).toHaveClass("border-l-transparent");
  });

  it("should move the active styling when a different item becomes active", () => {
    const { rerender } = render(
      <>
        <SidebarItem href="/a" icon={FolderIcon} label="Item 1" active />
        <SidebarItem href="/b" icon={FolderIcon} label="Item 2" />
      </>,
    );

    // Mirrors a route change: the consumer recomputes `active` from the new pathname.
    rerender(
      <>
        <SidebarItem href="/a" icon={FolderIcon} label="Item 1" />
        <SidebarItem href="/b" icon={FolderIcon} label="Item 2" active />
      </>,
    );

    expect(screen.getByRole("link", { name: "Item 1" })).toHaveClass("border-l-transparent");
    expect(screen.getByRole("link", { name: "Item 2" })).toHaveClass("border-l-ovr-accent");
  });
});
