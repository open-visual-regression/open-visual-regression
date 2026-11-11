import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { vi } from "vitest";

import type { Role } from "@/lib/auth/roles";
import { ViewerRoleProvider } from "@/lib/providers/ViewerRoleProvider";
import { act, describe, expect, it, render, screen } from "@/test-utils";

import { SettingsSidebarContainer } from "../SettingsSidebarContainer";

vi.mock("next/navigation");

const renderWithRole = (role: Role | null) =>
  act(async () =>
    render(
      <ViewerRoleProvider role={Promise.resolve(role)}>
        <Suspense>
          <SettingsSidebarContainer />
        </Suspense>
      </ViewerRoleProvider>,
    ),
  );

describe("SettingsSidebarContainer", () => {
  it("should show the admin section when the viewer is an admin", async () => {
    vi.mocked(usePathname).mockReturnValue("/settings/account");

    await renderWithRole("admin");

    expect(screen.getByRole("heading", { name: "admin" })).toBeVisible();
    expect(screen.getByRole("link", { name: "organization" })).toBeVisible();
  });

  it("should hide the admin section when the viewer is not an admin", async () => {
    vi.mocked(usePathname).mockReturnValue("/settings/account");

    await renderWithRole("reviewer");

    expect(screen.getByRole("heading", { name: "personal" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "admin" })).not.toBeInTheDocument();
  });
});
