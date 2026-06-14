import { vi } from "vitest";
import { Toaster } from "@ovr/ui/components/sonner";

import { describe, expect, it, render, screen, waitFor } from "@/test-utils";
import { serverClient } from "@/lib/router";
import { UpdateAccountForm, type UpdateAccountFormProps } from "../UpdateAccountForm";

vi.mock("@/lib/router");

const mockUpdateAccountInformation = vi.mocked(serverClient.account.updateAccountInformation);

const USER: UpdateAccountFormProps["user"] = {
  name: "Tom Fischer",
  email: "tom@openvisualregression.com",
};

const renderComponent = () =>
  render(
    <>
      <UpdateAccountForm user={USER} />
      <Toaster />
    </>,
  );

describe("UpdateAccountForm", () => {
  it("should render the user's current name and email", () => {
    renderComponent();

    expect(screen.getByLabelText(/^name$/i)).toHaveValue(USER.name);
    expect(screen.getByLabelText(/^email$/i)).toHaveValue(USER.email);
  });

  it("should show a validation error when the name is empty", async ({ user }) => {
    renderComponent();

    await user.clear(screen.getByLabelText(/^name$/i));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("you must enter a name")).toBeVisible();
    expect(mockUpdateAccountInformation).not.toHaveBeenCalled();
  });

  it("should show a validation error when the email is invalid", async ({ user }) => {
    renderComponent();

    await user.clear(screen.getByLabelText(/^email$/i));
    await user.type(screen.getByLabelText(/^email$/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("invalid email address")).toBeVisible();
    expect(mockUpdateAccountInformation).not.toHaveBeenCalled();
  });

  it("should submit the updated name and email", async ({ user }) => {
    mockUpdateAccountInformation.mockResolvedValue([null, undefined]);
    renderComponent();

    await user.clear(screen.getByLabelText(/^name$/i));
    await user.type(screen.getByLabelText(/^name$/i), "New Name");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(mockUpdateAccountInformation).toHaveBeenCalledWith({
        name: "New Name",
        email: USER.email,
      }),
    );
    expect(await screen.findByText("account updated")).toBeVisible();
  });

  it("should disable the submit button while saving", async ({ user }) => {
    mockUpdateAccountInformation.mockReturnValue(new Promise(() => {}));
    renderComponent();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled());
  });

  it("should show a root error message when saving fails", async ({ user }) => {
    mockUpdateAccountInformation.mockResolvedValue([
      {
        message: "this email is already in use",
        code: "CONFLICT",
        status: 409,
        data: undefined,
        defined: false,
      },
      undefined,
    ]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("this email is already in use");
    expect(screen.queryByText("account updated")).not.toBeInTheDocument();
  });
});
