import { randomBytes } from "node:crypto";

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import type { IntegrationCredentials } from "../credentials";
import { encryptToken } from "../crypto";
import { verifyIntegration } from "../verifyIntegration";
import { server } from "./setup";

const integration = (encryptedToken: string | null): IntegrationCredentials => ({
  provider: "github",
  repoIdentifier: "acme/web",
  credentialType: "access_token",
  encryptedToken,
  connectionId: null,
  externalRepoId: null,
});

describe("verifyIntegration", () => {
  it("checks the token through the integration's provider", async () => {
    vi.stubEnv("OVR_GIT_TOKEN_ENCRYPTION_KEY", randomBytes(32).toString("base64"));
    server.use(
      http.get("https://api.github.com/repos/acme/web", ({ request }) =>
        request.headers.get("authorization") === "Bearer ghp_secret"
          ? HttpResponse.json({ permissions: { push: true } })
          : new HttpResponse(null, { status: 401 }),
      ),
    );

    expect(await verifyIntegration(integration(encryptToken("ghp_secret")))).toEqual({
      ok: true,
      httpStatus: 200,
      error: null,
    });
  });

  it("explains why there is no credential to check", async () => {
    expect(await verifyIntegration(integration(null))).toEqual({
      ok: false,
      httpStatus: null,
      error: "no access token is stored, enter one",
    });
  });
});
