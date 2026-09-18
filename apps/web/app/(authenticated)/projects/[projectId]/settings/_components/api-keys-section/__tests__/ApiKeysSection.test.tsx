import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { serverClient } from "@/lib/router";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { ApiKeysSection } from "../ApiKeysSection";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockCreate = vi.mocked(serverClient.apiKeys.create);
const mockRefresh = vi.mocked(useRouter)().refresh;

const PROJECT_ID = "test-project-id";
const API_KEY = "ovr_api_key_3f9a8c2b1d0e4f5a6b7c8d9e0f1a2b3c";

describe("ApiKeysSection", () => {
  it("should create the first api key from the empty state", async ({ user }) => {
    mockCreate.mockResolvedValue([null, { key: API_KEY }]);
    render(<ApiKeysSection projectId={PROJECT_ID} apiKeys={[]} />);

    await user.click(screen.getByRole("button", { name: /create first api key/i }));
    await user.type(screen.getByLabelText(/name/i), "ci · github actions");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    expect(await screen.findByRole("heading", { name: /api key created/i })).toBeVisible();
    expect(screen.getByText(API_KEY)).toBeVisible();
    expect(mockCreate).toHaveBeenCalledWith({ projectId: PROJECT_ID, name: "ci · github actions" });
  });

  it("should keep the api key on screen when the first key replaces the empty state", async ({
    user,
  }) => {
    mockCreate.mockResolvedValue([null, { key: API_KEY }]);
    const { rerender } = render(<ApiKeysSection projectId={PROJECT_ID} apiKeys={[]} />);

    await user.click(screen.getByRole("button", { name: /create first api key/i }));
    await user.type(screen.getByLabelText(/name/i), "ci · github actions");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    expect(await screen.findByText(API_KEY)).toBeVisible();

    rerender(
      <ApiKeysSection
        projectId={PROJECT_ID}
        apiKeys={[mocks.apiKey.generateApiKey({ name: "ci · github actions" })]}
      />,
    );

    expect(screen.getByRole("heading", { name: /api key created/i })).toBeVisible();
    expect(screen.getByText(API_KEY)).toBeVisible();
    expect(mockRefresh).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^done$/i }));

    expect(screen.queryByText(API_KEY)).not.toBeInTheDocument();
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should create another api key from the header button", async ({ user }) => {
    mockCreate.mockResolvedValue([null, { key: API_KEY }]);
    render(<ApiKeysSection projectId={PROJECT_ID} apiKeys={[mocks.apiKey.generateApiKey()]} />);

    await user.click(screen.getByRole("button", { name: /new api key/i }));
    await user.type(screen.getByLabelText(/name/i), "local dev");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    expect(await screen.findByText(API_KEY)).toBeVisible();
    expect(mockCreate).toHaveBeenCalledWith({ projectId: PROJECT_ID, name: "local dev" });
  });
});
