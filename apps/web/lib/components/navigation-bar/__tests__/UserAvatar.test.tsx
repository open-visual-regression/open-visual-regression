import { afterEach, beforeEach, vi } from "vitest";

import { authClient } from "@/lib/auth/client";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { UserAvatar } from "../UserAvatar";

vi.mock("@/lib/auth/client");

const mockSignOut = vi.mocked(authClient.signOut);

describe("UserAvatar", () => {
  beforeEach(() => {
    let href = "http://localhost:3000/projects";
    vi.stubGlobal("location", {
      get href() {
        return href;
      },
      set href(value: string) {
        href = new URL(value, href).href;
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should show settings and sign out in the menu, and close it when settings is selected", async ({
    user,
  }) => {
    render(<UserAvatar name="Tom Fischer" />);

    await user.click(screen.getByRole("button", { name: "User menu for Tom Fischer" }));

    const settingsLink = await screen.findByRole("menuitem", { name: "settings" });
    expect(settingsLink).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeVisible();

    await user.click(settingsLink);

    await waitFor(() => {
      expect(screen.queryByRole("menuitem", { name: /sign out/i })).not.toBeInTheDocument();
    });
  });

  it("should redirect to login after successfully signing out", async ({ user }) => {
    mockSignOut.mockImplementation(async (options) => {
      await options?.fetchOptions?.onSuccess?.({} as never);
      return {};
    });

    render(<UserAvatar name="Tom Fischer" />);

    await user.click(screen.getByRole("button", { name: "User menu for Tom Fischer" }));
    await user.click(await screen.findByRole("menuitem", { name: /sign out/i }));

    await waitFor(() => {
      expect(window.location.href).toBe("http://localhost:3000/login");
    });
  });

  it("should still redirect to login if signing out fails", async ({ user }) => {
    mockSignOut.mockImplementation(async (options) => {
      await options?.fetchOptions?.onError?.({} as never);
      return {};
    });

    render(<UserAvatar name="Tom Fischer" />);

    await user.click(screen.getByRole("button", { name: "User menu for Tom Fischer" }));
    await user.click(await screen.findByRole("menuitem", { name: /sign out/i }));

    await waitFor(() => {
      expect(window.location.href).toBe("http://localhost:3000/login");
    });
  });
});
