import { signAppJwt } from "../githubApp/jwt";
import { decodeJwt } from "./fakeGitHub";
import { describe, expect, test } from "./fixtures";

describe("signAppJwt", () => {
  test("signs an RS256 JWT issued by the App, backdated and valid for under 10 minutes", ({
    githubApp,
  }) => {
    const now = Date.UTC(2026, 0, 1, 12, 0, 0);

    const { valid, header, claims } = decodeJwt(signAppJwt(githubApp, now), githubApp);

    expect(valid).toBe(true);
    expect(header).toEqual({ alg: "RS256", typ: "JWT" });
    expect(claims).toEqual({ iat: now / 1000 - 60, exp: now / 1000 + 540, iss: "1234" });
  });
});
