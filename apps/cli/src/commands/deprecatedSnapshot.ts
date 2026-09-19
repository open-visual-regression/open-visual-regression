import { Command } from "commander";

import { createStorybookCommand } from "./upload/storybook";

export const SNAPSHOT_DEPRECATION_NOTICE =
  "Warning: `ovr snapshot` is deprecated and will be removed in a future release. Use `ovr upload` instead.";

/**
 * Kept so pipelines built against `ovr snapshot storybook` keep working. Delete
 * this group, and its registration, in the next major release.
 */
export const deprecatedSnapshotCommand = new Command("snapshot")
  .description("Deprecated: use `ovr upload` instead")
  .hook("preSubcommand", () => {
    console.warn(SNAPSHOT_DEPRECATION_NOTICE);
  })
  .addCommand(createStorybookCommand());
