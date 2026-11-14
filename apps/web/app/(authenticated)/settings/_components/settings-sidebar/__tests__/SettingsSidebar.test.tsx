import { usePathname } from "next/navigation";
import { vi } from "vitest";

import { describe, expect, it, render, screen } from "@/test-utils";

import { SettingsSidebar } from "../SettingsSidebar";

vi.mock("next/navigation");

describe("SettingsSidebar", () => {
  it("should show personal and admin sections for an admin user", () => {
    vi.mocked(usePathname).mockReturnValue("/settings/account");

    render(<SettingsSidebar role="admin" />);

    expect(screen.getByRole("heading", { name: "Personal" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Admin" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Organization" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Users" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Jobs" })).toBeVisible();
  });

  it("should hide the admin section for a non-admin user", () => {
    vi.mocked(usePathname).mockReturnValue("/settings/account");

    render(<SettingsSidebar role="reviewer" />);

    expect(screen.getByRole("heading", { name: "Personal" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Organization" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Jobs" })).not.toBeInTheDocument();
  });
});
