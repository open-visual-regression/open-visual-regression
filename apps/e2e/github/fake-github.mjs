// A stand-in for the slice of the GitHub REST API OVR's GitHub App support calls, so the
// E2E suite can drive the whole flow without a real app. It checks app JWTs against the
// test public key and only honours installation tokens it minted, scoped the way they
// were requested. The /__ routes let the spec inspect and steer it.
import { createPublicKey, randomBytes, verify } from "node:crypto";
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 8090);
const CLIENT_ID = process.env.FAKE_GITHUB_CLIENT_ID ?? "Iv23liE2E";
const PUBLIC_KEY = createPublicKey(
  Buffer.from(process.env.FAKE_GITHUB_PUBLIC_KEY ?? "", "base64").toString("utf8"),
);

const ACCOUNT = { login: "ovr-e2e-org", type: "Organization" };
const INSTALLATION_ID = 4242;
const REPOSITORIES = [
  { id: 101, full_name: "ovr-e2e-org/web", private: true },
  { id: 102, full_name: "ovr-e2e-org/api", private: false },
];
const PERMISSIONS = { statuses: "write", metadata: "read" };

let state;
const reset = () => {
  state = { tokens: new Map(), tokenRequests: [], statuses: [], failures: [] };
};
reset();

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(body === undefined ? "" : JSON.stringify(body));
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
};

const bearer = (req) => req.headers.authorization?.replace(/^Bearer /, "") ?? "";

const isAppJwt = (token) => {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return false;
  const signed = verify(
    "RSA-SHA256",
    Buffer.from(`${header}.${payload}`),
    PUBLIC_KEY,
    Buffer.from(signature, "base64url"),
  );
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  const now = Math.floor(Date.now() / 1000);
  return signed && claims.iss === CLIENT_ID && claims.exp > now && claims.exp - now <= 600;
};

const installationToken = (req) => {
  const token = state.tokens.get(bearer(req));
  return token && token.expiresAt > Date.now() ? token : null;
};

const reachable = (token, repository) =>
  !token.repositoryIds || token.repositoryIds.includes(repository.id);

const installation = {
  id: INSTALLATION_ID,
  account: ACCOUNT,
  html_url: `https://github.com/organizations/${ACCOUNT.login}/settings/installations/${INSTALLATION_ID}`,
  repository_selection: "selected",
  permissions: PERMISSIONS,
  suspended_at: null,
};

const routes = [
  ["GET", /^\/__health$/, (req, res) => json(res, 200, { ok: true })],
  [
    "GET",
    /^\/__requests$/,
    (req, res) =>
      json(res, 200, { tokenRequests: state.tokenRequests, statuses: state.statuses }),
  ],
  [
    "POST",
    /^\/__reset$/,
    (req, res) => {
      reset();
      json(res, 204);
    },
  ],
  [
    "POST",
    /^\/__fail-next$/,
    async (req, res) => {
      state.failures.push(await readBody(req));
      json(res, 204);
    },
  ],
  [
    "GET",
    /^\/app$/,
    (req, res) =>
      isAppJwt(bearer(req))
        ? json(res, 200, {
            slug: "ovr-e2e",
            name: "ovr-e2e",
            html_url: "https://github.com/apps/ovr-e2e",
            owner: { login: ACCOUNT.login },
            permissions: PERMISSIONS,
          })
        : json(res, 401, { message: "A JSON web token could not be decoded" }),
  ],
  [
    "GET",
    /^\/app\/installations$/,
    (req, res, url) => {
      if (!isAppJwt(bearer(req))) return json(res, 401, { message: "Bad credentials" });
      json(res, 200, url.searchParams.get("page") === "1" ? [installation] : []);
    },
  ],
  [
    "POST",
    /^\/app\/installations\/(\d+)\/access_tokens$/,
    async (req, res, url, [, id]) => {
      if (!isAppJwt(bearer(req))) return json(res, 401, { message: "Bad credentials" });
      if (Number(id) !== INSTALLATION_ID) return json(res, 404, { message: "Not Found" });

      const body = await readBody(req);
      state.tokenRequests.push(body);

      const ids = body.repository_ids;
      if (ids && !ids.every((repoId) => REPOSITORIES.some((repo) => repo.id === repoId))) {
        return json(res, 422, { message: "repository is not accessible to the installation" });
      }
      const permissions = body.permissions ?? PERMISSIONS;
      const grantable = Object.entries(permissions).every(
        ([name, level]) =>
          PERMISSIONS[name] === "write" || (PERMISSIONS[name] === "read" && level === "read"),
      );
      if (!grantable) return json(res, 422, { message: "permissions can't be granted" });

      // Unique across resets, like GitHub's: a reused token string would let a cached
      // response for the old token answer for the new one.
      const token = `ghs_fake_${randomBytes(16).toString("hex")}`;
      const expiresAt = Date.now() + 60 * 60 * 1000;
      state.tokens.set(token, { repositoryIds: ids ?? null, permissions, expiresAt });
      json(res, 201, { token, expires_at: new Date(expiresAt).toISOString(), permissions });
    },
  ],
  [
    "GET",
    /^\/installation\/repositories$/,
    (req, res, url) => {
      const token = installationToken(req);
      if (!token) return json(res, 401, { message: "Bad credentials" });
      const repositories =
        url.searchParams.get("page") === "1"
          ? REPOSITORIES.filter((repo) => reachable(token, repo))
          : [];
      json(res, 200, { total_count: repositories.length, repositories });
    },
  ],
  [
    "GET",
    /^\/repos\/([^/]+\/[^/]+)$/,
    (req, res, url, [, fullName]) => {
      const token = installationToken(req);
      const repository = REPOSITORIES.find((repo) => repo.full_name === fullName);
      if (!token) return json(res, 401, { message: "Bad credentials" });
      if (!repository || !reachable(token, repository)) {
        return json(res, 404, { message: "Not Found" });
      }
      json(res, 200, repository);
    },
  ],
  [
    "POST",
    /^\/repos\/([^/]+\/[^/]+)\/statuses\/([0-9a-f]+)$/,
    async (req, res, url, [, fullName, sha]) => {
      const token = installationToken(req);
      const repository = REPOSITORIES.find((repo) => repo.full_name === fullName);
      if (!token) return json(res, 401, { message: "Bad credentials" });
      if (!repository || !reachable(token, repository)) {
        return json(res, 404, { message: "Not Found" });
      }
      if (token.permissions.statuses !== "write") {
        return json(res, 403, { message: "Resource not accessible by integration" });
      }
      const body = await readBody(req);
      state.statuses.push({ repository: fullName, sha, token: bearer(req), ...body });
      json(res, 201, { id: state.statuses.length, ...body });
    },
  ],
];

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  const failure = state.failures.findIndex(
    (candidate) => candidate.method === req.method && url.pathname.startsWith(candidate.path),
  );
  if (failure !== -1) {
    const [{ status }] = state.failures.splice(failure, 1);
    return json(res, status, { message: "injected failure" });
  }

  for (const [method, pattern, handle] of routes) {
    const match = req.method === method ? pattern.exec(url.pathname) : null;
    if (match) {
      try {
        return await handle(req, res, url, match);
      } catch (error) {
        return json(res, 500, { message: String(error) });
      }
    }
  }

  json(res, 404, { message: "Not Found" });
});

server.listen(PORT, () => {
  console.log(`fake github listening on ${PORT}`);
});
