import { vi } from "vitest";

import { describe, expect, it, render, screen, waitFor } from "@/test-utils";
import { router } from "@/lib/router";
import { useRouter } from "next/navigation";
import { createORPCError } from "@/lib/testing/orpc";
import { CreateApiKeyModal } from "../CreateApiKeyModal";
import { CreateApiKeyModalButton } from "../CreateApiKeyModalButton";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockCreate = vi.mocked(router.apiKeys.create);
const mockRefresh = vi.mocked(useRouter)().refresh;

const PROJECT_ID = "test-project-id";
const API_KEY = "ovr_api_key_3f9a8c2b1d0e4f5a6b7c8d9e0f1a2b3c";

const renderComponent = () =>
  render(
    <CreateApiKeyModal
      projectId={PROJECT_ID}
      trigger={<CreateApiKeyModalButton>new api key</CreateApiKeyModalButton>}
    />,
  );

describe("CreateApiKeyModal", () => {
  it("should show a validation error when the name is empty", async ({ user }) => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /new api key/i }));
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    expect(await screen.findByText("you must enter a name")).toBeVisible();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("should create an api key, show it in a reveal view, and refresh the table", async ({
    user,
  }) => {
    mockCreate.mockResolvedValue([null, { key: API_KEY }]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /new api key/i }));
    await user.type(screen.getByLabelText(/name/i), "ci · github actions");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    expect(await screen.findByRole("heading", { name: /api key created/i })).toBeVisible();
    expect(screen.getByText(API_KEY)).toBeVisible();
    expect(mockCreate).toHaveBeenCalledWith({ projectId: PROJECT_ID, name: "ci · github actions" });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should copy the api key to clipboard", async ({ user }) => {
    mockCreate.mockResolvedValue([null, { key: API_KEY }]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /new api key/i }));
    await user.type(screen.getByLabelText(/name/i), "local dev");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await user.click(await screen.findByRole("button", { name: /^copy$/i }));

    expect(writeText).toHaveBeenCalledWith(API_KEY);
    expect(await screen.findByRole("button", { name: /^copied$/i })).toBeVisible();
  });

  it("should show an error if api key creation fails", async ({ user }) => {
    mockCreate.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /new api key/i }));
    await user.type(screen.getByLabelText(/name/i), "ci · github actions");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("INTERNAL_SERVER_ERROR");
  });

  it("should disable the submit button while creating", async ({ user }) => {
    mockCreate.mockReturnValue(new Promise(() => {}));
    renderComponent();

    await user.click(screen.getByRole("button", { name: /new api key/i }));
    await user.type(screen.getByLabelText(/name/i), "ci · github actions");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled());
  });

  it("should show the create form again after closing and reopening the reveal view", async ({
    user,
  }) => {
    mockCreate.mockResolvedValue([null, { key: API_KEY }]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /new api key/i }));
    await user.type(screen.getByLabelText(/name/i), "ci · github actions");
    await user.click(screen.getByRole("button", { name: /^create$/i }));
    await user.click(await screen.findByRole("button", { name: /^done$/i }));

    await user.click(screen.getByRole("button", { name: /new api key/i }));

    expect(await screen.findByRole("heading", { name: /^new api key$/i })).toBeVisible();
    expect(screen.getByLabelText(/name/i)).toHaveValue("");
  });
});
