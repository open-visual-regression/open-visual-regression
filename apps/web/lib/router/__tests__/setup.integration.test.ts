// @vitest-environment node

import { beforeEach, describe, expect, vi } from "vitest";

import { mocks } from "@ovr/mocks";
import * as schema from "@ovr/db/schema";

import { router } from "@/lib/router";
import { auth } from "@/lib/auth/auth";

import { test, truncateAll } from "./fixtures/dbFixture";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/auth/auth");

const mockSignUpEmail = vi.mocked(auth.api.signUpEmail);
const mockCreateOrganization = vi.mocked(auth.api.createOrganization);

beforeEach(async () => {
  const { headers } = await import("next/headers");
  vi.mocked(headers).mockResolvedValue(new Headers() as never);
  await truncateAll();
});

describe("setup.status", () => {
  test("returns pending when DB is empty", async () => {
    const [error, result] = await router.setup.status();
    expect(error).toBeNull();
    expect(result?.status).toBe("pending");
  }, 30_000);

  test("returns pending when only users exist", async ({ dbCtx }) => {
    await dbCtx.db.insert(schema.user).values(mocks.user.generateUser());

    const [error, result] = await router.setup.status();
    expect(error).toBeNull();
    expect(result?.status).toBe("pending");
  }, 30_000);

  test("returns pending when only orgs exist", async ({ dbCtx }) => {
    await dbCtx.db.insert(schema.organization).values(mocks.organization.generateOrganization());

    const [error, result] = await router.setup.status();
    expect(error).toBeNull();
    expect(result?.status).toBe("pending");
  }, 30_000);

  test("returns completed when both users and orgs exist", async ({ dbCtx }) => {
    await dbCtx.db.insert(schema.user).values(mocks.user.generateUser());
    await dbCtx.db.insert(schema.organization).values(mocks.organization.generateOrganization());

    const [error, result] = await router.setup.status();
    expect(error).toBeNull();
    expect(result?.status).toBe("completed");
  }, 30_000);
});

describe("setup.exec", () => {
  const input = {
    organizationName: "My Test Org",
    name: "Test User",
    email: "test@example.com",
    password: "securepass123",
  };

  test("calls signUpEmail then createOrganization with correct args", async () => {
    const user = mocks.user.generateUser();
    mockSignUpEmail.mockResolvedValue({ token: "test-token", user });
    mockCreateOrganization.mockResolvedValue({
      ...mocks.organization.generateOrganization(),
      members: [],
    });

    const [error] = await router.setup.exec(input);
    expect(error).toBeNull();

    expect(mockSignUpEmail).toHaveBeenCalledWith({
      body: { name: input.name, email: input.email, password: input.password },
    });

    expect(mockCreateOrganization).toHaveBeenCalledWith({
      body: { name: input.organizationName, slug: "my-test-org", userId: user.id },
    });
  }, 30_000);

  test("generates slug from org name with spaces and special chars", async () => {
    const user = mocks.user.generateUser();
    mockSignUpEmail.mockResolvedValue({ token: "test-token", user });
    mockCreateOrganization.mockResolvedValue({
      ...mocks.organization.generateOrganization(),
      members: [],
    });

    await router.setup.exec({ ...input, organizationName: "Tom Fischer's Org & Co!" });

    expect(mockCreateOrganization).toHaveBeenCalledWith({
      body: expect.objectContaining({ slug: "tom-fischers-org--co" }),
    });
  }, 30_000);

  test("returns INTERNAL_SERVER_ERROR when signUpEmail returns no user", async () => {
    mockSignUpEmail.mockResolvedValue(null as never);

    const [error] = await router.setup.exec(input);
    expect(error?.message).toBe("Failed to sign up user");
    expect(mockCreateOrganization).not.toHaveBeenCalled();
  }, 30_000);
});
