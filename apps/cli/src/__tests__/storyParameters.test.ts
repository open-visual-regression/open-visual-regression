import { describe, expect, it } from "vitest";

import type { OvrStoryParameters as ResolvedStoryParameters } from "@ovr/storybook-compat/parameters";

import type { OvrStoryParameters as PublishedStoryParameters } from "../defineConfig";

// The published type is declared separately from the one the worker resolves,
// because this package cannot depend on a private one. Both literals below are
// checked for missing and excess keys, so `tsc` fails if the two ever diverge.
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
    const parameters = {
      viewports: ["mobile", { browser: "webkit", width: 1440 }],
      diffThreshold: 0.02,
      skip: false,
    } satisfies PublishedStoryParameters satisfies ResolvedStoryParameters;

    expect(parameters.viewports).toHaveLength(2);
  });
});
