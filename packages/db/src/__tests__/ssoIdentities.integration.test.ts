import { v7 as uuidv7 } from "uuid";

import { dbClient } from "../client";
import { db } from "../db";
import { account } from "../schema";
import { describe, expect, test } from "./fixtures";

const identity = {
  issuer: "https://example.okta.com",
  subject: "00u1",
  email: "jane@example.com",
  name: "Jane Doe",
  role: "reviewer",
};

describe("ssoIdentities", () => {
  describe("find", () => {
    test("should return undefined for an identity that has never been seen", async () => {
      expect(await dbClient.ssoIdentities.find(identity)).toBeUndefined();
    });
  });

  describe("record", () => {
    test("should store a newly seen identity", async () => {
      await dbClient.ssoIdentities.record(identity);

      expect(await dbClient.ssoIdentities.find(identity)).toMatchObject({
        ...identity,
        userId: null,
      });
    });

    test("should update an identity that is seen again", async () => {
      const first = await dbClient.ssoIdentities.record(identity);

      await dbClient.ssoIdentities.record({
        ...identity,
        email: "jane.doe@example.com",
        role: null,
      });

      expect(await dbClient.ssoIdentities.find(identity)).toMatchObject({
        id: first?.id,
        email: "jane.doe@example.com",
        role: null,
        firstSeenAt: first?.firstSeenAt,
      });
    });

    test("should keep identities from different issuers apart", async () => {
      await dbClient.ssoIdentities.record(identity);
      await dbClient.ssoIdentities.record({ ...identity, issuer: "https://other.okta.com" });

      const [first, second] = await Promise.all([
        dbClient.ssoIdentities.find(identity),
        dbClient.ssoIdentities.find({ ...identity, issuer: "https://other.okta.com" }),
      ]);
      expect(first?.id).not.toBe(second?.id);
    });
  });

  describe("findAll", () => {
    test("should return every identity ordered by email", async () => {
      await dbClient.ssoIdentities.record({
        ...identity,
        subject: "00u2",
        email: "zoe@example.com",
      });
      await dbClient.ssoIdentities.record(identity);

      const identities = await dbClient.ssoIdentities.findAll();

      expect(identities.map(({ email }) => email)).toEqual(["jane@example.com", "zoe@example.com"]);
    });
  });

  describe("confirmUser", () => {
    test("should link the identity to the confirmed user", async ({ user }) => {
      const recorded = await dbClient.ssoIdentities.record(identity);

      await dbClient.ssoIdentities.confirmUser({ id: recorded!.id, userId: user.id });

      expect(await dbClient.ssoIdentities.findById(recorded!.id)).toMatchObject({
        userId: user.id,
      });
    });

    test("should keep the confirmed user when the identity is seen again", async ({ user }) => {
      const recorded = await dbClient.ssoIdentities.record(identity);
      await dbClient.ssoIdentities.confirmUser({ id: recorded!.id, userId: user.id });

      await dbClient.ssoIdentities.record(identity);

      expect(await dbClient.ssoIdentities.find(identity)).toMatchObject({ userId: user.id });
    });
  });

  describe("findByUserId", () => {
    test("should return the identity linked to the user's account", async ({ user }) => {
      await db.insert(account).values({
        id: uuidv7(),
        issuer: identity.issuer,
        accountId: identity.subject,
        providerId: "trusted-proxy",
        userId: user.id,
        updatedAt: new Date(),
      });
      await dbClient.ssoIdentities.record(identity);
      await dbClient.ssoIdentities.record({
        ...identity,
        subject: "00u2",
        email: "zoe@example.com",
      });

      expect(await dbClient.ssoIdentities.findByUserId(user.id)).toMatchObject({
        subject: identity.subject,
        email: identity.email,
      });
    });

    test("should return undefined for a user with no linked identity", async ({ user }) => {
      await dbClient.ssoIdentities.record(identity);

      expect(await dbClient.ssoIdentities.findByUserId(user.id)).toBeUndefined();
    });
  });
});
