import { beforeEach, vi } from "vitest";

import { authClient } from "@/lib/auth/client";
import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { InvitationCard, type InvitationCardMode } from "../InvitationCard";

vi.mock("@/lib/router");
vi.mock("@/lib/auth/client");

const mockAcceptInvitation = vi.mocked(serverClient.invitations.acceptInvitation);
const mockSignUp = vi.mocked(authClient.signUp.email);

const INVITATION_ID = "test-invitation-id";
const EMAIL = "invited@example.com";
const ORG_NAME = "test org";

const renderComponent = (mode: InvitationCardMode, sessionEmail: string | null = null) =>
  render(
    <InvitationCard
      mode={mode}
      invitationId={INVITATION_ID}
      email={EMAIL}
      organizationName={ORG_NAME}
      role="member"
      sessionEmail={sessionEmail}
    />,
  );

const fillCreateAccountForm = async (user: {
  type: (element: HTMLElement, text: string) => Promise<void>;
}) => {
  await user.type(screen.getByLabelText(/^name$/i), "Jules Ortega");
  await user.type(screen.getByLabelText(/^password$/i), "securepass123");
  await user.type(screen.getByLabelText(/confirm password/i), "securepass123");
};

beforeEach(() => {
  Object.defineProperty(window, "location", {
    value: { href: "", reload: vi.fn() },
    writable: true,
  });
});

describe("InvitationCard", () => {
  describe("create", () => {
    it("should display the pre-filled email address", () => {
      renderComponent("create");
      expect(screen.getByDisplayValue(EMAIL)).toBeVisible();
    });

    it("should show validation errors for empty fields", async ({ user }) => {
      renderComponent("create");

      await user.click(screen.getByRole("button", { name: /create account/i }));

      expect(await screen.findByText("name is required")).toBeVisible();
      expect(screen.getByText("password must be at least 8 characters")).toBeVisible();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("should show an error when passwords do not match", async ({ user }) => {
      renderComponent("create");

      await user.type(screen.getByLabelText(/^name$/i), "Jules Ortega");
      await user.type(screen.getByLabelText(/^password$/i), "securepass123");
      await user.type(screen.getByLabelText(/confirm password/i), "different456");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      expect(await screen.findByText("passwords do not match")).toBeVisible();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("should create the account and then accept the invitation", async ({ user }) => {
      mockSignUp.mockResolvedValue({ error: null });
      mockAcceptInvitation.mockResolvedValue([null, undefined]);
      renderComponent("create");

      await fillCreateAccountForm(user);
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => expect(window.location.href).toBe("/"));
      expect(mockSignUp).toHaveBeenCalledWith({
        name: "Jules Ortega",
        email: EMAIL,
        password: "securepass123",
      });
      expect(mockAcceptInvitation).toHaveBeenCalledWith({ invitationId: INVITATION_ID });
    });

    it("should not accept the invitation when the sign up fails", async ({ user }) => {
      mockSignUp.mockResolvedValue({ error: { message: "user already exists" } });
      renderComponent("create");

      await fillCreateAccountForm(user);
      await user.click(screen.getByRole("button", { name: /create account/i }));

      expect(await screen.findByRole("alert")).toHaveTextContent("user already exists");
      expect(mockAcceptInvitation).not.toHaveBeenCalled();
    });

    it("should show an error when accepting the invitation fails", async ({ user }) => {
      mockSignUp.mockResolvedValue({ error: null });
      mockAcceptInvitation.mockResolvedValue([createORPCError("BAD_REQUEST"), undefined]);
      renderComponent("create");

      await fillCreateAccountForm(user);
      await user.click(screen.getByRole("button", { name: /create account/i }));

      expect(await screen.findByRole("alert")).toHaveTextContent("BAD_REQUEST");
    });
  });

  describe("accept", () => {
    it("should accept the invitation for the signed in user", async ({ user }) => {
      mockAcceptInvitation.mockResolvedValue([null, undefined]);
      renderComponent("accept", EMAIL);

      await user.click(screen.getByRole("button", { name: /accept invitation/i }));

      await waitFor(() => expect(window.location.href).toBe("/"));
      expect(mockAcceptInvitation).toHaveBeenCalledWith({ invitationId: INVITATION_ID });
    });

    it("should not ask for a name or password", () => {
      renderComponent("accept", EMAIL);

      expect(screen.queryByLabelText(/^name$/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
    });

    it("should show an error when accepting fails", async ({ user }) => {
      mockAcceptInvitation.mockResolvedValue([createORPCError("BAD_REQUEST"), undefined]);
      renderComponent("accept", EMAIL);

      await user.click(screen.getByRole("button", { name: /accept invitation/i }));

      expect(await screen.findByRole("alert")).toHaveTextContent("BAD_REQUEST");
    });
  });

  describe("signIn", () => {
    it("should link to the login page and return to this invitation", () => {
      renderComponent("signIn");

      expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
        "href",
        `/login?redirect=/invitations/${INVITATION_ID}`,
      );
      expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
    });
  });

  describe("wrongAccount", () => {
    it("should name both accounts and offer to sign out", async ({ user }) => {
      renderComponent("wrongAccount", "someone.else@example.com");

      expect(screen.getByText(/someone\.else@example\.com/)).toBeVisible();
      expect(screen.getByText(new RegExp(EMAIL.replace(".", "\\.")))).toBeVisible();

      await user.click(screen.getByRole("button", { name: /sign out/i }));

      expect(vi.mocked(authClient.signOut)).toHaveBeenCalled();
    });
  });
});
