#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../fixtures");
const STORIES_DIR = path.join(FIXTURES_DIR, "stories");

const run = (command, args, cwd) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env: { ...process.env, CI: "true" },
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`)),
    );
  });

const force = process.argv.includes("--force");
const clean = process.argv.includes("--clean");

const fixtures = (await readdir(FIXTURES_DIR, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && entry.name !== "stories")
  .map((entry) => path.join(FIXTURES_DIR, entry.name))
  .sort();

for (const fixture of fixtures) {
  const name = path.basename(fixture);
  const buildDir = path.join(fixture, "storybook-static");
  const storiesDir = path.join(fixture, "src");

  if (clean) {
    for (const dir of [buildDir, storiesDir, path.join(fixture, "node_modules")]) {
      await rm(dir, { recursive: true, force: true });
    }
    console.log(`${name}: cleaned`);
    continue;
  }

  if (!force && existsSync(path.join(buildDir, "index.json"))) {
    console.log(`${name}: already built, skipping (pass --force to rebuild)`);
    continue;
  }

  const hasLockfile = existsSync(path.join(fixture, "pnpm-lock.yaml"));

  console.log(`${name}: installing`);
  await run("pnpm", hasLockfile ? ["install", "--frozen-lockfile"] : ["install"], fixture);

  console.log(`${name}: building`);
  await rm(storiesDir, { recursive: true, force: true });
  await cp(STORIES_DIR, storiesDir, { recursive: true });
  await rm(buildDir, { recursive: true, force: true });
  await run("pnpm", ["exec", "storybook", "build", "--quiet", "--disable-telemetry"], fixture);
}
