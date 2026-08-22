#!/usr/bin/env node
// Installs and builds the per-major Storybook fixtures used by the
// compatibility suite. Each fixture is its own package with its own lockfile:
// three Storybook majors cannot share one dependency tree, so they are
// deliberately outside the pnpm workspace and installed with --ignore-workspace.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../fixtures");

const run = (command, args, cwd) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
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
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(FIXTURES_DIR, entry.name))
  .sort();

for (const fixture of fixtures) {
  const name = path.basename(fixture);
  const buildDir = path.join(fixture, "storybook-static");

  if (clean) {
    await rm(buildDir, { recursive: true, force: true });
    await rm(path.join(fixture, "node_modules"), { recursive: true, force: true });
    console.log(`${name}: cleaned`);
    continue;
  }

  if (!force && existsSync(path.join(buildDir, "index.json"))) {
    console.log(`${name}: already built, skipping (pass --force to rebuild)`);
    continue;
  }

  console.log(`${name}: installing`);
  await run("pnpm", ["install", "--ignore-workspace", "--frozen-lockfile"], fixture);

  console.log(`${name}: building`);
  await rm(buildDir, { recursive: true, force: true });
  await run("pnpm", ["exec", "storybook", "build", "--quiet", "--disable-telemetry"], fixture);
}
