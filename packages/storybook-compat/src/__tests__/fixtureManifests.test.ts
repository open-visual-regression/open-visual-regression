import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { findAffectedStories } from "../affectedStories";
import { availableStorybookFixtures } from "../fixtures";
import { readStoryTargets } from "../manifest";
import { readModuleGraph } from "../moduleGraph";
import { assertSupportedStorybookBuild, readStorybookBuildVersion } from "../version";

const EXPECTED_STORY_IDS = [
  "components-button--default",
  "components-button--play-throws",
  "components-button--skipped",
  "components-button--with-ovr-parameters",
  "components-button--with-play",
  "components-card--default",
  "components-lazy--default",
];

const PROJECT_FILE = /^\.\/(src|\.storybook)\//;

const PROJECT_IMPORTERS = [
  "./src/Button.css <- ./src/Button.jsx",
  "./src/Button.css <- ./src/Button.stories.jsx",
  "./src/Button.jsx <- ./src/Button.stories.jsx",
  "./src/Card.jsx <- ./src/Card.stories.jsx",
  "./src/Card.jsx <- ./src/Lazy.stories.jsx",
  "./src/global.css <- ./.storybook/preview.js",
  "./src/tones.js <- ./src/Button.jsx",
  "./src/tones.js <- ./src/Button.stories.jsx",
  "./src/tones.js <- ./src/Card.jsx",
  "./src/tones.js <- ./src/Card.stories.jsx",
  "./src/tones.js <- ./src/Lazy.stories.jsx",
];

const fixtures = availableStorybookFixtures();

const repoRoot = path.resolve(fileURLToPath(import.meta.url), "../../../../..");

const readProjectImporters = async (storybookDir: string): Promise<string[]> => {
  const graph = await readModuleGraph(storybookDir);
  if (!graph || "reason" in graph) {
    throw new Error(`could not read the module graph: ${graph?.reason ?? "missing"}`);
  }

  const importersOf = (name: string, found = new Set<string>()): Set<string> => {
    for (const parent of graph.importers.get(name) ?? []) {
      if (!found.has(parent)) {
        found.add(parent);
        importersOf(parent, found);
      }
    }
    return found;
  };

  return [...graph.importers.keys()]
    .filter((name) => PROJECT_FILE.test(name))
    .flatMap((name) =>
      [...importersOf(name)]
        .filter((parent) => PROJECT_FILE.test(parent))
        .map((parent) => `${name} <- ${parent}`),
    )
    .sort();
};

describe.skipIf(fixtures.length === 0)("built Storybook fixtures", () => {
  it.each(fixtures)(
    "Storybook $name is built with the major it claims and is above the supported minimum",
    async (fixture) => {
      const detected = await readStorybookBuildVersion(fixture.buildDir);

      expect(detected.version).toMatch(new RegExp(`^${fixture.major}\\.`));
      expect(detected.indexVersion).toBeGreaterThanOrEqual(5);
      await expect(assertSupportedStorybookBuild(fixture.buildDir)).resolves.toBeDefined();
    },
  );

  it.each(fixtures)("Storybook $name lists every story and no docs page", async (fixture) => {
    const targets = await readStoryTargets(fixture.buildDir);

    expect(targets.map((target) => target.id).sort()).toEqual(EXPECTED_STORY_IDS);
    expect(targets.map((target) => target.title)).toContain("Components/Button");
    expect(targets.map((target) => target.name)).toContain("Default");
  });

  it.each(fixtures)("Storybook $name reads the same project graph", async (fixture) => {
    expect(await readProjectImporters(fixture.buildDir)).toEqual(PROJECT_IMPORTERS);
  });

  it.each(fixtures)(
    "Storybook $name traces a shared module to every story that imports it",
    async (fixture) => {
      const shared = path.relative(repoRoot, path.join(fixture.dir, "src/tones.js"));

      const result = await findAffectedStories({
        storybookDir: fixture.buildDir,
        projectDir: fixture.dir,
        repoRoot,
        changedFiles: [shared],
      });

      expect(result.mode === "some" && result.storyIds.sort()).toEqual(EXPECTED_STORY_IDS);
    },
  );

  it.each(fixtures)("Storybook $name traces a component change to its stories", async (fixture) => {
    const component = path.relative(repoRoot, path.join(fixture.dir, "src/Card.jsx"));

    const result = await findAffectedStories({
      storybookDir: fixture.buildDir,
      projectDir: fixture.dir,
      repoRoot,
      changedFiles: [component],
    });

    expect(result.mode === "some" && result.storyIds.sort()).toEqual([
      "components-card--default",
      "components-lazy--default",
    ]);
  });

  it.each(fixtures)("Storybook $name captures everything when preview changes", async (fixture) => {
    const preview = path.relative(repoRoot, path.join(fixture.dir, ".storybook/preview.js"));

    const result = await findAffectedStories({
      storybookDir: fixture.buildDir,
      projectDir: fixture.dir,
      repoRoot,
      changedFiles: [preview],
    });

    expect(result.mode).toBe("all");
  });
});
