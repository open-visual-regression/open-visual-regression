// Serves the shared fake git provider APIs (the same msw handlers the unit tests use) over
// HTTP, so the web app and worker under E2E test talk to them instead of the real providers.
import { createServer } from "@mswjs/http-middleware";

import { createFakeGithub } from "@ovr/mocks/handlers/github";

import { E2E_GITHUB } from "./github";

const port = Number(process.env.PORT ?? 8090);
const publicKey = Buffer.from(process.env.FAKE_GITHUB_PUBLIC_KEY ?? "", "base64").toString("utf8");

// Relative routes, so the fake answers whichever host the caller reached it by.
const github = createFakeGithub({
  baseUrl: "",
  clientId: E2E_GITHUB.clientId,
  publicKey,
  app: E2E_GITHUB.app,
  installations: [E2E_GITHUB.installation],
});

createServer(...github.controlHandlers, ...github.handlers).listen(port, () => {
  console.log(`mock git providers listening on ${port}`);
});
