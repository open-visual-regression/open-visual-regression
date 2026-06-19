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
};

/**
 * Per-story override, set via Storybook `parameters.ovr.viewports` on a story:
 * - string entries reference a `name` from this config's `viewports` list (default or not)
 * - object entries `{ browser?, width, height? }` define a one-off viewport inline
 * Overriding replaces the default viewport list for that story (not merged).
 */
export type OvrStoryParameters = {
  viewports?: (string | Omit<Viewport, "name">)[];
};

type ViewportName<V extends readonly Viewport[]> = Extract<V[number]["name"], string>;

/** `viewports` must be an inline array literal — assigning it to a variable first loses the name types `defaultViewports` is checked against. */
export const defineConfig = <const V extends readonly Viewport[] = []>(config: {
  viewports?: V;
  defaultViewports?: ViewportName<V>[];
}): OvrConfig => config;
