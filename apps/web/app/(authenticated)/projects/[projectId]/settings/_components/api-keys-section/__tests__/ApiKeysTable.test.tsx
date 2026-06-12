import { vi } from "vitest";

import { describe, expect, it, render, screen, waitFor } from "@/test-utils";
import { serverClient } from "@/lib/router";
import { useRouter } from "next/navigation";
import { mocks } from "@ovr/mocks";
import { createORPCError } from "@/lib/testing/orpc";
import { formatDateTime } from "@/lib/utils/date";
import { ApiKeysTable } from "../ApiKeysTable";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockRevoke = vi.mocked(serverClient.apiKeys.revoke);
const mockRefresh = vi.mocked(useRouter)().refresh;

describe("ApiKeysTable", () => {
  it("should show a never-used indicator when the key has not been used", () => {
    const apiKey = mocks.apiKey.generateApiKey({ lastRequest: null });
    render(<ApiKeysTable data={[apiKey]} />);

    expect(screen.getByRole("cell", { name: "never" })).toBeVisible();
  });

  it("should show the last used date when the key has been used", () => {
    const lastRequest = new Date("2026-05-01T12:00:00Z");
    const apiKey = mocks.apiKey.generateApiKey({ lastRequest });
    render(<ApiKeysTable data={[apiKey]} />);

    expect(screen.getByRole("cell", { name: formatDateTime(lastRequest) })).toBeVisible();
    expect(screen.queryByRole("cell", { name: "never" })).not.toBeInTheDocument();
  });

  it("should revoke the api key when confirmed", async ({ user }) => {
    mockRevoke.mockResolvedValue([null, undefined]);
    const apiKey = mocks.apiKey.generateApiKey({ name: "ci · github actions" });
    render(<ApiKeysTable data={[apiKey]} />);

    await user.click(screen.getByRole("button", { name: /revoke ci · github actions/i }));

    expect(await screen.findByRole("alertdialog", { name: /revoke api key\?/i })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /^revoke$/i }));

    expect(mockRevoke).toHaveBeenCalledWith({ keyId: apiKey.id });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.queryByRole("alertdialog", { name: /revoke api key\?/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it("should close the confirmation dialog when cancelled", async ({ user }) => {
    const apiKey = mocks.apiKey.generateApiKey({ name: "local dev" });
    render(<ApiKeysTable data={[apiKey]} />);

    await user.click(screen.getByRole("button", { name: /revoke local dev/i }));
    expect(await screen.findByRole("alertdialog", { name: /revoke api key\?/i })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole("alertdialog", { name: /revoke api key\?/i }),
      ).not.toBeInTheDocument(),
    );
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it("should show an error if revoking fails", async ({ user }) => {
    mockRevoke.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    const apiKey = mocks.apiKey.generateApiKey({ name: "staging deploy" });
    render(<ApiKeysTable data={[apiKey]} />);

    await user.click(screen.getByRole("button", { name: /revoke staging deploy/i }));
    await user.click(screen.getByRole("button", { name: /^revoke$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("INTERNAL_SERVER_ERROR");
    expect(screen.getByRole("alertdialog", { name: /revoke api key\?/i })).toBeVisible();
  });
});
