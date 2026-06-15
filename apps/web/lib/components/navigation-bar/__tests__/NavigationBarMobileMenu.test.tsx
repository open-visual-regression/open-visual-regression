import { vi } from "vitest";
import { usePathname } from "next/navigation";

import { describe, expect, it, render, screen, waitFor } from "@/test-utils";
import {
  NavigationBarMobileMenu,
  type NavigationBarMobileMenuProps,
} from "../NavigationBarMobileMenu";

vi.mock("next/navigation");

const PROJECTS: NavigationBarMobileMenuProps["projects"] = [
  { id: "project-1", name: "Alpha" },
  { id: "project-2", name: "Beta" },
];

describe("NavigationBarMobileMenu", () => {
  it("should not render a mobile menu trigger outside settings and projects routes", () => {
    vi.mocked(usePathname).mockReturnValue("/");

    render(<NavigationBarMobileMenu role="user" projects={PROJECTS} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should open the settings nav links from the mobile menu", async ({ user }) => {
    vi.mocked(usePathname).mockReturnValue("/settings/account");

    render(<NavigationBarMobileMenu role="admin" projects={PROJECTS} />);

    await user.click(screen.getByRole("button", { name: /open settings navigation/i }));

    expect(screen.getByRole("link", { name: "account" })).toBeVisible();
    expect(screen.getByRole("link", { name: "general" })).toBeVisible();
    expect(screen.getByRole("link", { name: "users" })).toBeVisible();
  });

  it("should open the projects nav links from the mobile menu", async ({ user }) => {
    vi.mocked(usePathname).mockReturnValue("/projects");

    render(<NavigationBarMobileMenu role="user" projects={PROJECTS} />);

    await user.click(screen.getByRole("button", { name: /open projects navigation/i }));

    expect(screen.getByRole("link", { name: "Alpha" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Beta" })).toBeVisible();
  });

  it("should close the menu after clicking a nav link", async ({ user }) => {
    vi.mocked(usePathname).mockReturnValue("/settings/account");

    render(<NavigationBarMobileMenu role="admin" projects={PROJECTS} />);

    await user.click(screen.getByRole("button", { name: /open settings navigation/i }));
    expect(screen.getByRole("link", { name: "account" })).toBeVisible();

    await user.click(screen.getByRole("link", { name: "account" }));

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "account" })).not.toBeInTheDocument();
    });
  });
});
