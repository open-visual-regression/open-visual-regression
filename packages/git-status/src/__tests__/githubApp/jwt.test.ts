import { verify } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createAppJwt } from "../../githubApp/jwt";
import { TEST_PRIVATE_KEY, TEST_PUBLIC_KEY } from "./testKeys";

const config = { clientId: "Iv23liExample", privateKey: TEST_PRIVATE_KEY };
const NOW = Date.UTC(2026, 9, 29, 12, 0, 0);

const decode = (segment: string) =>
  JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as Record<string, unknown>;

describe("createAppJwt", () => {
  it("signs with RS256 and the app's private key", () => {
    const [header, payload, signature] = createAppJwt(config, NOW).split(".");

    expect(decode(header!)).toEqual({ alg: "RS256", typ: "JWT" });
    expect(
      verify(
        "RSA-SHA256",
        Buffer.from(`${header}.${payload}`),
        TEST_PUBLIC_KEY,
        Buffer.from(signature!, "base64url"),
      ),
    ).toBe(true);
  });

  it("issues as the client id, backdated for clock drift, expiring within 10 minutes", () => {
    const [, payload] = createAppJwt(config, NOW).split(".");
    const nowSeconds = NOW / 1000;

    expect(decode(payload!)).toEqual({
      iss: "Iv23liExample",
      iat: nowSeconds - 60,
      exp: nowSeconds + 540,
    });
  });
});
