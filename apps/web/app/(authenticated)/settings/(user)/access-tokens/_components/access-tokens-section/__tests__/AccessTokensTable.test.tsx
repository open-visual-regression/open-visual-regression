import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { formatDateTime } from "@/lib/utils/date";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { AccessTokensTable } from "../AccessTokensTable";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockRevoke = vi.mocked(serverClient.accessTokens.revoke);
const mockRefresh = vi.mocked(useRouter)().refresh;

describe("AccessTokensTable", () => {
  it("should show a never-used indicator when the token has not been used", () => {
    const accessToken = mocks.accessToken.generateAccessToken({ lastRequest: null });
    render(<AccessTokensTable data={[accessToken]} />);

    expect(screen.getByRole("cell", { name: "never" })).toBeVisible();
  });

  it("should show the last used date when the token has been used", () => {
    const lastRequest = new Date("2026-05-01T12:00:00Z");
    const accessToken = mocks.accessToken.generateAccessToken({ lastRequest });
    render(<AccessTokensTable data={[accessToken]} />);

    expect(screen.getByRole("cell", { name: formatDateTime(lastRequest) })).toBeVisible();
    expect(screen.queryByRole("cell", { name: "never" })).not.toBeInTheDocument();
  });

  it("should revoke the access token when confirmed", async ({ user }) => {
    mockRevoke.mockResolvedValue([null, undefined]);
    const accessToken = mocks.accessToken.generateAccessToken({ name: "cursor" });
    render(<AccessTokensTable data={[accessToken]} />);

    await user.click(screen.getByRole("button", { name: /revoke cursor/i }));

    expect(
      await screen.findByRole("alertdialog", { name: /revoke access token\?/i }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: /^revoke$/i }));

    expect(mockRevoke).toHaveBeenCalledWith({ tokenId: accessToken.id });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.queryByRole("alertdialog", { name: /revoke access token\?/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it("should close the confirmation dialog when cancelled", async ({ user }) => {
    const accessToken = mocks.accessToken.generateAccessToken({ name: "claude" });
    render(<AccessTokensTable data={[accessToken]} />);

    await user.click(screen.getByRole("button", { name: /revoke claude/i }));
    expect(
      await screen.findByRole("alertdialog", { name: /revoke access token\?/i }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole("alertdialog", { name: /revoke access token\?/i }),
      ).not.toBeInTheDocument(),
    );
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it("should show an error if revoking fails", async ({ user }) => {
    mockRevoke.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    const accessToken = mocks.accessToken.generateAccessToken({ name: "cursor" });
    render(<AccessTokensTable data={[accessToken]} />);

    await user.click(screen.getByRole("button", { name: /revoke cursor/i }));
    await user.click(screen.getByRole("button", { name: /^revoke$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("INTERNAL_SERVER_ERROR");
    expect(screen.getByRole("alertdialog", { name: /revoke access token\?/i })).toBeVisible();
  });
});
