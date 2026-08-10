import { usePathname } from "next/navigation";
import { vi } from "vitest";

import { describe, expect, it, render, screen } from "@/test-utils";

import { SettingsSidebar } from "../SettingsSidebar";

vi.mock("next/navigation");

describe("SettingsSidebar", () => {
  it("should show personal and admin sections for an admin user", () => {
    vi.mocked(usePathname).mockReturnValue("/settings/account");

    render(<SettingsSidebar role="admin" />);

    expect(screen.getByRole("heading", { name: "personal" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "admin" })).toBeVisible();
    expect(screen.getByRole("link", { name: "organization" })).toBeVisible();
    expect(screen.getByRole("link", { name: "users" })).toBeVisible();
  });

  it("should hide the admin section for a non-admin user", () => {
    vi.mocked(usePathname).mockReturnValue("/settings/account");

    render(<SettingsSidebar role="reviewer" />);

    expect(screen.getByRole("heading", { name: "personal" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "admin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "organization" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "users" })).not.toBeInTheDocument();
  });
});
