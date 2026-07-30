import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { InvitationCard } from "../InvitationCard";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockAcceptInvitation = vi.mocked(serverClient.invitations.acceptInvitation);
const mockPush = vi.mocked(useRouter)().push;

const INVITATION_ID = "test-invitation-id";
const EMAIL = "invited@example.com";
const ORG_NAME = "test org";

const renderComponent = ({ hasAccount = false } = {}) =>
  render(
    <InvitationCard
      invitationId={INVITATION_ID}
      email={EMAIL}
      organizationName={ORG_NAME}
      role="member"
      hasAccount={hasAccount}
    />,
  );

describe("InvitationCard", () => {
  it("should display the pre-filled email address", () => {
    renderComponent();
    expect(screen.getByDisplayValue(EMAIL)).toBeVisible();
  });

  it("should show validation errors for empty fields", async ({ user }) => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("name is required")).toBeVisible();
    expect(screen.getByText("password must be at least 8 characters")).toBeVisible();
  });

  it("should show an error when passwords do not match", async ({ user }) => {
    renderComponent();

    await user.type(screen.getByLabelText(/^name$/i), "Jules Ortega");
    await user.type(screen.getByLabelText(/^password$/i), "securepass123");
    await user.type(screen.getByLabelText(/confirm password/i), "different456");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("passwords do not match")).toBeVisible();
    expect(mockAcceptInvitation).not.toHaveBeenCalled();
  });

  it("should redirect to / on successful submission", async ({ user }) => {
    mockAcceptInvitation.mockResolvedValue([null, undefined]);
    renderComponent();

    await user.type(screen.getByLabelText(/^name$/i), "Jules Ortega");
    await user.type(screen.getByLabelText(/^password$/i), "securepass123");
    await user.type(screen.getByLabelText(/confirm password/i), "securepass123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
    expect(mockAcceptInvitation).toHaveBeenCalledWith({
      invitationId: INVITATION_ID,
      name: "Jules Ortega",
      password: "securepass123",
    });
  });

  it("should show a root error if account creation fails", async ({ user }) => {
    mockAcceptInvitation.mockResolvedValue([createORPCError("BAD_REQUEST"), undefined]);
    renderComponent();

    await user.type(screen.getByLabelText(/^name$/i), "Jules Ortega");
    await user.type(screen.getByLabelText(/^password$/i), "securepass123");
    await user.type(screen.getByLabelText(/confirm password/i), "securepass123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("BAD_REQUEST");
  });

  it("should disable the submit button while creating the account", async ({ user }) => {
    mockAcceptInvitation.mockReturnValue(new Promise(() => {}));
    renderComponent();

    await user.type(screen.getByLabelText(/^name$/i), "Jules Ortega");
    await user.type(screen.getByLabelText(/^password$/i), "securepass123");
    await user.type(screen.getByLabelText(/confirm password/i), "securepass123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled());
  });

  describe("when the email already has an account", () => {
    it("should only ask for the existing password", () => {
      renderComponent({ hasAccount: true });

      expect(screen.getByDisplayValue(EMAIL)).toBeVisible();
      expect(screen.getByLabelText(/^password$/i)).toBeVisible();
      expect(screen.queryByLabelText(/^name$/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
    });

    it("should accept the invitation without sending a name", async ({ user }) => {
      mockAcceptInvitation.mockResolvedValue([null, undefined]);
      renderComponent({ hasAccount: true });

      await user.type(screen.getByLabelText(/^password$/i), "my-existing-password");
      await user.click(screen.getByRole("button", { name: /sign in and join/i }));

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
      expect(mockAcceptInvitation).toHaveBeenCalledWith({
        invitationId: INVITATION_ID,
        password: "my-existing-password",
      });
    });

    it("should show a root error when the password is wrong", async ({ user }) => {
      mockAcceptInvitation.mockResolvedValue([createORPCError("BAD_REQUEST"), undefined]);
      renderComponent({ hasAccount: true });

      await user.type(screen.getByLabelText(/^password$/i), "wrong-password");
      await user.click(screen.getByRole("button", { name: /sign in and join/i }));

      expect(await screen.findByRole("alert")).toHaveTextContent("BAD_REQUEST");
    });
  });
});
