import { describe, expect, it } from "vitest";

import type { OvrStoryParameters as ResolvedStoryParameters } from "@ovr/storybook-compat/parameters";

import type { OvrStoryParameters as PublishedStoryParameters } from "../defineConfig";

/**
 * The CLI ships to npm, so it cannot import the private `@ovr/storybook-compat`
 * package and re-declares the story parameters it documents. The worker reads
 * the canonical type out of a real bundle, so a field added to one side and not
 * the other would be documented but never applied (or applied but undocumented).
 *
 * `Declared<T>` requires every key of `T`, and both object literals are checked
 * for excess properties, so `tsc --noEmit` (`pnpm check-types` in CI) fails as
 * soon as either type gains or loses a field.
 */
type Declared<T> = { [K in keyof Required<T>]: true };

const publishedParameters: Declared<PublishedStoryParameters> = {
  viewports: true,
  diffThreshold: true,
  skip: true,
};

const resolvedParameters: Declared<ResolvedStoryParameters> = {
  viewports: true,
  diffThreshold: true,
  skip: true,
};

describe("parameters.ovr", () => {
  it("should declare the same fields the worker resolves from a bundle", () => {
    expect(Object.keys(publishedParameters).sort()).toEqual(Object.keys(resolvedParameters).sort());
  });

  it("should type a story the worker can resolve", () => {
    // The published type only narrows the canonical one (`browser` to the
    // browsers that actually launch), so anything it accepts must resolve.
    const parameters = {
      viewports: ["mobile", { browser: "webkit", width: 1440 }],
      diffThreshold: 0.02,
      skip: false,
    } satisfies PublishedStoryParameters satisfies ResolvedStoryParameters;

    expect(parameters.viewports).toHaveLength(2);
  });
});
