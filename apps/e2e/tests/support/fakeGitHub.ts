import { getFakeGitHubURL } from "../constants";

export type RecordedStatus = {
  repo: string;
  sha: string;
  token: string;
  accepted: boolean;
  state: string;
  context: string;
  description: string;
};

export type FakeGitHub = {
  statuses: (sha: string) => Promise<RecordedStatus[]>;
  setInstallation: (installation: {
    installedOn?: string;
    permissions?: Record<string, string>;
  }) => Promise<void>;
  revokeTokens: () => Promise<void>;
  reset: () => Promise<void>;
};

const call = async (method: string, path: string, body?: unknown): Promise<Response> => {
  const response = await fetch(`${getFakeGitHubURL()}/_fake${path}`, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`fake GitHub responded with ${response.status} to ${method} ${path}`);
  }
  return response;
};

// Controls the fake GitHub the stack runs with the `github-app` compose profile.
export const fakeGitHub: FakeGitHub = {
  statuses: async (sha) =>
    (await call("GET", `/statuses?sha=${sha}`)).json() as Promise<RecordedStatus[]>,
  setInstallation: async (installation) => {
    await call("PUT", "/installation", installation);
  },
  revokeTokens: async () => {
    await call("POST", "/revoke-tokens");
  },
  reset: async () => {
    await call("POST", "/reset");
  },
};
