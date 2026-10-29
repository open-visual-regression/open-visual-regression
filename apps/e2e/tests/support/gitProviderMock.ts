import type { FakeGithubFailure, FakeGithubRequests } from "@ovr/mocks/handlers/github";

// Talks to the mock-git-providers compose service from the specs.
const MOCK_URL = process.env.OVR_E2E_GIT_PROVIDERS_URL ?? "http://localhost:8090";

const ensureOk = (response: Response, path: string): Response => {
  if (!response.ok) {
    throw new Error(`mock git providers ${path} responded with ${response.status}`);
  }
  return response;
};

const post = async (path: string, body?: unknown) =>
  ensureOk(
    await fetch(`${MOCK_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }),
    path,
  );

export type GitProviderMock = {
  reset: () => Promise<void>;
  requests: () => Promise<FakeGithubRequests>;
  failNext: (failure: FakeGithubFailure) => Promise<void>;
};

export const gitProviderMock: GitProviderMock = {
  reset: async () => {
    await post("/__fake/reset");
  },
  requests: async () =>
    (await ensureOk(
      await fetch(`${MOCK_URL}/__fake/requests`),
      "/__fake/requests",
    ).json()) as FakeGithubRequests,
  failNext: async (failure) => {
    await post("/__fake/fail-next", failure);
  },
};
