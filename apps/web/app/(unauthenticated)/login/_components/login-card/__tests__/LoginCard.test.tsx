import { afterEach, beforeEach, vi } from "vitest";

import { authClient } from "@/lib/auth/client";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { LoginCard } from "../LoginCard";

vi.mock("@/lib/auth/client");

const mockSignIn = vi.mocked(authClient.signIn.email);

const renderComponent = () => render(<LoginCard />);

describe("InvitationCard", () => {
  beforeEach(() => {
    mockSignIn.mockResolvedValue({ error: null } as Awaited<
      ReturnType<typeof authClient.signIn.email>
    >);

    let href = "http://localhost:3000/login";
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

  it("should successfully sign the user in", async ({ user }) => {
    const email = "tom@openvisualregression.com";
    const password = "hunter123";

    renderComponent();

    await user.type(screen.getByLabelText("email"), email);
    await user.type(screen.getByLabelText("password"), password);
    await user.click(screen.getByRole("button", { name: "sign in" }));

    expect(await screen.findByRole("button", { name: "signing in..." })).toBeVisible();

    await waitFor(() => {
      expect(window.location.href).toBe("http://localhost:3000/projects");
    });

    expect(mockSignIn).toHaveBeenCalledWith({
      email,
      password,
    });
  });

  it("should show validation errors for empty fields", async ({ user }) => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: "sign in" }));

    expect(await screen.findByText("invalid email address")).toBeVisible();
    expect(await screen.findByText("you must enter your password")).toBeVisible();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should show an error when the email is invalid", async ({ user }) => {
    renderComponent();

    await user.type(screen.getByLabelText("email"), "derp");

    await user.click(screen.getByRole("button", { name: "sign in" }));

    expect(await screen.findByText("invalid email address")).toBeVisible();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should show an error if logging in fails", async ({ user }) => {
    const errorMessage = "something went wrong";

    mockSignIn.mockResolvedValue({ error: { message: errorMessage } });

    renderComponent();

    await user.type(screen.getByLabelText("email"), "tom@openvisualregression.com");
    await user.type(screen.getByLabelText("password"), "hunter123");
    await user.click(screen.getByRole("button", { name: "sign in" }));

    expect(await screen.findByText(errorMessage)).toBeVisible();
  });
});
