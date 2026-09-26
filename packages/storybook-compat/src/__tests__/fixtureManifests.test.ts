import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { findAffectedStories } from "../affectedStories";
import { availableStorybookFixtures } from "../fixtures";
import { readStoryTargets } from "../manifest";
import { assertSupportedStorybookBuild, readStorybookBuildVersion } from "../version";

const EXPECTED_STORY_IDS = [
  "components-button--default",
  "components-button--play-throws",
  "components-button--skipped",
  "components-button--with-ovr-parameters",
  "components-button--with-play",
];

const fixtures = availableStorybookFixtures();

describe.skipIf(fixtures.length === 0)("built Storybook fixtures", () => {
  it.each(fixtures)(
    "Storybook $major is built with the major it claims and is above the supported minimum",
    async (fixture) => {
      const detected = await readStorybookBuildVersion(fixture.buildDir);

      expect(detected.version).toMatch(new RegExp(`^${fixture.major}\\.`));
      expect(detected.indexVersion).toBeGreaterThanOrEqual(5);
      await expect(assertSupportedStorybookBuild(fixture.buildDir)).resolves.toBeDefined();
    },
  );

  it.each(fixtures)("Storybook $major lists every story and no docs page", async (fixture) => {
    const targets = await readStoryTargets(fixture.buildDir);

    expect(targets.map((target) => target.id).sort()).toEqual(EXPECTED_STORY_IDS);
    expect(targets.every((target) => target.title === "Components/Button")).toBe(true);
    expect(targets.map((target) => target.name)).toContain("Default");
  });

  it.each(fixtures)(
    "Storybook $major traces a component change to its stories",
    async (fixture) => {
      const repoRoot = path.resolve(fileURLToPath(import.meta.url), "../../../../..");
      const component = path.relative(repoRoot, path.join(fixture.dir, "src/Button.jsx"));

      const result = await findAffectedStories({
        storybookDir: fixture.buildDir,
        projectDir: fixture.dir,
        repoRoot,
        changedFiles: [component],
      });

      expect(result.mode === "some" && result.storyIds.sort()).toEqual(EXPECTED_STORY_IDS);
    },
  );

  it.each(fixtures)(
    "Storybook $major captures everything when preview changes",
    async (fixture) => {
      const repoRoot = path.resolve(fileURLToPath(import.meta.url), "../../../../..");
      const preview = path.relative(repoRoot, path.join(fixture.dir, ".storybook/preview.js"));

      const result = await findAffectedStories({
        storybookDir: fixture.buildDir,
        projectDir: fixture.dir,
        repoRoot,
        changedFiles: [preview],
      });

      expect(result.mode).toBe("all");
    },
  );
});
