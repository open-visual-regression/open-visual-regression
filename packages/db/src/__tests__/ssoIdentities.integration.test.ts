import { dbClient } from "../client";
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
});
