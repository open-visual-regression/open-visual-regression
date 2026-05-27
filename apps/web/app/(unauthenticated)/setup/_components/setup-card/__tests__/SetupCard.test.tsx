import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

import { mocks } from "@ovr/mocks";

import { vi } from "vitest";

import { describe, expect, it, render, screen, waitFor } from "@/test-utils";
import { SetupCard } from "../SetupCard";

vi.mock("@/lib/auth");
vi.mock("next/navigation");
vi.mock("next/headers");

const mockSignUpEmail = vi.mocked(auth.api.signUpEmail);
const mockCreateOrganization = vi.mocked(auth.api.createOrganization);

const renderComponent = () => render(<SetupCard />);

describe("SetupCard", () => {
  it("should show errors for missing or invalid fields before allowing progress", async ({
    user,
  }) => {
    renderComponent();

    // Step 1: empty submit
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(await screen.findByText("organization name is required")).toBeVisible();

    // Advance to step 2
    await user.type(screen.getByLabelText(/organization name/i), "Tom Fischer's Organization");
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Step 2: all empty
    await user.click(await screen.findByRole("button", { name: /create/i }));
    expect(await screen.findByText("name is required")).toBeVisible();
    expect(screen.getByText("invalid email address")).toBeVisible();
    expect(screen.getByText("password must be at least 8 characters")).toBeVisible();

    // Password too short
    await user.type(screen.getByLabelText(/^name$/i), "Tom Fischer");
    await user.type(screen.getByLabelText(/^email$/i), "tom.fischer@openvisualregression.com");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.click(screen.getByRole("button", { name: /create/i }));
    expect(await screen.findByText("password must be at least 8 characters")).toBeVisible();

    // Passwords do not match
    await user.clear(screen.getByLabelText(/^password$/i));
    await user.type(screen.getByLabelText(/^password$/i), "securepass123");
    await user.type(screen.getByLabelText(/confirm password/i), "different456");
    await user.click(screen.getByRole("button", { name: /create/i }));
    expect(await screen.findByText("passwords do not match")).toBeVisible();
  });

  it("should remember what was typed when going back a step", async ({ user }) => {
    renderComponent();

    await user.type(screen.getByLabelText(/organization name/i), "Tom Fischer's Organization");
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(await screen.findByRole("button", { name: /back/i }));

    expect(screen.getByLabelText(/organization name/i)).toHaveValue("Tom Fischer's Organization");
  });

  it("should show an error if account creation fails", async ({ user }) => {
    mockSignUpEmail.mockRejectedValue(new Error("email already in use"));
    renderComponent();

    await user.type(screen.getByLabelText(/organization name/i), "Tom Fischer's Organization");
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.type(await screen.findByLabelText(/^name$/i), "Tom Fischer");
    await user.type(screen.getByLabelText(/^email$/i), "tom.fischer@openvisualregression.com");
    await user.type(screen.getByLabelText(/^password$/i), "securepass123");
    await user.type(screen.getByLabelText(/confirm password/i), "securepass123");
    await user.click(screen.getByRole("button", { name: /create/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("email already in use");
  });

  it("should take the user to the dashboard after successful setup", async ({ user }) => {
    mockSignUpEmail.mockResolvedValue({
      token: "test-token",
      user: mocks.user.generateUser(),
    });
    mockCreateOrganization.mockResolvedValue({
      ...mocks.organization.generateOrganization(),
      members: [],
    });
    renderComponent();

    await user.type(screen.getByLabelText(/organization name/i), "Tom Fischer's Organization");
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.type(await screen.findByLabelText(/^name$/i), "Tom Fischer");
    await user.type(screen.getByLabelText(/^email$/i), "tom.fischer@openvisualregression.com");
    await user.type(screen.getByLabelText(/^password$/i), "securepass123");
    await user.type(screen.getByLabelText(/confirm password/i), "securepass123");
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(vi.mocked(redirect)).toHaveBeenCalledWith("/login"));
  });

  it("should prevent resubmission while saving", async ({ user }) => {
    mockSignUpEmail.mockReturnValue(new Promise(() => {}));
    renderComponent();

    await user.type(screen.getByLabelText(/organization name/i), "Tom Fischer's Organization");
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.type(await screen.findByLabelText(/^name$/i), "Tom Fischer");
    await user.type(screen.getByLabelText(/^email$/i), "tom.fischer@openvisualregression.com");
    await user.type(screen.getByLabelText(/^password$/i), "securepass123");
    await user.type(screen.getByLabelText(/confirm password/i), "securepass123");
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled());
    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled();
  });
});
