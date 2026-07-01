import { vi } from "vitest";

import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { UpdatePasswordForm } from "../UpdatePasswordForm";

vi.mock("@/lib/router");

const mockUpdatePassword = vi.mocked(serverClient.account.updatePassword);

const renderComponent = () =>
  render(
    <>
      <UpdatePasswordForm />
      <Toaster />
    </>,
  );

describe("UpdatePasswordForm", () => {
  it("should show a validation error when the current password is empty", async ({ user }) => {
    renderComponent();

    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("you must enter your current password")).toBeVisible();
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("should show a validation error when the new password is too short", async ({ user }) => {
    renderComponent();

    await user.type(screen.getByLabelText(/^current password$/i), "oldpassword123");
    await user.type(screen.getByLabelText(/^new password$/i), "short");
    await user.type(screen.getByLabelText(/^confirm password$/i), "short");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("password must be at least 8 characters")).toBeVisible();
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("should show a validation error when the new passwords do not match", async ({ user }) => {
    renderComponent();

    await user.type(screen.getByLabelText(/^current password$/i), "oldpassword123");
    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "different456");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("passwords do not match")).toBeVisible();
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("should submit the current and new password", async ({ user }) => {
    mockUpdatePassword.mockResolvedValue([null, undefined]);
    renderComponent();

    await user.type(screen.getByLabelText(/^current password$/i), "oldpassword123");
    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(mockUpdatePassword).toHaveBeenCalledWith({
        currentPassword: "oldpassword123",
        newPassword: "newpassword123",
      }),
    );
    expect(await screen.findByText("password updated")).toBeVisible();
  });

  it("should clear the password fields after a successful save", async ({ user }) => {
    mockUpdatePassword.mockResolvedValue([null, undefined]);
    renderComponent();

    await user.type(screen.getByLabelText(/^current password$/i), "oldpassword123");
    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(screen.getByLabelText(/^current password$/i)).toHaveValue(""));
    expect(screen.getByLabelText(/^new password$/i)).toHaveValue("");
    expect(screen.getByLabelText(/^confirm password$/i)).toHaveValue("");
  });

  it("should disable the submit button while saving", async ({ user }) => {
    mockUpdatePassword.mockReturnValue(new Promise(() => {}));
    renderComponent();

    await user.type(screen.getByLabelText(/^current password$/i), "oldpassword123");
    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled());
  });

  it("should show a root error message when saving fails", async ({ user }) => {
    mockUpdatePassword.mockResolvedValue([
      {
        message: "incorrect password",
        code: "BAD_REQUEST",
        status: 400,
        data: undefined,
        defined: false,
      },
      undefined,
    ]);
    renderComponent();

    await user.type(screen.getByLabelText(/^current password$/i), "wrongpassword");
    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("incorrect password");
    expect(screen.queryByText("password updated")).not.toBeInTheDocument();
  });
});
