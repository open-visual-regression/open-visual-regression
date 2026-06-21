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
  /**
   * Diff threshold applied to every story's snapshots, as a fraction of
   * pixels that may differ (0, 1]. Override per story via
   * `parameters.ovr.diffThreshold`.
   * @default 0.05
   */
  diffThreshold?: number;
};

/** Per-story override, set via Storybook `parameters.ovr` on a story. */
export type OvrStoryParameters = {
  /**
   * Replaces (not merges with) the config's default viewport list for this
   * story only. String entries reference a `name` from this config's
   * `viewports` list (default or not); object entries
   * `{ browser?, width, height? }` define a one-off viewport inline.
   */
  viewports?: (string | Omit<Viewport, "name">)[];
  /** Replaces the config's `diffThreshold` for this story only. */
  diffThreshold?: number;
};

type ViewportName<V extends readonly Viewport[]> = Extract<V[number]["name"], string>;

/** `viewports` must be an inline array literal — assigning it to a variable first loses the name types `defaultViewports` is checked against. */
export const defineConfig = <const V extends readonly Viewport[] = []>(config: {
  /** Every viewport available, named or not. */
  viewports?: V;
  /**
   * Names from `viewports` captured automatically for every story.
   * Omit to default to every named viewport. Unnamed viewports are
   * always opt-in only (they can't be referenced here or by a story).
   */
  defaultViewports?: ViewportName<V>[];
  /**
   * Diff threshold applied to every story's snapshots, as a fraction of
   * pixels that may differ (0, 1]. Override per story via
   * `parameters.ovr.diffThreshold`.
   * @default 0.05
   */
  diffThreshold?: number;
}): OvrConfig => config;
