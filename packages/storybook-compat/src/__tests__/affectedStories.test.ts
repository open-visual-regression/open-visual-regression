import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { findAffectedStories } from "../affectedStories";
import type { AffectedStoriesInput } from "../affectedStories";

type Graph = Record<string, (string | null)[]>;

let repoRoot: string;

const webDir = (): string => path.join(repoRoot, "apps/web");

const createRepo = async (files: string[]): Promise<string> => {
  repoRoot = await realpath(await mkdtemp(path.join(tmpdir(), "ovr-affected-stories-")));

  for (const file of [
    "package.json",
    "apps/web/package.json",
    "packages/ui/package.json",
    ...files,
  ]) {
    await mkdir(path.join(repoRoot, path.dirname(file)), { recursive: true });
    await writeFile(path.join(repoRoot, file), "");
  }

  return repoRoot;
};

const writeBuild = async (
  graph: Graph,
  entries: { id: string; importPath: string; type?: string }[],
  options: { stats?: boolean; version?: string } = {},
): Promise<string> => {
  const storybookDir = path.join(repoRoot, "apps/web/storybook-static");
  await mkdir(storybookDir, { recursive: true });
  await writeFile(
    path.join(storybookDir, "index.json"),
    JSON.stringify({
      v: 5,
      entries: Object.fromEntries(
        entries.map((entry) => [entry.id, { title: "T", name: "N", type: "story", ...entry }]),
      ),
    }),
  );

  if (options.stats !== false) {
    const modules = Object.entries(graph).map(([name, reasons]) => ({
      id: name,
      name,
      reasons: reasons.map((moduleName) => ({ moduleName })),
    }));
    await writeFile(
      path.join(storybookDir, "preview-stats.json"),
      JSON.stringify({ version: options.version, modules }),
    );
  }

  return storybookDir;
};

const STORIES_INDEX = "/virtual:/@storybook/builder-vite/storybook-stories.js";

const viteGraph: Graph = {
  [STORIES_INDEX]: ["/virtual:/@storybook/builder-vite/vite-app.js"],
  "./src/Button.stories.tsx": [STORIES_INDEX],
  "./src/Form.stories.tsx": [STORIES_INDEX],
  "./src/Button.tsx": ["./src/Button.stories.tsx", "./src/Form.tsx"],
  "./src/Form.tsx": ["./src/Form.stories.tsx"],
  "./../../packages/ui/src/utils.ts": ["./src/Button.tsx"],
  "./src/globals.css": ["./.storybook/preview.tsx"],
  "./../../node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs": [
    "./../../packages/ui/src/utils.ts",
  ],
};

const viteEntries = [
  { id: "button--primary", importPath: "./src/Button.stories.tsx" },
  { id: "button--secondary", importPath: "./src/Button.stories.tsx" },
  { id: "form--default", importPath: "./src/Form.stories.tsx" },
];

const viteRepoFiles = [
  "apps/web/src/Button.stories.tsx",
  "apps/web/src/Form.stories.tsx",
  "apps/web/src/Button.tsx",
  "apps/web/src/Form.tsx",
  "apps/web/src/globals.css",
  "apps/web/.storybook/preview.tsx",
  "packages/ui/src/utils.ts",
];

const trace = async (
  changedFiles: string[],
  options: Partial<AffectedStoriesInput> = {},
): Promise<Awaited<ReturnType<typeof findAffectedStories>>> => {
  await createRepo(viteRepoFiles);
  const storybookDir = await writeBuild(viteGraph, viteEntries);
  return findAffectedStories({
    storybookDir,
    projectDir: webDir(),
    repoRoot,
    changedFiles,
    ...options,
  });
};

type FileChange = { base?: string; current: string };

const traceAgainstBase = async (
  changes: Record<string, FileChange>,
  options: Partial<AffectedStoriesInput> = {},
): Promise<Awaited<ReturnType<typeof findAffectedStories>>> => {
  await createRepo(viteRepoFiles);
  const storybookDir = await writeBuild(viteGraph, viteEntries);
  for (const [file, { current }] of Object.entries(changes)) {
    await mkdir(path.join(repoRoot, path.dirname(file)), { recursive: true });
    await writeFile(path.join(repoRoot, file), current);
  }
  return findAffectedStories({
    storybookDir,
    projectDir: webDir(),
    repoRoot,
    changedFiles: Object.keys(changes),
    readBaseFile: async (file) => changes[file]?.base,
    ...options,
  });
};

const manifest = (fields: Record<string, unknown>): string =>
  JSON.stringify({ name: "web", version: "1.0.0", ...fields }, null, 2);

const pnpmLock = (packages: Record<string, string>): string =>
  `lockfileVersion: '9.0'\n\npackages:\n${Object.entries(packages)
    .map(([name, version]) => `  '${name}@${version}':\n    resolution: {integrity: sha512-x}\n`)
    .join("")}`;

const ovrConfig = (reason: string | null) => ({
  file: "apps/web/ovr.config.ts",
  changedCaptureSettings: async () => reason,
});

afterEach(async () => {
  await rm(repoRoot, { recursive: true, force: true });
});

describe("findAffectedStories", () => {
  it("follows a change in another package up to every story file that imports it", async () => {
    const result = await trace(["packages/ui/src/utils.ts"]);

    expect(result).toEqual({
      mode: "some",
      storyIds: ["button--primary", "button--secondary", "form--default"],
      storyFiles: [
        {
          file: "apps/web/src/Button.stories.tsx",
          storyIds: ["button--primary", "button--secondary"],
          via: [
            "packages/ui/src/utils.ts",
            "apps/web/src/Button.tsx",
            "apps/web/src/Button.stories.tsx",
          ],
        },
        {
          file: "apps/web/src/Form.stories.tsx",
          storyIds: ["form--default"],
          via: [
            "packages/ui/src/utils.ts",
            "apps/web/src/Button.tsx",
            "apps/web/src/Form.tsx",
            "apps/web/src/Form.stories.tsx",
          ],
        },
      ],
      ignoredFiles: [],
    });
  });

  it("only picks the story files a change reaches", async () => {
    const result = await trace(["apps/web/src/Form.tsx"]);

    expect(result).toMatchObject({ mode: "some", storyIds: ["form--default"] });
  });

  it("picks every story in a changed story file", async () => {
    const result = await trace(["apps/web/src/Button.stories.tsx"]);

    expect(result).toMatchObject({
      mode: "some",
      storyIds: ["button--primary", "button--secondary"],
    });
  });

  it("captures everything when a changed module renders around every story", async () => {
    const result = await trace(["apps/web/src/globals.css"]);

    expect(result).toEqual({
      mode: "all",
      reason: "apps/web/src/globals.css is loaded by apps/web/.storybook/preview.tsx",
    });
  });

  it("captures everything when a changed module is an entry nothing imports", async () => {
    await createRepo([...viteRepoFiles, "apps/web/src/setup.ts"]);
    const storybookDir = await writeBuild({ ...viteGraph, "./src/setup.ts": [] }, viteEntries);

    const result = await findAffectedStories({
      storybookDir,
      projectDir: webDir(),
      repoRoot,
      changedFiles: ["apps/web/src/setup.ts"],
    });

    expect(result).toMatchObject({ mode: "all" });
  });

  it("captures everything when Storybook configuration outside the graph changes", async () => {
    const result = await trace(["apps/web/.storybook/preview.tsx"]);

    expect(result).toMatchObject({ mode: "all" });
  });

  it("ignores code that no story imports, since it cannot render", async () => {
    const result = await trace([
      "apps/web/src/server.ts",
      "packages/ui/src/__tests__/utils.test.ts",
    ]);

    expect(result).toEqual({
      mode: "some",
      storyIds: [],
      storyFiles: [],
      ignoredFiles: ["apps/web/src/server.ts", "packages/ui/src/__tests__/utils.test.ts"],
    });
  });

  it("captures everything when a non-code file changes in a package the bundle uses", async () => {
    const result = await trace(["packages/ui/src/tokens.css"]);

    expect(result).toMatchObject({ mode: "all" });
    expect(result.mode === "all" && result.reason).toContain("packages/ui/src/tokens.css");
  });

  it("captures everything when a bundled package's manifest changes", async () => {
    expect(await trace(["apps/web/package.json"])).toMatchObject({ mode: "all" });
  });

  it("ignores non-code files in packages the bundle does not use", async () => {
    const result = await trace(["apps/worker/Dockerfile", "apps/worker/package.json"]);

    expect(result).toMatchObject({ mode: "some", storyIds: [] });
  });

  it("ignores documentation and repository metadata", async () => {
    const result = await trace([
      "README.md",
      "packages/ui/CHANGELOG.md",
      ".changeset/brave-dogs.md",
      ".github/workflows/ci.yml",
    ]);

    expect(result).toMatchObject({ mode: "some", storyIds: [] });
  });

  it.each(["pnpm-lock.yaml", "package-lock.json", "yarn.lock", "bun.lock", "apps/web/bun.lockb"])(
    "captures everything when the lockfile %s changes",
    async (lockfile) => {
      expect(await trace([lockfile])).toMatchObject({ mode: "all" });
    },
  );

  it("ignores a lockfile of a project the bundle does not use", async () => {
    const result = await trace(["examples/other/pnpm-lock.yaml"]);

    expect(result).toMatchObject({ mode: "some", storyIds: [] });
  });

  it.each(["apps/web/vite.config.ts", "packages/ui/tailwind.config.js", "tsconfig.base.json"])(
    "captures everything when build configuration %s changes",
    async (config) => {
      expect(await trace([config])).toMatchObject({ mode: "all" });
    },
  );

  it("ignores build configuration of a package the bundle does not use", async () => {
    const result = await trace(["apps/worker/vitest.config.ts"]);

    expect(result).toMatchObject({ mode: "some", storyIds: [] });
  });

  it("ignores a change to the project's ovr.config that leaves capture settings alone", async () => {
    const result = await traceAgainstBase(
      {
        "apps/web/ovr.config.ts": {
          base: "export default { onlyAffected: { untraced: [] } };",
          current: 'export default { onlyAffected: { untraced: ["fixtures/**"] } };',
        },
      },
      { ovrConfig: ovrConfig(null) },
    );

    expect(result).toMatchObject({
      mode: "some",
      storyIds: [],
      ignoredFiles: ["apps/web/ovr.config.ts"],
    });
  });

  it("captures everything when the project's ovr.config changes its viewports", async () => {
    const result = await traceAgainstBase(
      { "apps/web/ovr.config.ts": { base: "a", current: "b" } },
      { ovrConfig: ovrConfig("viewports changed") },
    );

    expect(result).toEqual({ mode: "all", reason: "viewports changed" });
  });

  it("still treats another package's config file as build configuration", async () => {
    const result = await traceAgainstBase(
      { "packages/ui/tailwind.config.js": { base: "a", current: "b" } },
      { ovrConfig: ovrConfig(null) },
    );

    expect(result).toMatchObject({ mode: "all" });
  });

  it("ignores a bundled package's manifest when only its devDependencies changed", async () => {
    const result = await traceAgainstBase({
      "apps/web/package.json": {
        base: manifest({ devDependencies: { "@open-visual-regression/cli": "0.13.0" } }),
        current: manifest({ devDependencies: { "@open-visual-regression/cli": "0.14.2" } }),
      },
    });

    expect(result).toMatchObject({ mode: "some", ignoredFiles: ["apps/web/package.json"] });
  });

  it.each([
    { field: "dependencies", base: { react: "^18.2.0" }, current: { react: "^19.0.0" } },
    { field: "exports", base: { ".": "./src/index.ts" }, current: { ".": "./dist/index.js" } },
    { field: "sideEffects", base: undefined, current: ["*.css"] },
  ])(
    "captures everything when a bundled package's manifest changes $field",
    async ({ field, base, current }) => {
      const result = await traceAgainstBase({
        "packages/ui/package.json": {
          base: manifest({ [field]: base }),
          current: manifest({ [field]: current }),
        },
      });

      expect(result).toEqual({
        mode: "all",
        reason: `packages/ui/package.json changed "${field}"`,
      });
    },
  );

  it("captures everything for a new manifest in a bundled package", async () => {
    const result = await traceAgainstBase({ "apps/web/package.json": { current: manifest({}) } });

    expect(result).toMatchObject({ mode: "all" });
  });

  it("ignores a lockfile change that only bumps the CLI", async () => {
    const result = await traceAgainstBase({
      "pnpm-lock.yaml": {
        base: pnpmLock({ "@open-visual-regression/cli": "0.13.0", clsx: "2.1.1" }),
        current: pnpmLock({ "@open-visual-regression/cli": "0.14.2", clsx: "2.1.1" }),
      },
    });

    expect(result).toMatchObject({
      mode: "some",
      storyIds: [],
      ignoredFiles: ["pnpm-lock.yaml"],
    });
  });

  it("ignores a lockfile change to packages the Storybook neither bundles nor builds with", async () => {
    const result = await traceAgainstBase({
      "pnpm-lock.yaml": {
        base: pnpmLock({ bullmq: "5.80.0", eslint: "9.0.0" }),
        current: pnpmLock({ bullmq: "5.81.3", eslint: "9.1.0" }),
      },
    });

    expect(result).toMatchObject({ mode: "some", storyIds: [] });
  });

  it("captures everything when a lockfile bumps a dependency the Storybook bundles", async () => {
    const result = await traceAgainstBase({
      "pnpm-lock.yaml": {
        base: pnpmLock({ clsx: "2.1.1" }),
        current: pnpmLock({ clsx: "2.1.2" }),
      },
    });

    expect(result).toEqual({
      mode: "all",
      reason: "dependencies changed (pnpm-lock.yaml: clsx is bundled into the Storybook)",
    });
  });

  it.each(["vite", "@storybook/react-vite", "tailwindcss", "sass"])(
    "captures everything when a lockfile bumps the build tool %s",
    async (name) => {
      const result = await traceAgainstBase({
        "pnpm-lock.yaml": {
          base: pnpmLock({ [name]: "1.0.0" }),
          current: pnpmLock({ [name]: "1.0.1" }),
        },
      });

      expect(result).toEqual({
        mode: "all",
        reason: `dependencies changed (pnpm-lock.yaml: ${name} builds the Storybook)`,
      });
    },
  );

  it("captures everything when a lockfile bumps a configured build dependency", async () => {
    const result = await traceAgainstBase(
      {
        "pnpm-lock.yaml": {
          base: pnpmLock({ "@acme/design-tokens": "1.0.0" }),
          current: pnpmLock({ "@acme/design-tokens": "1.1.0" }),
        },
      },
      { buildDependencies: ["@acme/*"] },
    );

    expect(result).toMatchObject({ mode: "all" });
  });

  it("captures everything when the lockfile can't be read", async () => {
    const result = await traceAgainstBase({
      "apps/web/bun.lockb": { base: "\u0000a", current: "\u0000b" },
    });

    expect(result).toEqual({ mode: "all", reason: "dependencies changed (apps/web/bun.lockb)" });
  });

  it("captures everything when a file matches externals", async () => {
    const result = await trace(["apps/web/public/logo.png"], { externals: ["apps/web/public/**"] });

    expect(result).toEqual({ mode: "all", reason: 'apps/web/public/logo.png matches "externals"' });
  });

  it("ignores a file matching untraced, even one that would otherwise capture everything", async () => {
    const result = await trace(["pnpm-lock.yaml"], { untraced: ["pnpm-lock.yaml"] });

    expect(result).toMatchObject({ mode: "some", storyIds: [], ignoredFiles: ["pnpm-lock.yaml"] });
  });

  it("captures everything when the build has no stats file", async () => {
    await createRepo(viteRepoFiles);
    const storybookDir = await writeBuild(viteGraph, viteEntries, { stats: false });

    const result = await findAffectedStories({
      storybookDir,
      projectDir: webDir(),
      repoRoot,
      changedFiles: [],
    });

    expect(result).toEqual({
      mode: "all",
      reason: "preview-stats.json or index.json is missing; build Storybook with --stats-json",
    });
  });

  it("captures everything when the stats file is cut off", async () => {
    await createRepo(viteRepoFiles);
    const storybookDir = await writeBuild(viteGraph, viteEntries);
    await writeFile(path.join(storybookDir, "preview-stats.json"), '{"modules": [{"name": ');

    const result = await findAffectedStories({
      storybookDir,
      projectDir: webDir(),
      repoRoot,
      changedFiles: [],
    });

    expect(result).toMatchObject({ mode: "all" });
    expect(result.mode === "all" && result.reason).toContain("could not parse preview-stats.json");
  });

  it("traces stats written by Webpack", async () => {
    await createRepo(viteRepoFiles);
    const { "./src/Form.stories.tsx": formStoryReasons, ...graph } = viteGraph;
    const storybookDir = await writeBuild(
      {
        ...graph,
        [STORIES_INDEX]: [null],
        "./src/Form.stories.tsx + 1 modules": formStoryReasons!,
      },
      viteEntries,
      { version: "5.101.0" },
    );

    const result = await findAffectedStories({
      storybookDir,
      projectDir: webDir(),
      repoRoot,
      changedFiles: ["apps/web/src/Form.tsx"],
    });

    expect(result).toMatchObject({ mode: "some", storyIds: ["form--default"] });
  });

  it("captures everything when run from somewhere other than where Storybook was built", async () => {
    await createRepo(viteRepoFiles);
    const storybookDir = await writeBuild(viteGraph, viteEntries);

    const result = await findAffectedStories({
      storybookDir,
      projectDir: repoRoot,
      repoRoot,
      changedFiles: ["apps/web/src/Form.tsx"],
    });

    expect(result).toMatchObject({ mode: "all" });
  });

  it("captures everything when the stats file does not describe the indexed stories", async () => {
    await createRepo(viteRepoFiles);
    const withoutForm = Object.fromEntries(
      Object.entries(viteGraph).filter(([name]) => name !== "./src/Form.stories.tsx"),
    );
    const storybookDir = await writeBuild(withoutForm, viteEntries);

    const result = await findAffectedStories({
      storybookDir,
      projectDir: webDir(),
      repoRoot,
      changedFiles: [],
    });

    expect(result).toMatchObject({ mode: "all" });
  });

  it("follows stories that import other stories", async () => {
    await createRepo([...viteRepoFiles, "apps/web/src/Page.stories.tsx"]);
    const storybookDir = await writeBuild(
      {
        ...viteGraph,
        "./src/Button.stories.tsx": [STORIES_INDEX, "./src/Page.stories.tsx"],
        "./src/Page.stories.tsx": [STORIES_INDEX],
      },
      [...viteEntries, { id: "page--default", importPath: "./src/Page.stories.tsx" }],
    );

    const result = await findAffectedStories({
      storybookDir,
      projectDir: webDir(),
      repoRoot,
      changedFiles: ["apps/web/src/Button.stories.tsx"],
    });

    expect(result).toMatchObject({
      mode: "some",
      storyIds: ["button--primary", "button--secondary", "page--default"],
    });
  });

  it("ends at docs pages without capturing them", async () => {
    await createRepo([...viteRepoFiles, "apps/web/src/Intro.mdx", "apps/web/src/Logo.tsx"]);
    const storybookDir = await writeBuild(
      {
        ...viteGraph,
        "./src/Intro.mdx": [STORIES_INDEX],
        "./src/Logo.tsx": ["./src/Intro.mdx"],
      },
      [...viteEntries, { id: "intro--docs", importPath: "./src/Intro.mdx", type: "docs" }],
    );

    const result = await findAffectedStories({
      storybookDir,
      projectDir: webDir(),
      repoRoot,
      changedFiles: ["apps/web/src/Logo.tsx"],
    });

    expect(result).toMatchObject({ mode: "some", storyIds: [], storyFiles: [] });
  });
});
