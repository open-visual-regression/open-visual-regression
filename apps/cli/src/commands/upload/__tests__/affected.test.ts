import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadOvrConfig } from "../../../config";
import { findUnaffectedTargets } from "../affected";

let repo: string;
let projectDir: string;

const git = (...args: string[]): string =>
  execFileSync("git", args, { cwd: repo, encoding: "utf-8" }).trim();

const write = async (file: string, contents = file): Promise<void> => {
  await mkdir(path.join(repo, path.dirname(file)), { recursive: true });
  await writeFile(path.join(repo, file), contents);
};

const commitAll = (): string => {
  git("add", "-A");
  git("commit", "-q", "-m", "change");
  return git("rev-parse", "HEAD");
};

const STORIES = "/virtual:/@storybook/builder-vite/storybook-stories.js";

const targets = [
  { id: "button--default", title: "Button", name: "Default" },
  { id: "form--default", title: "Form", name: "Default" },
];

const writeStorybookBuild = async (): Promise<string> => {
  const storybookDir = path.join(projectDir, "storybook-static");
  await mkdir(storybookDir, { recursive: true });
  await writeFile(
    path.join(storybookDir, "index.json"),
    JSON.stringify({
      v: 5,
      entries: {
        "button--default": {
          id: "button--default",
          importPath: "./src/Button.stories.tsx",
          type: "story",
        },
        "form--default": {
          id: "form--default",
          importPath: "./src/Form.stories.tsx",
          type: "story",
        },
      },
    }),
  );
  await writeFile(
    path.join(storybookDir, "preview-stats.json"),
    JSON.stringify({
      modules: [
        { name: "./src/Button.stories.tsx", reasons: [{ moduleName: STORIES }] },
        { name: "./src/Form.stories.tsx", reasons: [{ moduleName: STORIES }] },
        { name: "./src/Form.tsx", reasons: [{ moduleName: "./src/Form.stories.tsx" }] },
        {
          name: "./../../node_modules/clsx/dist/clsx.mjs",
          reasons: [{ moduleName: "./src/Form.tsx" }],
        },
        {
          name: STORIES,
          reasons: [{ moduleName: "/virtual:/@storybook/builder-vite/vite-app.js" }],
        },
      ],
    }),
  );
  return storybookDir;
};

type AncestorBuild = { id: string; commitSha: string } | null;

const clientFor = (build: AncestorBuild | Error) => ({
  builds: {
    findAncestorBuild: vi.fn<
      (input: { commitShas: string[] }) => Promise<{ build: AncestorBuild }>
    >(async () => {
      if (build instanceof Error) {
        throw build;
      }
      return { build };
    }),
  },
});

const run = async (
  client: ReturnType<typeof clientFor>,
  config?: Parameters<typeof findUnaffectedTargets>[0]["config"],
) => {
  const log = vi.fn<(message: string) => void>();
  const configFile = path.join(projectDir, "ovr.config.ts");
  const ovrConfig = await loadOvrConfig(projectDir);
  const { unaffectedTargetIds: unaffected, summary } = await findUnaffectedTargets({
    client: client as never,
    storybookDir: await writeStorybookBuild(),
    cwd: projectDir,
    targets,
    config: config ?? ovrConfig?.onlyAffected,
    ovrConfig: ovrConfig ? { file: configFile, config: ovrConfig } : undefined,
    log,
  });
  return { unaffected, summary, output: log.mock.calls.map(([line]) => line).join("\n") };
};

const yarnLock = (packages: Record<string, string>): string =>
  [
    "# yarn lockfile v1",
    "",
    ...Object.entries(packages).flatMap(([name, version]) => [
      `"${name}@^${version}":`,
      `  version "${version}"`,
      "",
    ]),
  ].join("\n");

const writeOvrConfig = (config: object): Promise<void> =>
  write("apps/web/ovr.config.ts", `export default ${JSON.stringify(config, null, 2)};\n`);

const CLI = "@open-visual-regression/cli";

beforeEach(async () => {
  repo = await realpath(await mkdtemp(path.join(tmpdir(), "ovr-cli-affected-")));
  projectDir = path.join(repo, "apps/web");
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "Test");
  git("config", "commit.gpgsign", "false");
  await write(".gitignore", "storybook-static\n");
  await write("apps/web/package.json", "{}");
  for (const file of ["Button.stories.tsx", "Form.stories.tsx", "Form.tsx"]) {
    await write(`apps/web/src/${file}`);
  }
});

afterEach(async () => {
  await rm(repo, { recursive: true, force: true });
});

describe("findUnaffectedTargets", () => {
  it("returns the stories nothing changed since the last main-branch build can affect", async () => {
    const base = commitAll();
    await write("apps/web/src/Form.tsx", "changed");
    commitAll();
    const client = clientFor({ id: "build-1", commitSha: base });

    const { unaffected, output } = await run(client);

    expect(unaffected).toEqual(["button--default"]);
    expect(output).toContain("1 of 2 stories are affected by 1 changed file(s)");
    expect(output).toContain("apps/web/src/Form.stories.tsx (via apps/web/src/Form.tsx)");
    expect(client.builds.findAncestorBuild).toHaveBeenCalledWith({
      commitShas: [git("rev-parse", "HEAD"), base],
    });
  });

  it("counts uncommitted changes, since the build was made from the working tree", async () => {
    const base = commitAll();
    await write("apps/web/src/Form.tsx", "uncommitted");

    const { unaffected } = await run(clientFor({ id: "build-1", commitSha: base }));

    expect(unaffected).toEqual(["button--default"]);
  });

  it("captures everything when there is no main-branch build to compare against", async () => {
    commitAll();

    const { unaffected, output } = await run(clientFor(null));

    expect(unaffected).toEqual([]);
    expect(output).toContain("Capturing every story: no successful main-branch build");
  });

  it("captures everything when the server cannot look up a build", async () => {
    commitAll();

    const { unaffected, output } = await run(clientFor(new Error("Not Found")));

    expect(unaffected).toEqual([]);
    expect(output).toContain("the server could not find a build to compare against (Not Found)");
  });

  it("captures everything when the server returns a build outside this commit's history", async () => {
    commitAll();

    const { unaffected, output } = await run(
      clientFor({ id: "build-1", commitSha: "--output=/tmp/ovr-owned" }),
    );

    expect(unaffected).toEqual([]);
    expect(output).toContain("the server returned a build that is not in this commit's history");
  });

  it("captures everything when the tracer cannot explain a change", async () => {
    const base = commitAll();
    await write("pnpm-lock.yaml", "changed");

    const { unaffected, output } = await run(clientFor({ id: "build-1", commitSha: base }));

    expect(unaffected).toEqual([]);
    expect(output).toContain("Capturing every story: dependencies changed (pnpm-lock.yaml)");
  });

  it("resolves config globs from the directory ovr runs in", async () => {
    const base = commitAll();
    await write("apps/web/public/logo.png", "new");

    const { unaffected, output } = await run(clientFor({ id: "build-1", commitSha: base }), {
      externals: ["public/**"],
    });

    expect(unaffected).toEqual([]);
    expect(output).toContain('apps/web/public/logo.png matches "externals"');
  });

  it("ignores changes matching untraced globs", async () => {
    const base = commitAll();
    await write("apps/web/fixtures/data.json", "changed");

    const { unaffected } = await run(clientFor({ id: "build-1", commitSha: base }), {
      untraced: ["fixtures/**"],
    });

    expect(unaffected).toEqual(["button--default", "form--default"]);
  });

  it("records the base build and why every story was captured", async () => {
    const base = commitAll();
    await write("pnpm-lock.yaml", "changed");

    const { summary, output } = await run(clientFor({ id: "build-1", commitSha: base }));

    expect(output).toContain(`Comparing against main-branch build build-1 at ${base}.`);
    expect(summary).toEqual({
      baseBuildId: "build-1",
      baseCommitSha: base,
      captureAllReason: "dependencies changed (pnpm-lock.yaml)",
    });
  });

  it("records the base build when only the affected stories are captured", async () => {
    const base = commitAll();
    await write("apps/web/src/Form.tsx", "changed");

    const { summary } = await run(clientFor({ id: "build-1", commitSha: base }));

    expect(summary).toEqual({
      baseBuildId: "build-1",
      baseCommitSha: base,
      captureAllReason: null,
    });
  });

  it("captures nothing for a bump of the OVR CLI, which is not in the bundle", async () => {
    await write("yarn.lock", yarnLock({ clsx: "2.1.1", [CLI]: "0.8.0", tar: "7.5.1" }));
    await write("apps/web/package.json", JSON.stringify({ devDependencies: { [CLI]: "^0.8.0" } }));
    const base = commitAll();
    await write("yarn.lock", yarnLock({ clsx: "2.1.1", [CLI]: "0.9.0", tar: "7.5.22" }));
    await write("apps/web/package.json", JSON.stringify({ devDependencies: { [CLI]: "^0.9.0" } }));
    commitAll();

    const { unaffected, summary } = await run(clientFor({ id: "build-1", commitSha: base }));

    expect(unaffected).toEqual(["button--default", "form--default"]);
    expect(summary.captureAllReason).toBeNull();
  });

  it("captures everything when a package in the bundle changes version", async () => {
    await write("yarn.lock", yarnLock({ clsx: "2.1.1", [CLI]: "0.8.0" }));
    const base = commitAll();
    await write("yarn.lock", yarnLock({ clsx: "2.1.2", [CLI]: "0.8.0" }));
    commitAll();

    const { unaffected, output } = await run(clientFor({ id: "build-1", commitSha: base }));

    expect(unaffected).toEqual([]);
    expect(output).toContain(
      "Capturing every story: dependencies changed (yarn.lock): clsx (bundled by the Storybook).",
    );
  });

  it("captures nothing when ovr.config only changes its untraced globs", async () => {
    await writeOvrConfig({ onlyAffected: { untraced: [] } });
    const base = commitAll();
    await writeOvrConfig({ onlyAffected: { untraced: ["fixtures/**"] } });
    commitAll();

    const { unaffected, output } = await run(clientFor({ id: "build-1", commitSha: base }));

    expect(unaffected).toEqual(["button--default", "form--default"]);
    expect(output).not.toContain("Capturing every story");
  });

  it("leaves a viewport change to the server, which captures any viewport without a baseline", async () => {
    await writeOvrConfig({ viewports: [{ name: "desktop", width: 1280 }] });
    const base = commitAll();
    await writeOvrConfig({
      viewports: [
        { name: "desktop", width: 1280 },
        { name: "mobile", width: 375 },
      ],
    });
    commitAll();

    const { unaffected, output } = await run(clientFor({ id: "build-1", commitSha: base }));

    expect(unaffected).toEqual(["button--default", "form--default"]);
    expect(output).toContain(
      "apps/web/ovr.config.ts changed the viewports; stories are captured at any viewport they have no baseline for.",
    );
  });

  it("captures everything when ovr.config changes how every story renders", async () => {
    await writeOvrConfig({ waitForTimeout: 0 });
    const base = commitAll();
    await writeOvrConfig({ waitForTimeout: 500 });
    commitAll();

    const { unaffected, output } = await run(clientFor({ id: "build-1", commitSha: base }));

    expect(unaffected).toEqual([]);
    expect(output).toContain(
      'Capturing every story: apps/web/ovr.config.ts changed "waitForTimeout", which can change how every story renders.',
    );
  });

  it("captures everything outside a git repository", async () => {
    await rm(path.join(repo, ".git"), { recursive: true, force: true });

    const { unaffected, output } = await run(clientFor(null));

    expect(unaffected).toEqual([]);
    expect(output).toContain("could not read the git history");
  });
});
