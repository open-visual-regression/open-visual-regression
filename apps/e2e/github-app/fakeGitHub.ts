// A stand-in for the parts of GitHub's REST API that OVR calls as a GitHub App. Runs under
// plain Node, so it uses only built-in modules and type annotations Node can strip.
import { createPublicKey, randomUUID, verify } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

type RecordedStatus = {
  repo: string;
  sha: string;
  token: string;
  accepted: boolean;
  state: string;
  context: string;
  description: string;
};

type Installation = {
  // The App is installed, as installation 42, on every repo this owner has.
  installedOn: string;
  permissions: Record<string, string>;
};

const PORT = Number(process.env.PORT ?? 4010);
const INSTALLATION_ID = 42;
const HOUR = 60 * 60 * 1000;
const DEFAULT_INSTALLATION: Installation = {
  installedOn: "acme",
  permissions: { statuses: "write", metadata: "read" },
};

const publicKey = createPublicKey(
  (process.env.OVR_GITHUB_APP_PRIVATE_KEY ?? "").trim().replace(/\\n/g, "\n"),
);

let installation = structuredClone(DEFAULT_INSTALLATION);
const validTokens = new Set<string>();
let statuses: RecordedStatus[] = [];

const bearer = (request: IncomingMessage): string =>
  (request.headers.authorization ?? "").replace(/^Bearer /, "");

const signedByApp = (request: IncomingMessage): boolean => {
  const [header = "", payload = "", signature = ""] = bearer(request).split(".");
  const signatureValid = verify(
    "sha256",
    Buffer.from(`${header}.${payload}`),
    publicKey,
    Buffer.from(signature, "base64url"),
  );
  if (!signatureValid) {
    return false;
  }

  const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number };
  return exp * 1000 > Date.now();
};

const readJson = async (request: IncomingMessage): Promise<Record<string, unknown>> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(chunk as Buffer);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
};

const respond = (response: ServerResponse, status: number, body?: unknown) => {
  response.writeHead(status, body === undefined ? {} : { "content-type": "application/json" });
  response.end(body === undefined ? undefined : JSON.stringify(body));
};

const handle = async (request: IncomingMessage, response: ServerResponse) => {
  const url = new URL(request.url ?? "/", "http://fake-github");
  const route = `${request.method} ${url.pathname}`;
  let match: RegExpMatchArray | null;

  if ((match = route.match(/^GET \/repos\/([^/]+)\/([^/]+)\/installation$/))) {
    if (!signedByApp(request)) {
      return respond(response, 401, { message: "A JSON web token could not be decoded" });
    }
    if (match[1] !== installation.installedOn) {
      return respond(response, 404, { message: "Not Found" });
    }
    return respond(response, 200, { id: INSTALLATION_ID, permissions: installation.permissions });
  }

  if (route === `POST /app/installations/${INSTALLATION_ID}/access_tokens`) {
    if (!signedByApp(request)) {
      return respond(response, 401, { message: "A JSON web token could not be decoded" });
    }
    const token = `ghs_${randomUUID().replaceAll("-", "")}`;
    validTokens.add(token);
    return respond(response, 201, {
      token,
      expires_at: new Date(Date.now() + HOUR).toISOString(),
      permissions: installation.permissions,
    });
  }

  if ((match = route.match(/^POST \/repos\/([^/]+\/[^/]+)\/statuses\/([0-9a-f]+)$/))) {
    const token = bearer(request);
    const accepted = validTokens.has(token);
    const body = await readJson(request);
    statuses.push({
      repo: match[1]!,
      sha: match[2]!,
      token,
      accepted,
      state: String(body.state),
      context: String(body.context),
      description: String(body.description),
    });
    return accepted
      ? respond(response, 201, {})
      : respond(response, 401, { message: "Bad credentials" });
  }

  // Control endpoints for the specs.
  if (route === "GET /_fake/health") {
    return respond(response, 200, { ok: true });
  }
  if (route === "GET /_fake/statuses") {
    const sha = url.searchParams.get("sha");
    return respond(response, 200, sha ? statuses.filter((status) => status.sha === sha) : statuses);
  }
  if (route === "PUT /_fake/installation") {
    installation = { ...installation, ...(await readJson(request)) };
    return respond(response, 204);
  }
  if (route === "POST /_fake/revoke-tokens") {
    validTokens.clear();
    return respond(response, 204);
  }
  if (route === "POST /_fake/reset") {
    installation = structuredClone(DEFAULT_INSTALLATION);
    statuses = [];
    return respond(response, 204);
  }

  return respond(response, 404, { message: "Not Found" });
};

createServer((request, response) => {
  handle(request, response).catch((error: unknown) => {
    console.error(error);
    respond(response, 500, { message: String(error) });
  });
}).listen(PORT, () => {
  console.log(`fake GitHub listening on ${PORT}`);
});
