import { describe, expect, it } from "vitest";

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
  describe.each(fixtures)("Storybook $major", (fixture) => {
    it("is built with the major it claims and is above the supported minimum", async () => {
      const detected = await readStorybookBuildVersion(fixture.buildDir);

      expect(detected.version).toMatch(new RegExp(`^${fixture.major}\\.`));
      expect(detected.indexVersion).toBeGreaterThanOrEqual(5);
      await expect(assertSupportedStorybookBuild(fixture.buildDir)).resolves.toBeDefined();
    });

    it("lists every story and no docs page", async () => {
      const targets = await readStoryTargets(fixture.buildDir);

      expect(targets.map((target) => target.id).sort()).toEqual(EXPECTED_STORY_IDS);
      expect(targets.every((target) => target.title === "Components/Button")).toBe(true);
      expect(targets.map((target) => target.name)).toContain("Default");
    });
  });
});
