/**
 * Memory soak for the worker: runs the built worker against a real Storybook build and fails
 * if its memory keeps growing across capture groups.
 *
 * Needs Postgres, Redis and S3 storage (see docker-compose.yml) and a built worker
 * (`pnpm --filter @ovr/worker build`). Usage:
 *
 *   DATABASE_URL=... REDIS_URL=... STORAGE_ENDPOINT=... STORAGE_ACCESS_KEY=... \
 *   STORAGE_SECRET_KEY=... OVR_GIT_TOKEN_ENCRYPTION_KEY=... \
 *   SOAK_STORYBOOK_DIR=path/to/storybook-static pnpm --filter @ovr/worker soak
 *
 * Every other worker env var (OVR_CAPTURE_GROUP_CONCURRENCY, OVR_DIFF_CONCURRENCY, ...) is
 * passed through, so the soak can mirror a production pod.
 */
import { spawn } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";

import * as tar from "tar";
import { v7 as uuidv7 } from "uuid";
import { z } from "zod";

import { createBucket } from "@ovr/testing";

import { readProcessTree } from "../src/lib/processTree";

const config = z
  .object({
    SOAK_STORYBOOK_DIR: z.string().min(1),
    // The soak stops at whichever limit comes first.
    SOAK_DURATION_MIN: z.coerce.number().positive().default(30),
    SOAK_CAPTURE_GROUPS: z.coerce.number().int().positive().default(Number.MAX_SAFE_INTEGER),
    // Groups to run before the baseline is taken, so caches, JIT and pools can fill first.
    SOAK_WARMUP_GROUPS: z.coerce.number().int().nonnegative().default(20),
    SOAK_MAX_GROWTH_MB: z.coerce.number().positive().default(150),
    SOAK_STORIES_PER_BUILD: z.coerce.number().int().positive().default(200),
    SOAK_BUILDS_IN_FLIGHT: z.coerce.number().int().positive().default(2),
    SOAK_SAMPLE_INTERVAL_MS: z.coerce.number().int().positive().default(10_000),
    SOAK_OUTPUT: z.string().optional(),
    DATABASE_URL: z.string().min(1),
    STORAGE_ENDPOINT: z.string().min(1),
    STORAGE_ACCESS_KEY: z.string().min(1),
    STORAGE_SECRET_KEY: z.string().min(1),
    STORAGE_BUCKET: z.string().default("ovr"),
    STORAGE_REGION: z.string().default("us-east-1"),
  })
  .parse(process.env);

process.env.STORAGE_BUCKET = config.STORAGE_BUCKET;
process.env.NODE_ENV = "production";

// Imported after the env is settled, since these read it at import time.
const { runMigrations } = await import("@ovr/db/migrate");
const { dbClient } = await import("@ovr/db/client");
const { db } = await import("@ovr/db/db");
const { organization, projects, user: userTable } = await import("@ovr/db/schema");
const { enqueueExtract } = await import("@ovr/queue/producer");
const { storage } = await import("@ovr/storage");

const WORKER_DIR = path.resolve(import.meta.dirname, "..");
const MB = 1024 ** 2;

type Sample = {
  elapsedMs: number;
  captureGroups: number;
  workerRss: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
  browserProcesses: number;
  browserZombies: number;
  browserRss: number;
};

const ensureBucket = async () => {
  const rustfs = {
    endpoint: config.STORAGE_ENDPOINT,
    accessKey: config.STORAGE_ACCESS_KEY,
    secretKey: config.STORAGE_SECRET_KEY,
    stop: async () => undefined,
  };
  await createBucket(rustfs, config.STORAGE_BUCKET).catch(() => {
    // Already exists.
  });
};

const seedProject = async () => {
  const [user] = await db
    .insert(userTable)
    .values({ id: uuidv7(), name: "Soak", email: `${uuidv7()}@example.com` })
    .returning();
  const [org] = await db
    .insert(organization)
    .values({ id: uuidv7(), name: "Soak", slug: uuidv7(), createdAt: new Date() })
    .returning();
  const [project] = await db
    .insert(projects)
    .values({
      name: `soak-${Date.now()}`,
      gitMainBranch: "main",
      organizationId: org!.id,
      creatorId: user!.id,
    })
    .returning();
  return { userId: user!.id, projectId: project!.id };
};

// Two variants of the same Storybook, so feature builds produce real pixel diffs.
const uploadArtifacts = async (projectId: string): Promise<string[]> => {
  const workDir = await mkdtemp(path.join(tmpdir(), "ovr-soak-"));
  try {
    const variants = [
      "",
      "<style>#storybook-root, #root { margin-top: 3px; filter: hue-rotate(20deg); }</style>",
    ];
    return await Promise.all(
      variants.map(async (style, index) => {
        const dir = path.join(workDir, `variant-${index}`);
        await cp(config.SOAK_STORYBOOK_DIR, dir, { recursive: true });
        if (style) {
          const iframePath = path.join(dir, "iframe.html");
          const iframe = await readFile(iframePath, "utf8");
          await writeFile(iframePath, iframe.replace("</head>", `${style}</head>`));
        }
        const tarball = path.join(workDir, `variant-${index}.tar.gz`);
        await tar.create({ gzip: true, file: tarball, cwd: dir }, ["."]);
        const artifactPath = `${projectId}/soak/variant-${index}.tar.gz`;
        await storage.uploadFile(artifactPath, await readFile(tarball), "application/gzip");
        return artifactPath;
      }),
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
};

const readTargets = async () => {
  const index = JSON.parse(
    await readFile(path.join(config.SOAK_STORYBOOK_DIR, "index.json"), "utf8"),
  ) as { entries: Record<string, { id: string; title: string; name: string; type: string }> };
  return Object.values(index.entries)
    .filter((entry) => entry.type === "story")
    .map(({ id, title, name }) => ({ id, title, name }));
};

const pickTargets = <T>(targets: T[], count: number): T[] =>
  [...targets].sort(() => Math.random() - 0.5).slice(0, count);

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

// Least-squares slope, in bytes per minute.
const slopePerMinute = (samples: Sample[], pick: (sample: Sample) => number): number => {
  const xs = samples.map((sample) => sample.elapsedMs / 60_000);
  const ys = samples.map(pick);
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
  const num = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i]! - meanY), 0);
  const den = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  return den === 0 ? 0 : num / den;
};

const main = async () => {
  await runMigrations(config.DATABASE_URL);
  await ensureBucket();
  const { userId, projectId } = await seedProject();
  const artifactPaths = await uploadArtifacts(projectId);
  const targets = await readTargets();
  console.log(`soak: ${targets.length} stories, project ${projectId}`);

  const worker = spawn(process.execPath, ["dist/index.js"], {
    cwd: WORKER_DIR,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "inherit"],
  });

  let captureGroups = 0;
  let workerMemory = { heapUsed: 0, external: 0, arrayBuffers: 0 };
  let workerExited = false;
  let stopping = false;
  let workerCrashed = false;
  worker.on("exit", (code, signal) => {
    workerExited = true;
    workerCrashed = !stopping;
    console.log(`soak: worker exited (code ${code}, signal ${signal})`);
  });

  createInterface({ input: worker.stdout }).on("line", (line) => {
    try {
      const log = JSON.parse(line) as Record<string, unknown>;
      if (log.msg === "capture group started") {
        captureGroups += 1;
      } else if (log.msg === "worker memory") {
        workerMemory = {
          heapUsed: Number(log.heapUsedBytes),
          external: Number(log.externalBytes),
          arrayBuffers: Number(log.arrayBuffersBytes),
        };
      } else if (log.level !== undefined && Number(log.level) >= 50) {
        const err = log.err as { message?: string } | undefined;
        console.log(
          `soak: worker ${log.msg}${err?.message ? `: ${err.message.slice(0, 300)}` : ""}`,
        );
      }
    } catch {
      // Not a JSON log line.
    }
  });

  const startedAt = Date.now();
  const samples: Sample[] = [];
  const sample = async () => {
    const status = await readFile(`/proc/${worker.pid}/status`, "utf8").catch(() => "");
    const rss = Number(/^VmRSS:\s+(\d+) kB$/m.exec(status)?.[1] ?? 0) * 1024;
    const tree = await readProcessTree(worker.pid!);
    const next: Sample = {
      elapsedMs: Date.now() - startedAt,
      captureGroups,
      workerRss: rss,
      ...workerMemory,
      browserProcesses: tree?.processes ?? 0,
      browserZombies: tree?.zombies ?? 0,
      browserRss: tree?.rssBytes ?? 0,
    };
    samples.push(next);
    console.log(
      `soak: ${(next.elapsedMs / 60_000).toFixed(1)}min groups=${captureGroups}` +
        ` rss=${(rss / MB).toFixed(0)}MB heap=${(next.heapUsed / MB).toFixed(0)}MB` +
        ` external=${(next.external / MB).toFixed(0)}MB` +
        ` browsers=${next.browserProcesses} (${(next.browserRss / MB).toFixed(0)}MB)` +
        ` zombies=${next.browserZombies}`,
    );
  };
  const sampler = setInterval(() => void sample(), config.SOAK_SAMPLE_INTERVAL_MS);

  const done = () =>
    workerExited ||
    captureGroups >= config.SOAK_CAPTURE_GROUPS ||
    Date.now() - startedAt >= config.SOAK_DURATION_MIN * 60_000;

  const runBuild = async (round: number) => {
    const isMain = round % 3 === 0;
    const build = await dbClient.builds.create({
      projectId,
      branch: isMain ? "main" : `feature/soak-${round}`,
      commitSha: round.toString(16).padStart(40, "0"),
      artifactPath: artifactPaths[round % artifactPaths.length]!,
      createdBy: userId,
    });
    await enqueueExtract({
      buildId: build!.id,
      artifactPath: build!.artifactPath,
      targets: pickTargets(targets, config.SOAK_STORIES_PER_BUILD),
      viewports: [
        { name: "desktop", browser: "chromium", viewportWidth: 1280, viewportHeight: 800 },
        { name: "mobile", browser: "chromium", viewportWidth: 375 },
        {
          name: "tablet",
          browser: "chromium",
          viewportWidth: 768,
          viewportHeight: 1024,
          default: false,
        },
      ],
      diffThreshold: 0,
    });

    while (!done()) {
      const current = await dbClient.builds.findById(build!.id);
      if (current && ["success", "error", "canceled"].includes(current.processingStatus)) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  };

  let round = 0;
  await Promise.all(
    Array.from({ length: config.SOAK_BUILDS_IN_FLIGHT }, async () => {
      while (!done()) {
        await runBuild(round++);
      }
    }),
  );

  clearInterval(sampler);
  await sample();
  stopping = true;
  worker.kill("SIGTERM");
  await new Promise((resolve) => worker.once("exit", resolve));

  if (config.SOAK_OUTPUT) {
    const header = Object.keys(samples[0]!).join(",");
    const rows = samples.map((s) => Object.values(s).join(","));
    await writeFile(config.SOAK_OUTPUT, [header, ...rows].join("\n") + "\n");
  }

  const measured = samples.filter((s) => s.captureGroups >= config.SOAK_WARMUP_GROUPS);
  if (measured.length < 6) {
    console.error(
      `soak: only ${measured.length} samples after ${config.SOAK_WARMUP_GROUPS} warmup groups;` +
        " run longer or lower SOAK_WARMUP_GROUPS",
    );
    process.exit(1);
  }

  const total = (s: Sample) => s.workerRss + s.browserRss;
  const window = Math.min(3, Math.floor(measured.length / 2));
  const growth = (pick: (s: Sample) => number) =>
    median(measured.slice(-window).map(pick)) - median(measured.slice(0, window).map(pick));

  const report = {
    captureGroups,
    minutes: Number(((Date.now() - startedAt) / 60_000).toFixed(1)),
    workerRssGrowthMb: Math.round(growth((s) => s.workerRss) / MB),
    heapUsedGrowthMb: Math.round(growth((s) => s.heapUsed) / MB),
    externalGrowthMb: Math.round(growth((s) => s.external) / MB),
    browserRssGrowthMb: Math.round(growth((s) => s.browserRss) / MB),
    totalRssGrowthMb: Math.round(growth(total) / MB),
    workerRssSlopeMbPerMin: Number((slopePerMinute(measured, (s) => s.workerRss) / MB).toFixed(1)),
    totalRssSlopeMbPerMin: Number((slopePerMinute(measured, total) / MB).toFixed(1)),
    maxBrowserProcesses: Math.max(...measured.map((s) => s.browserProcesses)),
    maxBrowserZombies: Math.max(...measured.map((s) => s.browserZombies)),
  };
  console.log(`soak: ${JSON.stringify(report)}`);

  if (workerCrashed) {
    console.error("soak: FAIL, the worker exited during the soak");
    process.exit(1);
  }
  if (report.totalRssGrowthMb > config.SOAK_MAX_GROWTH_MB) {
    console.error(
      `soak: FAIL, RSS grew ${report.totalRssGrowthMb}MB over ${captureGroups} capture groups` +
        ` (limit ${config.SOAK_MAX_GROWTH_MB}MB)`,
    );
    process.exit(1);
  }
  console.log("soak: PASS");
  process.exit(0);
};

await main();
