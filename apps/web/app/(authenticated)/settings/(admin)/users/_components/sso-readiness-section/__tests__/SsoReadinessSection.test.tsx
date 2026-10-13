import { useRouter } from "next/navigation";
import { vi } from "vitest";

import type { SsoReadinessRowSchema } from "@ovr/api/contracts/users";
import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { describe, expect, it, render, screen, within } from "@/test-utils";

import { SsoReadinessSection } from "../SsoReadinessSection";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockConfirm = vi.mocked(serverClient.users.confirmSsoMatch);
const mockRefresh = vi.mocked(useRouter)().refresh;

const jane = { id: "user-1", name: "Jane Doe", email: "jane@example.com", role: "reviewer" };

const identity = {
  id: "identity-1",
  email: "jane@example.com",
  name: "Jane Doe",
  role: "reviewer",
  lastSeenAt: "2026-10-02T12:00:00.000Z",
};

const renderComponent = (rows: SsoReadinessRowSchema[]) =>
  render(
    <>
      <SsoReadinessSection rows={rows} />
      <Toaster />
    </>,
  );

describe("SsoReadinessSection", () => {
  it.each<[string, SsoReadinessRowSchema]>([
    ["not seen", { identity: null, user: jane, match: "none" }],
    ["no access", { identity: { ...identity, role: null }, user: jane, match: "confirmed" }],
    ["new user", { identity, user: null, match: "none" }],
    ["unconfirmed", { identity, user: jane, match: "email" }],
    ["role changes", { identity: { ...identity, role: "viewer" }, user: jane, match: "confirmed" }],
    ["ready", { identity, user: jane, match: "confirmed" }],
  ])("should mark the row as %s", (status, row) => {
    renderComponent([row]);

    const [, dataRow] = screen.getAllByRole("row");
    expect(within(dataRow!).getByText(status)).toBeVisible();
  });

  it("should confirm a suggested match", async ({ user }) => {
    mockConfirm.mockResolvedValue([null, undefined]);
    renderComponent([{ identity, user: jane, match: "email" }]);

    await user.click(screen.getByRole("button", { name: "confirm match for Jane Doe" }));

    expect(mockConfirm).toHaveBeenCalledWith({ identityId: "identity-1", userId: "user-1" });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should only offer to confirm suggested matches", () => {
    renderComponent([{ identity, user: jane, match: "confirmed" }]);

    expect(screen.queryByRole("button", { name: /confirm match/i })).not.toBeInTheDocument();
  });
});
