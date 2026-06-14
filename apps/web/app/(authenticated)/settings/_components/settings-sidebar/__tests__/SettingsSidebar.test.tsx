import { vi } from "vitest";
import { usePathname } from "next/navigation";

import { describe, expect, it, render, screen } from "@/test-utils";
import { SettingsSidebar } from "../SettingsSidebar";

vi.mock("next/navigation");

describe("SettingsSidebar", () => {
  it("should show personal and admin sections for an admin user", () => {
    vi.mocked(usePathname).mockReturnValue("/settings/account");

    render(<SettingsSidebar role="admin" />);

    expect(screen.getByRole("heading", { name: "personal" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "admin" })).toBeVisible();
    expect(screen.getByRole("link", { name: "general" })).toBeVisible();
    expect(screen.getByRole("link", { name: "users" })).toBeVisible();
    expect(screen.getByRole("link", { name: "invitations" })).toBeVisible();
  });

  it("should hide the admin section for a non-admin user", () => {
    vi.mocked(usePathname).mockReturnValue("/settings/account");

    render(<SettingsSidebar role="user" />);

    expect(screen.getByRole("heading", { name: "personal" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "admin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "general" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "users" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "invitations" })).not.toBeInTheDocument();
  });

  it("should collapse to an icon-only rail and back", async ({ user }) => {
    vi.mocked(usePathname).mockReturnValue("/settings/account");

    render(<SettingsSidebar role="admin" />);

    expect(screen.getByRole("heading", { name: "personal" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /collapse settings navigation/i }));

    expect(screen.queryByRole("heading", { name: "personal" })).not.toBeInTheDocument();
    expect(screen.getByText("per")).toBeVisible();
    expect(screen.getByText("adm")).toBeVisible();
    expect(screen.getByRole("link", { name: /account/i })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /expand settings navigation/i }));

    expect(screen.getByRole("heading", { name: "personal" })).toBeVisible();
  });
});
