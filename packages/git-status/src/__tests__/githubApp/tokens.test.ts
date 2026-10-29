import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import {
  clearInstallationTokens,
  getInstallationToken,
  invalidateInstallationToken,
  listRepositoriesForInstallation,
  statusesScope,
} from "../../githubApp/tokens";
import { server } from "../setup";
import { TEST_PRIVATE_KEY } from "./testKeys";

const API = "https://api.github.com";
const config = { clientId: "Iv23liExample", privateKey: TEST_PRIVATE_KEY };
const NOW = Date.UTC(2026, 9, 29, 12);
const ONE_HOUR = 60 * 60 * 1000;

const mintTokens = () => {
  const requests: unknown[] = [];
  server.use(
    http.post(`${API}/app/installations/:installationId/access_tokens`, async ({ request }) => {
      requests.push(await request.json());
      return HttpResponse.json(
        {
          token: `ghs_${requests.length}`,
          expires_at: new Date(NOW + ONE_HOUR).toISOString(),
        },
        { status: 201 },
      );
    }),
  );
  return requests;
};

afterEach(() => {
  clearInstallationTokens();
});

describe("getInstallationToken", () => {
  it("reuses a token until it is close to expiring", async () => {
    const requests = mintTokens();

    expect(await getInstallationToken(config, 42, statusesScope(7), () => NOW)).toBe("ghs_1");
    expect(
      await getInstallationToken(config, 42, statusesScope(7), () => NOW + 50 * 60 * 1000),
    ).toBe("ghs_1");
    expect(
      await getInstallationToken(config, 42, statusesScope(7), () => NOW + 56 * 60 * 1000),
    ).toBe("ghs_2");
    expect(requests).toHaveLength(2);
  });

  it("keeps separate tokens per repository", async () => {
    const requests = mintTokens();

    expect(await getInstallationToken(config, 42, statusesScope(7), () => NOW)).toBe("ghs_1");
    expect(await getInstallationToken(config, 42, statusesScope(8), () => NOW)).toBe("ghs_2");
    expect(requests).toEqual([
      { repository_ids: [7], permissions: { statuses: "write", metadata: "read" } },
      { repository_ids: [8], permissions: { statuses: "write", metadata: "read" } },
    ]);
  });

  it("mints a fresh token after one is invalidated", async () => {
    mintTokens();

    expect(await getInstallationToken(config, 42, statusesScope(7), () => NOW)).toBe("ghs_1");
    invalidateInstallationToken(config, 42, statusesScope(7));
    expect(await getInstallationToken(config, 42, statusesScope(7), () => NOW)).toBe("ghs_2");
  });

  it("does not cache a token github refused to mint", async () => {
    server.use(
      http.post(
        `${API}/app/installations/42/access_tokens`,
        () => new HttpResponse(null, { status: 422 }),
        { once: true },
      ),
    );
    await expect(
      getInstallationToken(config, 42, statusesScope(7), () => NOW),
    ).rejects.toMatchObject({
      status: 422,
    });

    mintTokens();
    expect(await getInstallationToken(config, 42, statusesScope(7), () => NOW)).toBe("ghs_1");
  });
});

describe("listRepositoriesForInstallation", () => {
  it("lists repositories with a metadata-only token", async () => {
    const requests = mintTokens();
    server.use(
      http.get(`${API}/installation/repositories`, () =>
        HttpResponse.json({
          total_count: 1,
          repositories: [{ id: 7, full_name: "acme/web", private: false }],
        }),
      ),
    );

    expect(await listRepositoriesForInstallation(config, 42)).toEqual([
      { id: 7, fullName: "acme/web", private: false },
    ]);
    expect(requests).toEqual([{ permissions: { metadata: "read" } }]);
  });

  it("mints a fresh token when github rejects the cached one", async () => {
    const requests = mintTokens();
    server.use(
      http.get(`${API}/installation/repositories`, ({ request }) =>
        request.headers.get("authorization") === "Bearer ghs_1"
          ? new HttpResponse(null, { status: 401 })
          : HttpResponse.json({ repositories: [{ id: 7, full_name: "acme/web", private: false }] }),
      ),
    );

    expect(await listRepositoriesForInstallation(config, 42)).toEqual([
      { id: 7, fullName: "acme/web", private: false },
    ]);
    expect(requests).toHaveLength(2);
  });
});
