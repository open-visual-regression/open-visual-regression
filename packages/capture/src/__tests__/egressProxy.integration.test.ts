import { copyFile, mkdtemp, rm } from "node:fs/promises";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Page } from "playwright";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";

import { startEgressProxy, type EgressProxy } from "../lib/egressProxy";
import { describe, expect, test, withCapturePage, writeStorybookBuildMarkers } from "./fixtures";

const { resolveMock } = vi.hoisted(() => ({
  resolveMock: vi.fn<(hostname: string) => Promise<string | null>>(),
}));

vi.mock("../lib/networkGuard", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/networkGuard")>();
  return { ...actual, resolvePublicAddress: (hostname: string) => resolveMock(hostname) };
});

const actualGuard =
  await vi.importActual<typeof import("../lib/networkGuard")>("../lib/networkGuard");

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));

type TestServer = { origin: string; port: number; close: () => void };

const startTestServer = (handler: http.RequestListener): Promise<TestServer> =>
  new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({ origin: `http://127.0.0.1:${port}`, port, close: () => server.close() });
    });
  });

let bundleDir: string;
let internal: TestServer;
let redirector: TestServer;
let internalHits: string[] = [];

beforeAll(async () => {
  bundleDir = await mkdtemp(path.join(tmpdir(), "ovr-egress-"));
  await copyFile(
    path.join(TEST_DIR, "html/iframe-static.html"),
    path.join(bundleDir, "iframe.html"),
  );
  await writeStorybookBuildMarkers(bundleDir);

  internal = await startTestServer((req, res) => {
    internalHits.push(req.url ?? "");
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("SECRET");
  });

  redirector = await startTestServer((_req, res) => {
    res.writeHead(302, { Location: `${internal.origin}/secret` });
    res.end();
  });
});

afterAll(async () => {
  internal?.close();
  redirector?.close();
  await rm(bundleDir, { recursive: true, force: true });
});

beforeEach(() => {
  internalHits = [];
  resolveMock.mockImplementation(actualGuard.resolvePublicAddress);
});

const withEgressPage = async (run: (page: Page) => Promise<void>): Promise<void> => {
  let egress: EgressProxy | undefined;

  try {
    await withCapturePage(bundleDir, run, {
      launch: async (proxyOrigin) => {
        egress = await startEgressProxy(proxyOrigin);
        return { proxy: { server: egress.server } };
      },
    });
  } finally {
    egress?.close();
  }
};

const requestFromPage = (page: Page, url: string) =>
  page.evaluate(async (target) => {
    try {
      await fetch(target, { mode: "no-cors" });
    } catch {
      /* a refused request is the outcome under test, not an error */
    }
  }, url);

describe("startEgressProxy", () => {
  test("serves the bundle the capture page was pointed at", async () => {
    await withEgressPage(async (page) => {
      expect(await page.textContent("#storybook-root")).not.toBeNull();
    });
  }, 60_000);

  test("refuses a request aimed straight at a private address", async () => {
    await withEgressPage(async (page) => {
      await requestFromPage(page, `${internal.origin}/direct`);
      expect(internalHits).toEqual([]);
    });
  }, 60_000);

  test("refuses a redirect that lands on a private address", async () => {
    await withEgressPage(async (page) => {
      await requestFromPage(page, `${redirector.origin}/start`);
      expect(internalHits).toEqual([]);
    });
  }, 60_000);

  test("forwards a request whose host resolves to a public address", async () => {
    resolveMock.mockImplementation(async (hostname) =>
      hostname === "cdn.example.test" ? "127.0.0.1" : null,
    );

    await withEgressPage(async (page) => {
      await requestFromPage(page, `http://cdn.example.test:${internal.port}/asset.png`);
      expect(internalHits).toEqual(["/asset.png"]);
    });
  }, 60_000);
});
