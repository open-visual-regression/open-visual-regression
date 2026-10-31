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
  options: { stats?: boolean; version?: string; nested?: Record<string, string[]> } = {},
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
      modules: options.nested?.[name]?.map((inner) => ({
        name: inner,
        reasons: graph[inner]?.map((moduleName) => ({ moduleName })),
      })),
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
  "./../../node_modules/react/index.js": ["./src/Button.tsx"],
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
      unbundledDependencies: [],
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
      unbundledDependencies: [],
    });
  });

  it("captures everything when a non-code file changes in a package the bundle uses", async () => {
    const result = await trace(["packages/ui/src/tokens.json"]);

    expect(result).toMatchObject({ mode: "all" });
    expect(result.mode === "all" && result.reason).toContain("packages/ui/src/tokens.json");
  });

  it.each([
    "packages/ui/src/tokens.css",
    "packages/ui/src/Modal.module.css",
    "packages/ui/src/theme.scss",
    "packages/ui/src/form.sass",
    "packages/ui/src/form.less",
    "packages/ui/src/form.styl",
    "packages/ui/src/form.pcss",
  ])("ignores the stylesheet %s that no story imports, since it cannot render", async (file) => {
    const result = await trace([file]);

    expect(result).toEqual({ mode: "some", storyIds: [], storyFiles: [], ignoredFiles: [file] });
  });

  it("follows a changed stylesheet up to the stories that import it", async () => {
    await createRepo([...viteRepoFiles, "packages/ui/src/button.css"]);
    const storybookDir = await writeBuild(
      { ...viteGraph, "./../../packages/ui/src/button.css": ["./src/Form.tsx"] },
      viteEntries,
    );

    const result = await findAffectedStories({
      storybookDir,
      projectDir: webDir(),
      repoRoot,
      changedFiles: ["packages/ui/src/button.css"],
    });

    expect(result).toMatchObject({
      mode: "some",
      storyIds: ["form--default"],
      storyFiles: [
        {
          file: "apps/web/src/Form.stories.tsx",
          via: [
            "packages/ui/src/button.css",
            "apps/web/src/Form.tsx",
            "apps/web/src/Form.stories.tsx",
          ],
        },
      ],
      ignoredFiles: [],
    });
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
    "captures everything when the lockfile %s changes and its old version cannot be read",
    async (lockfile) => {
      expect(await trace([lockfile])).toMatchObject({ mode: "all" });
    },
  );

  describe("with the lockfile at the base commit", () => {
    const yarnLock = (packages: Record<string, string>): string =>
      [
        "# yarn lockfile v1",
        ...Object.entries(packages).map(
          ([name, version]) =>
            `\n"${name}@^${version}":\n  version "${version}"\n  integrity sha512-${version}`,
        ),
      ].join("\n");

    const traceLockfile = async (
      file: string,
      before: string | undefined,
      after: string,
      graph: Graph = viteGraph,
    ) => {
      await createRepo(viteRepoFiles);
      await writeFile(path.join(repoRoot, file), after);
      const storybookDir = await writeBuild(graph, viteEntries);
      return findAffectedStories({
        storybookDir,
        projectDir: webDir(),
        repoRoot,
        changedFiles: [file],
        readBaseFile: async (requested) => (requested === file ? before : undefined),
      });
    };

    const base = { react: "18.3.1", electron: "30.0.1", "@types/node": "20.0.0" };

    it("ignores a change to packages the Storybook does not bundle", async () => {
      const result = await traceLockfile(
        "yarn.lock",
        yarnLock(base),
        yarnLock({ ...base, electron: "30.0.2", "@types/node": "20.1.0" }),
      );

      expect(result).toEqual({
        mode: "some",
        storyIds: [],
        storyFiles: [],
        ignoredFiles: ["yarn.lock"],
        unbundledDependencies: [{ lockfile: "yarn.lock", packages: ["@types/node", "electron"] }],
      });
    });

    it("captures everything when a bundled package changes", async () => {
      const result = await traceLockfile(
        "yarn.lock",
        yarnLock(base),
        yarnLock({ ...base, react: "18.3.2", electron: "30.0.2" }),
      );

      expect(result).toEqual({ mode: "all", reason: "dependencies changed (yarn.lock: react)" });
    });

    it("captures everything when a package that builds the Storybook changes", async () => {
      const result = await traceLockfile(
        "yarn.lock",
        yarnLock({ ...base, vite: "6.0.0" }),
        yarnLock({ ...base, vite: "6.0.1" }),
      );

      expect(result).toEqual({ mode: "all", reason: "dependencies changed (yarn.lock: vite)" });
    });

    it("captures everything when the lockfile cannot be parsed", async () => {
      const result = await traceLockfile("yarn.lock", yarnLock(base), "<<<<<<< HEAD\n");

      expect(result).toMatchObject({ mode: "all" });
      expect(result.mode === "all" && result.reason).toContain(
        "dependencies changed (yarn.lock) and could not be compared",
      );
    });

    it("captures everything when the lockfile format is not supported", async () => {
      const result = await traceLockfile("bun.lock", "{}", "{ }");

      expect(result).toEqual({ mode: "all", reason: "dependencies changed (bun.lock)" });
    });

    it("captures everything when the stats do not show which packages are bundled", async () => {
      const graph = Object.fromEntries(
        Object.entries(viteGraph).filter(([name]) => !name.includes("node_modules/")),
      );
      const result = await traceLockfile(
        "yarn.lock",
        yarnLock(base),
        yarnLock({ ...base, electron: "30.0.2" }),
        graph,
      );

      expect(result).toEqual({
        mode: "all",
        reason:
          "dependencies changed (yarn.lock) and preview-stats.json does not show which packages are bundled",
      });
    });
  });

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

  describe.each([
    [
      "Webpack",
      "./src/ lazy ^\\.\\/.*$ include: (?:\\/src(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.).)*?)\\/|\\/|$)(?!\\.)(?=.)[^/]*?\\.stories\\.tsx)$ chunkName: [request] namespace object",
      "5.101.0",
    ],
    [
      "Rspack",
      "./src|lazy|/^\\.\\/.*$/|include: /\\.stories\\.tsx$/|chunkName: [request]|namespace object",
      "1.5.0",
    ],
  ])("with %s scope hoisting", (_, context, version) => {
    const STORIES_ENTRY = "./storybook-stories.js";
    const graph: Graph = {
      [STORIES_ENTRY]: [null],
      [context]: [STORIES_ENTRY],
      "./src/Button.stories.tsx + 1 modules": [context],
      "./src/Button.stories.tsx": [context],
      "./src/Button.tsx": [context],
      "./src/Form.stories.tsx": [context],
      "./src/Form.tsx": ["./src/Form.stories.tsx"],
    };

    it("follows a module concatenated into a story file to that story file", async () => {
      await createRepo(viteRepoFiles);
      const storybookDir = await writeBuild(graph, viteEntries, {
        version,
        nested: {
          "./src/Button.stories.tsx + 1 modules": ["./src/Button.stories.tsx", "./src/Button.tsx"],
        },
      });

      const result = await findAffectedStories({
        storybookDir,
        projectDir: webDir(),
        repoRoot,
        changedFiles: ["apps/web/src/Button.tsx"],
      });

      expect(result).toMatchObject({
        mode: "some",
        storyIds: ["button--primary", "button--secondary"],
      });
    });

    it("captures everything for a module only the stories context loads", async () => {
      await createRepo(viteRepoFiles);
      const storybookDir = await writeBuild(graph, viteEntries, { version });

      const result = await findAffectedStories({
        storybookDir,
        projectDir: webDir(),
        repoRoot,
        changedFiles: ["apps/web/src/Button.tsx"],
      });

      expect(result).toMatchObject({ mode: "all" });
      expect(result.mode === "all" && result.reason).toContain(
        "is an entry of the Storybook preview",
      );
    });
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
