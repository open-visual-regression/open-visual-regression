/**
 * A viewport a story asks for through `parameters.ovr.viewports`. A string
 * references a `name` from the project's `ovr.config`; an object defines a
 * one-off viewport inline.
 */
export type OvrStoryParameterViewport =
  | string
  | { browser?: string; width: number; height?: number };

/**
 * The per-story overrides the worker reads out of Storybook's
 * `parameters.ovr`, merged by Storybook across global, component, and story
 * level before it reaches us.
 *
 * This is what the worker actually finds in a bundle, so every field is shaped
 * the way untrusted user input arrives: `browser` is a plain `string` here even
 * though only a few values launch, and is validated at capture time.
 *
 * The published CLI re-declares this type in `apps/cli/src/defineConfig.ts`
 * (narrower, for editor feedback) because it ships to npm and cannot import
 * from this private package. `apps/cli/src/__tests__/storyParameters.test.ts`
 * fails type-checking if the two ever drift apart.
 */
export type OvrStoryParameters = {
  /** Replaces (not merges with) the config's default viewports for this story. */
  viewports?: OvrStoryParameterViewport[];
  /** Replaces the config's `diffThreshold` for this story. */
  diffThreshold?: number;
  /** Skips this story entirely: no snapshots are created, so nothing is captured or diffed. */
  skip?: boolean;
};
