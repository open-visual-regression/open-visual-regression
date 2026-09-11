import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { CreateAccessTokenModal } from "../CreateAccessTokenModal";
import { CreateAccessTokenModalButton } from "../CreateAccessTokenModalButton";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockCreate = vi.mocked(serverClient.accessTokens.create);
const mockRefresh = vi.mocked(useRouter)().refresh;

const ACCESS_TOKEN = "ovr_pat_3f9a8c2b1d0e4f5a6b7c8d9e0f1a2b3c";

const renderComponent = () =>
  render(
    <CreateAccessTokenModal
      trigger={<CreateAccessTokenModalButton>new access token</CreateAccessTokenModalButton>}
    />,
  );

describe("CreateAccessTokenModal", () => {
  it("should show a validation error when the name is empty", async ({ user }) => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /new access token/i }));
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    expect(await screen.findByText("you must enter a name")).toBeVisible();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("should create an access token, show it in a reveal view, and refresh the table on close", async ({
    user,
  }) => {
    mockCreate.mockResolvedValue([null, { token: ACCESS_TOKEN }]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /new access token/i }));
    await user.type(screen.getByLabelText(/name/i), "cursor");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    expect(await screen.findByRole("heading", { name: /access token created/i })).toBeVisible();
    expect(screen.getByText(ACCESS_TOKEN)).toBeVisible();
    expect(mockCreate).toHaveBeenCalledWith({ name: "cursor" });
    expect(mockRefresh).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^done$/i }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should show an error if access token creation fails", async ({ user }) => {
    mockCreate.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /new access token/i }));
    await user.type(screen.getByLabelText(/name/i), "cursor");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("INTERNAL_SERVER_ERROR");
  });

  it("should disable the submit button while creating", async ({ user }) => {
    mockCreate.mockReturnValue(new Promise(() => {}));
    renderComponent();

    await user.click(screen.getByRole("button", { name: /new access token/i }));
    await user.type(screen.getByLabelText(/name/i), "cursor");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled());
  });

  it("should show the create form again after closing and reopening the reveal view", async ({
    user,
  }) => {
    mockCreate.mockResolvedValue([null, { token: ACCESS_TOKEN }]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /new access token/i }));
    await user.type(screen.getByLabelText(/name/i), "cursor");
    await user.click(screen.getByRole("button", { name: /^create$/i }));
    await user.click(await screen.findByRole("button", { name: /^done$/i }));

    await user.click(screen.getByRole("button", { name: /new access token/i }));

    expect(await screen.findByRole("heading", { name: /^new access token$/i })).toBeVisible();
    expect(screen.getByLabelText(/name/i)).toHaveValue("");
  });
});
