import { vi } from "vitest";

import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { InviteUserModal } from "../InviteUserModal";
import { InviteUserModalButton } from "../InviteUserModalButton";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockInvite = vi.mocked(serverClient.users.invite);

const INVITATION_URL = "http://localhost:3000/accept-invitation/test-invitation-id";

const renderComponent = () =>
  render(<InviteUserModal trigger={<InviteUserModalButton>invite user</InviteUserModalButton>} />);

describe("InviteUserModal", () => {
  it("should show a validation error when the email is empty", async ({ user }) => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /invite user/i }));
    await user.click(screen.getByRole("button", { name: /^send invite$/i }));

    expect(await screen.findByText("invalid email address")).toBeVisible();
    expect(mockInvite).not.toHaveBeenCalled();
  });

  it("should send an invitation and show the invitation link in a reveal view", async ({
    user,
  }) => {
    mockInvite.mockResolvedValue([null, { invitationUrl: INVITATION_URL }]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /invite user/i }));
    await user.type(screen.getByLabelText(/email/i), "new.user@example.com");
    await user.click(screen.getByRole("button", { name: /^send invite$/i }));

    expect(await screen.findByRole("heading", { name: /invitation sent/i })).toBeVisible();
    expect(screen.getByText(INVITATION_URL)).toBeVisible();
    expect(mockInvite).toHaveBeenCalledWith({ email: "new.user@example.com" });
  });

  it("should copy the invitation link to clipboard", async ({ user }) => {
    mockInvite.mockResolvedValue([null, { invitationUrl: INVITATION_URL }]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /invite user/i }));
    await user.type(screen.getByLabelText(/email/i), "new.user@example.com");
    await user.click(screen.getByRole("button", { name: /^send invite$/i }));

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await user.click(await screen.findByRole("button", { name: /^copy$/i }));

    expect(writeText).toHaveBeenCalledWith(INVITATION_URL);
    expect(await screen.findByRole("button", { name: /^copied$/i })).toBeVisible();
  });

  it("should show an error if the invitation fails", async ({ user }) => {
    mockInvite.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /invite user/i }));
    await user.type(screen.getByLabelText(/email/i), "new.user@example.com");
    await user.click(screen.getByRole("button", { name: /^send invite$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("INTERNAL_SERVER_ERROR");
  });

  it("should disable the submit button while sending the invitation", async ({ user }) => {
    mockInvite.mockReturnValue(new Promise(() => {}));
    renderComponent();

    await user.click(screen.getByRole("button", { name: /invite user/i }));
    await user.type(screen.getByLabelText(/email/i), "new.user@example.com");
    await user.click(screen.getByRole("button", { name: /^send invite$/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled());
  });

  it("should show the invite form again after closing and reopening the reveal view", async ({
    user,
  }) => {
    mockInvite.mockResolvedValue([null, { invitationUrl: INVITATION_URL }]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /invite user/i }));
    await user.type(screen.getByLabelText(/email/i), "new.user@example.com");
    await user.click(screen.getByRole("button", { name: /^send invite$/i }));
    await user.click(await screen.findByRole("button", { name: /^done$/i }));

    await user.click(screen.getByRole("button", { name: /invite user/i }));

    expect(await screen.findByRole("heading", { name: /^invite user$/i })).toBeVisible();
    expect(screen.getByLabelText(/email/i)).toHaveValue("");
  });
});
