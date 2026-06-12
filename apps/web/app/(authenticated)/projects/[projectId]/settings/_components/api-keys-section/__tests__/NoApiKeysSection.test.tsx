import { vi } from "vitest";

import { describe, expect, it, render, screen, waitFor } from "@/test-utils";
import { serverClient } from "@/lib/router";
import { useRouter } from "next/navigation";
import { NoApiKeysSection } from "../NoApiKeysSection";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockCreate = vi.mocked(serverClient.apiKeys.create);
const mockRefresh = vi.mocked(useRouter)().refresh;

const PROJECT_ID = "test-project-id";
const API_KEY = "ovr_api_key_3f9a8c2b1d0e4f5a6b7c8d9e0f1a2b3c";

describe("NoApiKeysSection", () => {
  it("should create an api key and show it in the reveal view", async ({ user }) => {
    mockCreate.mockResolvedValue([null, { key: API_KEY }]);
    render(<NoApiKeysSection projectId={PROJECT_ID} />);

    await user.click(screen.getByRole("button", { name: /create first api key/i }));
    await user.type(screen.getByLabelText(/name/i), "ci · github actions");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    expect(await screen.findByRole("heading", { name: /api key created/i })).toBeVisible();
    expect(screen.getByText(API_KEY)).toBeVisible();
    expect(mockCreate).toHaveBeenCalledWith({ projectId: PROJECT_ID, name: "ci · github actions" });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });
});
