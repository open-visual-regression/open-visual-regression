// Controls the fake GitHub API the GitHub App suite runs against (apps/e2e/github).
const FAKE_GITHUB_URL = process.env.OVR_E2E_GITHUB_URL ?? "http://localhost:8090";

export type TokenRequest = {
  repository_ids?: number[];
  permissions?: Record<string, string>;
};

export type ReceivedStatus = {
  repository: string;
  sha: string;
  token: string;
  state: string;
  context: string;
  description: string;
  target_url: string;
};

export type ReceivedRequests = {
  tokenRequests: TokenRequest[];
  statuses: ReceivedStatus[];
};

const ensureOk = (response: Response, path: string): Response => {
  if (!response.ok) {
    throw new Error(`fake github ${path} responded with ${response.status}`);
  }
  return response;
};

const get = async (path: string): Promise<Response> =>
  ensureOk(await fetch(`${FAKE_GITHUB_URL}${path}`), path);

const post = async (path: string, body?: unknown): Promise<Response> =>
  ensureOk(
    await fetch(`${FAKE_GITHUB_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }),
    path,
  );

export const fakeGithub = {
  reset: async () => {
    await post("/__reset");
  },
  requests: async (): Promise<ReceivedRequests> =>
    (await (await get("/__requests")).json()) as ReceivedRequests,
  failNext: async (method: "GET" | "POST", path: string, status: number) => {
    await post("/__fail-next", { method, path, status });
  },
};
