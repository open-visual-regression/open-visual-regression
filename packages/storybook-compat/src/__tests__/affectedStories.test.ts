import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { findAffectedStories, globToRegExp } from "../affectedStories";
import type { AffectedStoriesInput } from "../affectedStories";

type Graph = Record<string, (string | null)[]>;

let repoRoot: string;

// A monorepo with a Storybook in apps/web that bundles packages/ui from source.
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
  options: { stats?: boolean } = {},
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
    await writeFile(path.join(storybookDir, "preview-stats.json"), JSON.stringify({ modules }));
  }

  return storybookDir;
};

const STORIES_INDEX = "/virtual:/@storybook/builder-vite/storybook-stories.js";

// Vite-shaped graph: paths relative to apps/web, preview.tsx only ever appears as a reason.
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
  return findAffectedStories({ storybookDir, repoRoot, changedFiles, ...options });
};

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
      repoRoot,
      changedFiles: ["apps/web/src/setup.ts"],
    });

    expect(result).toMatchObject({ mode: "all" });
  });

  it("treats a custom config directory as Storybook configuration", async () => {
    const result = await trace(["apps/web/config/storybook/main.ts"], {
      configDir: "/nonexistent",
    });
    expect(result).toMatchObject({ mode: "some" });

    const custom = await findAffectedStories({
      storybookDir: path.join(repoRoot, "apps/web/storybook-static"),
      repoRoot,
      configDir: path.join(repoRoot, "apps/web/config/storybook"),
      changedFiles: ["apps/web/config/storybook/main.ts"],
    });
    expect(custom).toMatchObject({ mode: "all" });
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
    // e.g. a CSS file inlined by another stylesheet's @import, which never becomes a module
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

    const result = await findAffectedStories({ storybookDir, repoRoot, changedFiles: [] });

    expect(result).toEqual({
      mode: "all",
      reason: "preview-stats.json is missing; build Storybook with --stats-json",
    });
  });

  it("captures everything when the story files cannot be found in the repository", async () => {
    await createRepo([]);
    const storybookDir = await writeBuild(viteGraph, viteEntries);

    const result = await findAffectedStories({ storybookDir, repoRoot, changedFiles: [] });

    expect(result).toMatchObject({ mode: "all" });
  });

  it("captures everything when the stats file does not describe the indexed stories", async () => {
    await createRepo(viteRepoFiles);
    const withoutForm = Object.fromEntries(
      Object.entries(viteGraph).filter(([name]) => name !== "./src/Form.stories.tsx"),
    );
    const storybookDir = await writeBuild(withoutForm, viteEntries);

    const result = await findAffectedStories({ storybookDir, repoRoot, changedFiles: [] });

    expect(result).toMatchObject({ mode: "all" });
  });

  it("finds the project from the working directory when the build is written elsewhere", async () => {
    await createRepo(viteRepoFiles);
    const built = await writeBuild(viteGraph, viteEntries);
    const storybookDir = path.join(repoRoot, "dist/storybook");
    await mkdir(path.dirname(storybookDir), { recursive: true });
    await symlink(built, storybookDir);

    const result = await findAffectedStories({
      storybookDir,
      repoRoot,
      cwd: path.join(repoRoot, "apps/web"),
      changedFiles: ["apps/web/src/Form.tsx"],
    });

    expect(result).toMatchObject({ mode: "some", storyIds: ["form--default"] });
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
      repoRoot,
      changedFiles: ["apps/web/src/Logo.tsx"],
    });

    expect(result).toMatchObject({ mode: "some", storyIds: [], storyFiles: [] });
  });

  it("resolves a workspace package linked through node_modules to its source", async () => {
    await createRepo(viteRepoFiles);
    await mkdir(path.join(repoRoot, "apps/web/node_modules/@acme"), { recursive: true });
    await symlink(
      path.join(repoRoot, "packages/ui"),
      path.join(repoRoot, "apps/web/node_modules/@acme/ui"),
    );
    const linked = Object.fromEntries(
      Object.entries(viteGraph).filter(([name]) => !name.includes("packages/ui")),
    );
    const storybookDir = await writeBuild(
      { ...linked, "./node_modules/@acme/ui/src/utils.ts": ["./src/Form.tsx"] },
      viteEntries,
    );

    const result = await findAffectedStories({
      storybookDir,
      repoRoot,
      changedFiles: ["packages/ui/src/utils.ts"],
    });

    expect(result).toMatchObject({ mode: "some", storyIds: ["form--default"] });
  });

  it("reads webpack stats, with loader prefixes, concatenated modules and entry reasons", async () => {
    await createRepo([...viteRepoFiles, "apps/web/.storybook/preview.js"]);
    const storybookDir = await writeBuild({}, viteEntries);
    const context = "./src sync recursive \\.stories\\.tsx$";
    await writeFile(
      path.join(storybookDir, "preview-stats.json"),
      JSON.stringify({
        modules: [
          { name: "./storybook-stories.js", reasons: [{ moduleName: null }] },
          { name: context, reasons: [{ moduleName: "./storybook-stories.js" }] },
          { name: "./src/Button.stories.tsx", reasons: [{ moduleName: context }] },
          { name: "./src/Form.stories.tsx", reasons: [{ moduleName: context }] },
          {
            name: "./src/Form.tsx + 1 modules",
            reasons: [{ moduleName: "./src/Form.stories.tsx" }],
            modules: [{ name: "./src/Form.tsx" }, { name: "./src/Field.tsx" }],
          },
          {
            name: "css-loader!./src/globals.css",
            reasons: [{ moduleName: "./.storybook/preview.js" }],
          },
          { name: "./.storybook/preview.js", reasons: [{ moduleName: null }] },
        ],
      }),
    );

    const traceWebpack = (changedFiles: string[]) =>
      findAffectedStories({ storybookDir, repoRoot, changedFiles });

    expect(await traceWebpack(["apps/web/src/Field.tsx"])).toMatchObject({
      mode: "some",
      storyIds: ["form--default"],
    });
    expect(await traceWebpack(["apps/web/src/globals.css"])).toMatchObject({ mode: "all" });
    expect(await traceWebpack(["apps/web/.storybook/main.js"])).toMatchObject({ mode: "all" });
  });
});

describe("globToRegExp", () => {
  it.each([
    ["public/**", "public/a/b.png", true],
    ["public/**", "public", false],
    ["**/*.css", "a/b/c.css", true],
    ["**/*.css", "c.css", true],
    ["src/*.json", "src/a.json", true],
    ["src/*.json", "src/a/b.json", false],
    ["file?.txt", "file1.txt", true],
    ["a.b", "axb", false],
  ])("%s matches %s: %s", (glob, file, expected) => {
    expect(globToRegExp(glob).test(file)).toBe(expected);
  });
});
