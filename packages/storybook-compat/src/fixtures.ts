import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../fixtures");

export type StorybookFixture = {
  name: string;
  major: number;
  dir: string;
  buildDir: string;
};

export const STORYBOOK_FIXTURES: StorybookFixture[] = [8, 9, 10].map((major) => {
  const dir = path.join(FIXTURES_DIR, `v${major}`);
  return { name: `v${major}`, major, dir, buildDir: path.join(dir, "storybook-static") };
});

export const isFixtureBuilt = (fixture: StorybookFixture): boolean =>
  existsSync(path.join(fixture.buildDir, "index.json"));

export const availableStorybookFixtures = (): StorybookFixture[] => {
  const built = STORYBOOK_FIXTURES.filter(isFixtureBuilt);

  if (process.env.OVR_REQUIRE_STORYBOOK_FIXTURES && built.length !== STORYBOOK_FIXTURES.length) {
    const missing = STORYBOOK_FIXTURES.filter((fixture) => !isFixtureBuilt(fixture))
      .map((fixture) => fixture.name)
      .join(", ");
    throw new Error(
      `OVR_REQUIRE_STORYBOOK_FIXTURES is set but these Storybook fixtures are not built: ${missing}. Run "pnpm --filter @ovr/storybook-compat fixtures:build".`,
    );
  }

  return built;
};
