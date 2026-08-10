import { vi } from "vitest";

import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import {
  UpdateOrganizationForm,
  type UpdateOrganizationFormProps,
} from "../UpdateOrganizationForm";

vi.mock("@/lib/router");

const mockUpdate = vi.mocked(serverClient.organizations.update);

const ORGANIZATION: UpdateOrganizationFormProps["organization"] = {
  name: "Open Visual Regression",
};

const renderComponent = () =>
  render(
    <>
      <UpdateOrganizationForm organization={ORGANIZATION} />
      <Toaster />
    </>,
  );

describe("UpdateOrganizationForm", () => {
  it("should render the organization's current name", () => {
    renderComponent();

    expect(screen.getByLabelText(/^name$/i)).toHaveValue(ORGANIZATION.name);
  });

  it("should show a validation error when the name is empty", async ({ user }) => {
    renderComponent();

    await user.clear(screen.getByLabelText(/^name$/i));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("you must enter an organization name")).toBeVisible();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should submit the updated name and disable the button while saving", async ({ user }) => {
    let resolveUpdate: (result: [null, undefined]) => void;
    mockUpdate.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    renderComponent();

    await user.clear(screen.getByLabelText(/^name$/i));
    await user.type(screen.getByLabelText(/^name$/i), "New Org Name");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled());
    expect(mockUpdate).toHaveBeenCalledWith({ name: "New Org Name" });

    resolveUpdate!([null, undefined]);

    expect(await screen.findByText("organization updated")).toBeVisible();
  });

  it("should show a root error message when saving fails", async ({ user }) => {
    mockUpdate.mockResolvedValue([
      {
        message: "something went wrong",
        code: "INTERNAL_SERVER_ERROR",
        status: 500,
        data: undefined,
        defined: false,
      },
      undefined,
    ]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("something went wrong");
    expect(screen.queryByText("organization updated")).not.toBeInTheDocument();
  });
});
