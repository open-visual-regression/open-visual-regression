import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../fixtures");

export type StorybookFixture = {
  // Directory name under fixtures/, and the label used in test names.
  name: string;
  // The Storybook major the fixture pins.
  major: number;
  dir: string;
  buildDir: string;
};

// One fixture per supported Storybook major. `v8` pins the exact minimum
// (8.5.x) rather than the newest 8.x, so the floor we advertise is the floor
// that gets exercised.
export const STORYBOOK_FIXTURES: StorybookFixture[] = [8, 9, 10].map((major) => {
  const dir = path.join(FIXTURES_DIR, `v${major}`);
  return { name: `v${major}`, major, dir, buildDir: path.join(dir, "storybook-static") };
});

export const isFixtureBuilt = (fixture: StorybookFixture): boolean =>
  existsSync(path.join(fixture.buildDir, "index.json"));

// Fixtures are real Storybook installs, so they are built on demand rather than
// committed. Tests skip when they are missing locally, but CI sets
// OVR_REQUIRE_STORYBOOK_FIXTURES so a missing build fails the run instead of
// quietly reducing coverage to nothing.
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
