import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { serverClient } from "@/lib/router";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { UsersSection } from "../UsersSection";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockRemove = vi.mocked(serverClient.users.remove);
const mockRefresh = vi.mocked(useRouter)().refresh;

const CURRENT_USER_ID = "current-user-id";

describe("UsersSection", () => {
  it("should show a search field for users", () => {
    render(<UsersSection users={[]} currentUserId={CURRENT_USER_ID} />);

    expect(screen.getByLabelText("search users")).toBeVisible();
  });

  it("should show an empty state when there are no users", () => {
    render(<UsersSection users={[]} currentUserId={CURRENT_USER_ID} />);

    expect(screen.getByRole("cell", { name: "no users found" })).toBeVisible();
  });

  it("should show a search-specific empty state when a search has no results", () => {
    render(<UsersSection users={[]} currentUserId={CURRENT_USER_ID} search="ari" />);

    expect(screen.getByRole("cell", { name: 'no users found matching "ari"' })).toBeVisible();
  });

  it("should render a row for each user", () => {
    const admin = mocks.user.generateUser({ name: "ari shapiro", role: "admin" });
    const user = mocks.user.generateUser({ name: "sam chen", role: "user" });
    render(<UsersSection users={[admin, user]} currentUserId={CURRENT_USER_ID} />);

    expect(screen.getByRole("cell", { name: admin.name })).toBeVisible();
    expect(screen.getByRole("cell", { name: user.name })).toBeVisible();
  });

  it("should show the role for each user", () => {
    const admin = mocks.user.generateUser({ name: "ari shapiro", role: "admin" });
    const user = mocks.user.generateUser({ name: "sam chen", role: "user" });
    render(<UsersSection users={[admin, user]} currentUserId={CURRENT_USER_ID} />);

    expect(screen.getByRole("button", { name: "change role for ari shapiro" })).toHaveTextContent(
      "admin",
    );
    expect(screen.getByRole("button", { name: "change role for sam chen" })).toHaveTextContent(
      "user",
    );
  });

  it("should treat a null role as a regular user", () => {
    const user = mocks.user.generateUser({ name: "sam chen", role: null });
    render(<UsersSection users={[user]} currentUserId={CURRENT_USER_ID} />);

    expect(screen.getByRole("button", { name: "change role for sam chen" })).toHaveTextContent(
      "user",
    );
  });

  it("should render a role switcher for other active users", () => {
    const user = mocks.user.generateUser({ name: "sam chen", status: "active" });
    render(<UsersSection users={[user]} currentUserId={CURRENT_USER_ID} />);

    expect(screen.getByRole("button", { name: "change role for sam chen" })).toBeVisible();
  });

  it("should not render a role switcher for your own row", () => {
    const admin = mocks.user.generateUser({ name: "ari shapiro", role: "admin", status: "active" });
    render(<UsersSection users={[admin]} currentUserId={admin.id} />);

    expect(
      screen.queryByRole("button", { name: `change role for ${admin.name}` }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "admin" })).toBeVisible();
  });

  it("should not render a role switcher for invited users", () => {
    const invited = mocks.user.generateUser({ name: "kira vance", status: "invited" });
    render(<UsersSection users={[invited]} currentUserId={CURRENT_USER_ID} />);

    expect(
      screen.queryByRole("button", { name: `change role for ${invited.name}` }),
    ).not.toBeInTheDocument();
  });

  it("should show an active status badge for active users", () => {
    const user = mocks.user.generateUser({ status: "active" });
    render(<UsersSection users={[user]} currentUserId={CURRENT_USER_ID} />);

    expect(screen.getByRole("cell", { name: "active" })).toBeVisible();
  });

  it("should show an invited status badge for invited users", () => {
    const user = mocks.user.generateUser({ status: "invited" });
    render(<UsersSection users={[user]} currentUserId={CURRENT_USER_ID} />);

    expect(screen.getByRole("cell", { name: "invited" })).toBeVisible();
  });

  it("should not show a copy invite button for active users", () => {
    const user = mocks.user.generateUser({ status: "active" });
    render(<UsersSection users={[user]} currentUserId={CURRENT_USER_ID} />);

    expect(screen.queryByRole("button", { name: /copy invite/i })).not.toBeInTheDocument();
  });

  it("should copy the invitation link to clipboard when clicked", async ({ user }) => {
    const invitationUrl = "http://localhost:3000/invitations/test-invitation-id";
    const invitedUser = mocks.user.generateUser({ status: "invited", invitationUrl });
    render(<UsersSection users={[invitedUser]} currentUserId={CURRENT_USER_ID} />);

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await user.click(screen.getByRole("button", { name: /copy invite/i }));

    expect(writeText).toHaveBeenCalledWith(invitationUrl);
    expect(await screen.findByRole("button", { name: /^copied$/i })).toBeVisible();
  });

  it("should not allow selecting your own row", () => {
    const admin = mocks.user.generateUser({ name: "ari shapiro" });
    const user = mocks.user.generateUser({ name: "sam chen" });
    render(<UsersSection users={[admin, user]} currentUserId={admin.id} />);

    expect(
      screen.queryByRole("checkbox", { name: `select ${admin.name}` }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: `select ${user.name}` })).toBeVisible();
  });

  it("should remove selected users when confirmed", async ({ user }) => {
    mockRemove.mockResolvedValue([null, undefined]);
    const activeUser = mocks.user.generateUser({ name: "sam chen", status: "active" });
    render(<UsersSection users={[activeUser]} currentUserId={CURRENT_USER_ID} />);

    await user.click(screen.getByRole("checkbox", { name: `select ${activeUser.name}` }));
    expect(screen.getByText("1 user selected")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /^remove$/i }));
    expect(await screen.findByRole("alertdialog", { name: /remove 1 user\?/i })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /^remove$/i }));

    expect(mockRemove).toHaveBeenCalledWith({
      users: [{ status: "active", email: activeUser.email }],
    });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText("1 user selected")).not.toBeInTheDocument());
  });
});
