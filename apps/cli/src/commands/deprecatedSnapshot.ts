import { Command } from "commander";

import { createStorybookCommand } from "./upload/storybook";

export const SNAPSHOT_DEPRECATION_NOTICE =
  "Warning: `ovr snapshot` is deprecated and will be removed in a future release. Use `ovr upload` instead.";

export const deprecatedSnapshotCommand = new Command("snapshot")
  .description("Deprecated: use `ovr upload` instead")
  .hook("preSubcommand", () => {
    console.warn(SNAPSHOT_DEPRECATION_NOTICE);
  })
  .addCommand(createStorybookCommand());
