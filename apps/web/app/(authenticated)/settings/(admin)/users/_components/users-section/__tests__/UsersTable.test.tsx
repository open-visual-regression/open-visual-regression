import { describe, expect, it, render, screen } from "@/test-utils";
import { mocks } from "@ovr/mocks";
import { formatDateTime } from "@/lib/utils/date";
import { UsersTable } from "../UsersTable";

describe("UsersTable", () => {
  it("should render a row for each user", () => {
    const admin = mocks.user.generateUser({ name: "ari shapiro", role: "admin" });
    const user = mocks.user.generateUser({ name: "sam chen", role: "user" });
    render(<UsersTable data={[admin, user]} />);

    expect(screen.getByRole("cell", { name: admin.name })).toBeVisible();
    expect(screen.getByRole("cell", { name: user.name })).toBeVisible();
  });

  it("should show the role for each user", () => {
    const admin = mocks.user.generateUser({ role: "admin" });
    const user = mocks.user.generateUser({ role: "user" });
    render(<UsersTable data={[admin, user]} />);

    expect(screen.getByRole("cell", { name: "admin" })).toBeVisible();
    expect(screen.getByRole("cell", { name: "user" })).toBeVisible();
  });

  it("should treat a null role as a regular user", () => {
    const user = mocks.user.generateUser({ role: null });
    render(<UsersTable data={[user]} />);

    expect(screen.getByRole("cell", { name: "user" })).toBeVisible();
  });

  it("should show a never-logged-in indicator when there is no last login", () => {
    const user = mocks.user.generateUser({ lastLoginAt: null });
    render(<UsersTable data={[user]} />);

    expect(screen.getByRole("cell", { name: "never" })).toBeVisible();
  });

  it("should show the last login date when available", () => {
    const lastLoginAt = new Date("2026-05-01T12:00:00Z");
    const user = mocks.user.generateUser({ lastLoginAt });
    render(<UsersTable data={[user]} />);

    expect(screen.getByRole("cell", { name: formatDateTime(lastLoginAt) })).toBeVisible();
  });

  it("should show the created date for each user", () => {
    const createdAt = new Date("2026-04-12T08:30:00Z");
    const user = mocks.user.generateUser({ createdAt });
    render(<UsersTable data={[user]} />);

    expect(screen.getByRole("cell", { name: formatDateTime(createdAt) })).toBeVisible();
  });
});
