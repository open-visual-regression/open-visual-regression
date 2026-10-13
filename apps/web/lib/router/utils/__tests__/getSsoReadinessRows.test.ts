import type { SsoIdentityDbSchema } from "@ovr/db/repository/ssoIdentities";

import { describe, expect, it } from "@/test-utils";

import { getSsoReadinessRows } from "../ssoReadiness";

const jane = { id: "user-1", name: "Jane Doe", email: "jane@example.com", role: "reviewer" };
const sam = { id: "user-2", name: "Sam Lee", email: "sam@example.com", role: "admin" };

const createIdentity = (overrides: Partial<SsoIdentityDbSchema> = {}): SsoIdentityDbSchema => ({
  id: "identity-1",
  issuer: "https://example.okta.com",
  subject: "00u1",
  email: "jane@example.com",
  name: "Jane Doe",
  role: "reviewer",
  userId: null,
  firstSeenAt: "2026-10-01T12:00:00.000Z",
  lastSeenAt: "2026-10-02T12:00:00.000Z",
  ...overrides,
});

describe("getSsoReadinessRows", () => {
  it("should suggest the member with the same email", () => {
    const [row] = getSsoReadinessRows([jane], [createIdentity({ email: "Jane@Example.com" })]);

    expect(row).toMatchObject({ user: jane, match: "email" });
  });

  it("should prefer the confirmed member over an email match", () => {
    const [row] = getSsoReadinessRows([jane, sam], [createIdentity({ userId: sam.id })]);

    expect(row).toMatchObject({ user: sam, match: "confirmed" });
  });

  it("should leave an identity unmatched when no member has its email", () => {
    const [row] = getSsoReadinessRows([], [createIdentity()]);

    expect(row).toMatchObject({ user: null, match: "none" });
  });

  it("should list members no identity matched", () => {
    const rows = getSsoReadinessRows([jane, sam], [createIdentity()]);

    expect(rows).toEqual([
      expect.objectContaining({ user: jane, match: "email" }),
      { identity: null, user: sam, match: "none" },
    ]);
  });
});
