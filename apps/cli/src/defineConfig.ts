export type Viewport = {
  name?: string;
  browser?: "chromium" | "firefox" | "webkit";
  width: number;
  /** Omit to capture the full page height instead of a fixed crop. */
  height?: number;
};

export type OvrConfig = {
  /** Every viewport available, named or not. */
  viewports?: readonly Viewport[];
  /**
   * Names from `viewports` captured automatically for every story.
   * Omit to default to every named viewport. Unnamed viewports are
   * always opt-in only (they can't be referenced here or by a story).
   */
  defaultViewports?: readonly string[];
  /** Default diff threshold (0–1) applied to every story. Defaults to 0.05. */
  diffThreshold?: number;
};

/**
 * Per-story override, set via Storybook `parameters.ovr` on a story:
 * - `viewports`: string entries reference a `name` from this config's `viewports` list (default or
 *   not); object entries `{ browser?, width, height? }` define a one-off viewport inline.
 *   Overriding replaces the default viewport list for that story (not merged).
 * - `diffThreshold`: replaces this config's `diffThreshold` for this story only.
 */
export type OvrStoryParameters = {
  viewports?: (string | Omit<Viewport, "name">)[];
  diffThreshold?: number;
};

type ViewportName<V extends readonly Viewport[]> = Extract<V[number]["name"], string>;

/** `viewports` must be an inline array literal — assigning it to a variable first loses the name types `defaultViewports` is checked against. */
export const defineConfig = <const V extends readonly Viewport[] = []>(config: {
  viewports?: V;
  defaultViewports?: ViewportName<V>[];
  diffThreshold?: number;
}): OvrConfig => config;
