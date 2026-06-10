import { beforeEach, vi } from "vitest";

import { describe, expect, it, render, screen, waitFor } from "@/test-utils";
import { authClient } from "@/lib/auth/client";
import { LoginCard } from "../LoginCard";

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
  },
}));

const mockSignInEmail = vi.mocked(authClient.signIn.email);

const renderComponent = () => render(<LoginCard />);

describe("LoginCard", () => {
  beforeEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });
  });

  it("should render the login form", () => {
    renderComponent();

    expect(screen.getByRole("heading", { name: /sign in/i })).toBeVisible();
    expect(screen.getByLabelText(/email/i)).toBeVisible();
    expect(screen.getByLabelText(/password/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  it("should show validation errors for empty fields without calling auth", async ({ user }) => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("invalid email address")).toBeVisible();
    expect(screen.getByText("you must enter your password")).toBeVisible();
    expect(mockSignInEmail).not.toHaveBeenCalled();
  });

  it("should show an inline error and not redirect on invalid credentials", async ({ user }) => {
    mockSignInEmail.mockResolvedValue({
      data: null,
      error: { message: "invalid email or password", status: 401, statusText: "Unauthorized" },
    } as Awaited<ReturnType<typeof authClient.signIn.email>>);
    renderComponent();

    await user.type(screen.getByLabelText(/email/i), "ari@acme.dev");
    await user.type(screen.getByLabelText(/password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("invalid email or password");
    expect(window.location.href).toBe("");
  });

  it("should redirect to /projects on valid credentials", async ({ user }) => {
    mockSignInEmail.mockResolvedValue({
      data: null,
      error: null,
    } as Awaited<ReturnType<typeof authClient.signIn.email>>);
    renderComponent();

    await user.type(screen.getByLabelText(/email/i), "ari@acme.dev");
    await user.type(screen.getByLabelText(/password/i), "correct-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(window.location.href).toBe("/projects"));
  });
});
